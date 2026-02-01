import { v2 as cloudinary } from 'cloudinary';
import Product from "../models/Product.js";


// Add Product : /api/product/add
export const addProduct = async (req, res) => {
    try {
        let productData = JSON.parse(req.body.productData)

        const images = req.files;

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path,
                    { resource_type: 'image' });
                return result.secure_url
            })
        )
        await Product.create({ ...productData, image: imagesUrl })

        res.json({ success: true, message: 'Product Added' })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get Product : /api/product/list
export const productList = async (req, res) => {
    try {
        const products = await Product.find({})
        res.json({ success: true, products })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get Single Product : /api/product/id
export const productById = async (req, res) => {
    try {
        const { id } = req.body;
        const product = await Product.findById(id);
        res.json({ success: true, product });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Change Product in Stock : /api/product/stock
export const changeStock = async (req, res) => {
    try {
        const { id, inStock } = req.body;
        await Product.findByIdAndUpdate(id, { inStock });
        res.json({ success: true, message: 'Stock Updated' })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Delete Product : /api/product/remove/:id
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, message: 'Product Deleted' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// ---------------------------
// Smart Scan Logic
// ---------------------------

import { createWorker } from 'tesseract.js';
import stringSimilarity from 'string-similarity';
import fs from 'fs';

// Helper to find best match
const matchProductByName = (scannedName, allProducts) => {
    if (!scannedName || scannedName.length < 3) return null;

    const productNames = allProducts.map(p => p.name);
    const matches = stringSimilarity.findBestMatch(scannedName, productNames);

    // Confidence threshold (0.4 is loose, 0.6 is strict)
    if (matches.bestMatch.rating > 0.4) {
        return allProducts[matches.bestMatchIndex];
    }
    return null;
};

export const scanProductList = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        // 1. Perform OCR
        const worker = await createWorker('eng');
        const ret = await worker.recognize(req.file.path);
        const text = ret.data.text;
        await worker.terminate();

        // Clean up uploaded file if needed (depends on multer config, usually good to keep for debug or delete)
        // fs.unlinkSync(req.file.path); 

        // 2. Process Text (Split by lines)
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

        // 3. Fetch all products for matching
        const allProducts = await Product.find({}, 'name _id category offerPrice image');

        const foundProducts = [];
        const notFoundItems = [];

        // 4. Match lines to products
        lines.forEach(line => {
            // Basic cleaning: remove numbers, bullets, checkboxes
            const cleanLine = line.replace(/[^a-zA-Z\s]/g, '').trim();

            if (cleanLine.length > 2) {
                const match = matchProductByName(cleanLine, allProducts);
                if (match) {
                    // Avoid duplicates
                    if (!foundProducts.some(p => p._id.toString() === match._id.toString())) {
                        foundProducts.push(match);
                    }
                } else {
                    notFoundItems.push(cleanLine);
                }
            }
        });

        res.json({
            success: true,
            message: `Found ${foundProducts.length} items from your list!`,
            products: foundProducts,
            notFound: notFoundItems,
            rawText: text
        });

    } catch (error) {
        console.error("Scan Error:", error);
        res.status(500).json({ success: false, message: "Failed to scan image. Try a clearer photo." });
    }
};
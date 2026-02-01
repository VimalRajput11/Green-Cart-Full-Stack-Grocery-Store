import { v2 as cloudinary } from 'cloudinary';
import Product from "../models/Product.js";
import axios from 'axios';


// Add Product : /api/product/add
export const addProduct = async (req, res) => {
    try {
        let productData = JSON.parse(req.body.productData)

        const images = req.files;

        let imagesUrl = images.map((item) => item.path);
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

import { GoogleGenerativeAI } from '@google/generative-ai';
// import fs from 'fs'; // No longer needed

// Initialize Gemini
// genAI will be initialized inside handler

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
            return res.json({ success: false, message: 'No image uploaded' });
        }

        // 1. Fetch all products to give to Gemini for matching
        const allProducts = await Product.find({}, 'name _id category offerPrice image');
        const productListString = allProducts.map(p => `- ${p.name} (ID: ${p._id})`).join('\n');

        // 2. Prepare image for Gemini (fetch from Cloudinary URL)
        const response = await axios.get(req.file.path, { responseType: 'arraybuffer' });
        const imageBase64 = Buffer.from(response.data, 'binary').toString('base64');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
            You are a grocery store assistant. I will provide an image of a handwritten shopping list or a bill.
            Your task is to identify which items from the list below are mentioned in the image.
            
            Available Products:
            ${productListString}

            Analyze the image carefully. Match items by name, even if they are written in Hindi, Hinglish, or slightly differently (e.g., "Aloo" matches "Potato").
            Return ONLY a JSON object with the following structure:
            {
                "matches": ["PRODUCT_ID_1", "PRODUCT_ID_2"],
                "notFound": ["Items written in the list but not found in available products"],
                "summary": "A friendly summary of what you found"
            }
            Do not include any markdown formatting like \`\`\`json. Just the raw JSON.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: req.file.mimetype
                }
            }
        ]);

        const responseText = result.response.text();

        // Use regex to extract JSON if Gemini includes any extra text or backticks
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Could not parse AI response");
        }

        const aiData = JSON.parse(jsonMatch[0]);

        // Map IDs back to full product objects
        const foundProducts = allProducts.filter(p => aiData.matches.includes(p._id.toString()));
        const notFoundItems = aiData.notFound || [];

        res.json({
            success: true,
            message: aiData.summary || `Found ${foundProducts.length} items from your list!`,
            products: foundProducts,
            notFound: notFoundItems,
            rawText: "" // No longer needed
        });

        // No local cleanup needed for Cloudinary storage

    } catch (error) {
        console.error("Scan Error:", error);
        res.status(500).json({ success: false, message: "Failed to scan image. Gemini AI error." });
    }
};

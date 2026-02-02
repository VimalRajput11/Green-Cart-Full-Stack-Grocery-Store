import Category from '../models/Category.js';
import { v2 as cloudinary } from 'cloudinary';

// Helper to upload Buffer to Cloudinary using Stream
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: 'green-cart'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

// Add new category
const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const imageFile = req.file;

        if (!name) {
            return res.json({ success: false, message: "Category name is required" });
        }

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.json({ success: false, message: "Category already exists" });
        }

        let imageUrl = "";
        if (imageFile) {
            imageUrl = await uploadToCloudinary(imageFile.buffer);
        }

        const category = new Category({
            name,
            description,
            image: imageUrl
        });

        await category.save();
        res.json({ success: true, message: "Category added successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// List all categories
const listCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json({ success: true, categories });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Delete category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.body;
        await Category.findByIdAndDelete(id);
        res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { addCategory, listCategories, deleteCategory };

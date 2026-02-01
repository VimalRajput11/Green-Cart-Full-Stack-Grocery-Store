import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String } // URL from Cloudinary
}, { timestamps: true });

const Category = mongoose.model.category || mongoose.model('category', categorySchema);

export default Category;

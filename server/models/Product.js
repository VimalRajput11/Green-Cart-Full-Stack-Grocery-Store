import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: Array, required: true },
    price: { type: Number, required: true, min: [0, "Price cannot be negative"] },
    offerPrice: { type: Number, required: true, min: [0, "Offer price cannot be negative"] },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    weight: { type: String },
    stock: { type: Number, default: 0, min: [0, "Stock cannot be negative"] },
    inStock: { type: Boolean, default: true }
}, { timestamps: true })

const Product = mongoose.model.product || mongoose.model('product', productSchema)

export default Product;
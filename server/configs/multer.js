import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (it should already be configured via your configs/cloudinary.js, 
// but we need to pass the instance here)

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'green-cart-uploads',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

export const upload = multer({ storage });
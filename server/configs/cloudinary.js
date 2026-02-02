import { v2 as cloudinary } from 'cloudinary'

const connectCloudinary = async () => {
    const config = {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    };

    // Check if variables are missing
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
        console.error("CRITICAL: Cloudinary environment variables are missing!");
    } else {
        console.log("Cloudinary Config Loaded for:", config.cloud_name);
    }

    cloudinary.config({
        ...config,
        timeout: 120000,          // 2 minutes
        connect_timeout: 60000,   // 1 minute
        read_timeout: 60000       // 1 minute
    });
}

export default connectCloudinary;
import multer from "multer";

// Use memory storage to avoid local disk issues and package conflicts
const storage = multer.memoryStorage();

export const upload = multer({ storage });
import express from 'express';
import { addCategory, listCategories, deleteCategory } from '../controllers/categoryController.js';
import { upload } from '../configs/multer.js';
// import authMiddleware from '../middleware/auth.js'; // Assuming we might want to restrict this later

const categoryRouter = express.Router();

categoryRouter.post('/add', upload.single('image'), addCategory);
categoryRouter.get('/list', listCategories);
categoryRouter.post('/delete', deleteCategory);

export default categoryRouter;

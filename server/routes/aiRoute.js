import express from 'express';
import { generateRecipe } from '../controllers/aiController.js';

const aiRouter = express.Router();

aiRouter.post('/chat', generateRecipe);

export default aiRouter;

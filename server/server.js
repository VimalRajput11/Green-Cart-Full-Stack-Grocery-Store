import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import 'dotenv/config';
import userRouter from './routes/userRoute.js';
import sellerRouter from './routes/sellerRoute.js'
import connectCloudinary from './configs/cloudinary.js';
import productRoute from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import agentRouter from './routes/agentRoutes.js';

const app = express();
const port = process.env.PORT || 4000;
await connectCloudinary();
await connectDB();
const allowedOrigins = [process.env.FRONTEND_URL,process.env.BACKEND_URL];
app.use(cors({
  origin: 'https://green-cart-full-stack-grocery-store-d667.vercel.app',
  credentials: true // if using cookies or sessions
}));

//Middeware configuration
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials: true}));

app.get('/', (req,res) => res.send('API is working'));
app.use('/api/user', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/product', productRoute);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);
app.use('/api/agents', agentRouter);

app.listen(port, ()=>{
    console.log(`Server is running on http://localhost:${port}`);
    
});

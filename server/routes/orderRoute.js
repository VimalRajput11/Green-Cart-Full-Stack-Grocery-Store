import express from "express";
import authUser from "../middlewares/authUser.js";
import authSeller from "../middlewares/authSeller.js";
import {
  getAllOrders,
  getUserOrders,
  addOrder,
  placeOrderRazorpay,
  verifyRazorpayPayment,
  updateOrderStatus, // ✅ import the new controller
} from "../controllers/orderController.js";

const orderRouter = express.Router();
orderRouter.post('/cod', authUser, addOrder);
orderRouter.post('/razorpay', authUser, placeOrderRazorpay);
orderRouter.post('/verify', authUser, verifyRazorpayPayment);
orderRouter.get('/user', authUser, getUserOrders);

orderRouter.get('/seller', authSeller, getAllOrders);
orderRouter.put('/status/:orderId', authSeller, updateOrderStatus);

export default orderRouter;

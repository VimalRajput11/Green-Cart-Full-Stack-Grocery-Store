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
  deleteDeliveredOrders,
  deleteOrder,
} from "../controllers/orderController.js";

const orderRouter = express.Router();
orderRouter.post('/cod', authUser, addOrder);
orderRouter.post('/razorpay', authUser, placeOrderRazorpay);
orderRouter.post('/verify', authUser, verifyRazorpayPayment);
orderRouter.get('/user', authUser, getUserOrders);
orderRouter.delete('/user/:orderId', authUser, deleteOrder);

orderRouter.get('/seller', authSeller, getAllOrders);
orderRouter.post('/status', authSeller, updateOrderStatus); // Support POST for frontend compatibility
orderRouter.put('/status/:orderId', authSeller, updateOrderStatus);
orderRouter.delete('/delete-delivered', authSeller, deleteDeliveredOrders);

export default orderRouter;

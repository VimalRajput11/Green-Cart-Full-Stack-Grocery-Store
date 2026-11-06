import express from "express";
import authUser from "../middlewares/authUser.js";
import authSeller from "../middlewares/authSeller.js";
import {
  getAllOrders,
  getUserOrders,
  addOrder,
  placeOrderRazorpay,
  verifyRazorpayPayment,
  updateOrderStatus,
  deleteDeliveredOrders,
  deleteOrder,
  cancelOrderByUser,
  markRefunded,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

// Customer
orderRouter.post('/cod', authUser, addOrder);
orderRouter.post('/razorpay', authUser, placeOrderRazorpay);
orderRouter.post('/verify', authUser, verifyRazorpayPayment);
orderRouter.get('/user', authUser, getUserOrders);
orderRouter.post('/user/:orderId/cancel', authUser, cancelOrderByUser);
orderRouter.delete('/user/:orderId', authUser, deleteOrder);

// Seller
orderRouter.get('/seller', authSeller, getAllOrders);
orderRouter.post('/status', authSeller, updateOrderStatus);
orderRouter.put('/status/:orderId', authSeller, updateOrderStatus);
orderRouter.post('/:orderId/refunded', authSeller, markRefunded);
orderRouter.delete('/delete-delivered', authSeller, deleteDeliveredOrders);

export default orderRouter;

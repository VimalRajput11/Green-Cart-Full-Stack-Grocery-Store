import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

// Place order (Cash on Delivery)
export const addOrder = async (req, res) => {
  try {
    const { items, address } = req.body;
    const userId = req.userId;

    if (!address || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Address and items are required" });
    }

    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      amount += product.offerPrice * item.quantity;
    }
    amount += Math.floor(amount * 0.02); // Add tax or service fee

    await Order.create({
      userId,
      items,
      address,
      amount,
      paymentType: "COD",
      // isPaid will default to false, agent will mark it true after collecting cash
    });

    res.status(200).json({ success: true, message: "Order placed successfully (COD)" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error placing COD order", error: error.message });
  }
};

// Place order with Razorpay (Online)
export const placeOrderRazorpay = async (req, res) => {
  try {
    const { items, address } = req.body;
    const userId = req.userId;

    if (!address || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Address and items are required" });
    }

    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
      }
      amount += product.offerPrice * item.quantity;
    }

    amount += Math.ceil(amount * 0.02);

    const order = await Order.create({
      userId,
      items,
      address,
      amount,
      paymentType: "Online",
    });

    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `order_rcptid_${order._id}`,
      notes: {
        orderId: order._id.toString(),
        userId,
      },
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      orderId: order._id.toString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating Razorpay order", error: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    // console.log("Received payment verification request:", req.body);
    const userId = req.userId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId || !userId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    await Order.findByIdAndUpdate(orderId, {
      isPaid: true,
      paymentInfo: {
        paymentId: razorpay_payment_id,
      },
    });

    await User.findByIdAndUpdate(userId, { cartItems: {} });

    res.status(200).json({ success: true, message: "Payment verified and order marked as paid" });
  } catch (error) {
    console.error("Payment verification error:", error.message);
    res.status(500).json({ success: false, message: "Payment verification failed", error: error.message });
  }
};

// Fetch user-specific orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await Order.find({
      userId,
      $or: [
        { paymentType: "COD" },
        { paymentType: "Online", isPaid: true },
      ],
    })
      .populate({ path: "items.product", select: "name image category offerPrice" })
      .populate("address")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching user orders", error: error.message });
  }
};

// Admin: Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { paymentType: "COD" }, // Show all COD orders, regardless of payment status
        { paymentType: "Online", isPaid: true } // Only show paid online orders
      ],
    })
      .populate("items.product address")
      .populate("assignedTo", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching all orders", error: error.message });
  }
};


export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId: paramId } = req.params;
    const { orderId: bodyId, status } = req.body;
    const orderId = paramId || bodyId;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const validStatuses = ['Order Placed', 'Picked', 'Out for Delivery', 'Arriving', 'Reached Location', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update order status", error: error.message });
  }
};
export const deleteDeliveredOrders = async (req, res) => {
  try {
    const result = await Order.deleteMany({ status: 'Delivered' });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "No delivered orders found to delete" });
    }

    res.status(200).json({ success: true, message: `${result.deletedCount} delivered orders deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting delivered orders", error: error.message });
  }
};

// User: Delete specific order from history
export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not authorized" });
    }

    // Optional: Only allow deletion if Delivered or Cancelled
    if (!['Delivered', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, message: "Active orders cannot be deleted from history" });
    }

    await Order.findByIdAndDelete(orderId);

    res.status(200).json({ success: true, message: "Order deleted from history" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting order", error: error.message });
  }
};

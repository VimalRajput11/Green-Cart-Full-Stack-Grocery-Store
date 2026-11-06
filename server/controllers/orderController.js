import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import DeliveryAgent from "../models/DeliveryAgent.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import {
  STATUS, PRE_PICKUP, ACTIVE, FINAL, FULFILLABLE, addTimeline, restoreStock, generateOtp,
} from "../utils/orderFlow.js";

// Razorpay instance (created lazily so a missing env var can't crash the whole server at startup)
let razorpayInstance;
const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });
  }
  return razorpayInstance;
};

const fail = (res, code, message) => res.status(code).json({ success: false, message });

// Validate every line before touching stock, and price it from the DB
const priceItems = async (items) => {
  let subtotal = 0;
  const lines = [];
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Invalid quantity");
    const product = await Product.findById(item.product);
    if (!product) throw new Error("A product in your cart is no longer available");
    if (!(product.offerPrice >= 0)) throw new Error(`${product.name} is temporarily unavailable`);
    if ((product.stock || 0) < quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
    }
    subtotal += product.offerPrice * quantity;
    lines.push({ product, quantity });
  }
  // 2% handling fee, rounded to 2 decimals (matches the cart page)
  const amount = Math.round(subtotal * 1.02 * 100) / 100;
  return { lines, amount };
};

const takeStock = async (lines) => {
  const taken = [];
  try {
    for (const { product, quantity } of lines) {
      // Conditional decrement so two orders can't oversell the same unit
      const updated = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );
      if (!updated) throw new Error(`${product.name} just went out of stock`);
      taken.push({ id: product._id, quantity });
      if (updated.stock <= 0) await Product.findByIdAndUpdate(product._id, { inStock: false });
    }
  } catch (error) {
    // Roll back anything already taken for this order
    for (const { id, quantity } of taken) {
      await Product.findByIdAndUpdate(id, { $inc: { stock: quantity }, inStock: true });
    }
    throw error;
  }
};

// Place order (Cash on Delivery)
export const addOrder = async (req, res) => {
  try {
    const { items, address } = req.body;
    if (!address || !items || items.length === 0) return fail(res, 400, "Address and items are required");

    const { lines, amount } = await priceItems(items);
    await takeStock(lines);

    const order = new Order({
      userId: req.userId,
      items: lines.map(({ product, quantity }) => ({ product: product._id.toString(), quantity })),
      address,
      amount,
      paymentType: "COD",
      deliveryOtp: generateOtp(),
    });
    addTimeline(order, STATUS.PLACED, "customer", "Cash on delivery");
    await order.save();
    await User.findByIdAndUpdate(req.userId, { cartItems: {} });

    res.status(200).json({ success: true, message: "Order placed successfully", orderId: order._id });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Place order with Razorpay (Online)
export const placeOrderRazorpay = async (req, res) => {
  try {
    const { items, address } = req.body;
    if (!address || !items || items.length === 0) return fail(res, 400, "Address and items are required");

    const { lines, amount } = await priceItems(items);

    const order = await Order.create({
      userId: req.userId,
      items: lines.map(({ product, quantity }) => ({ product: product._id.toString(), quantity })),
      address,
      amount,
      paymentType: "Online",
      deliveryOtp: generateOtp(),
    });

    const razorpayOrder = await getRazorpay().orders.create({
      amount: Math.round(amount * 100), // in paise
      currency: "INR",
      receipt: `order_rcptid_${order._id}`,
      notes: { orderId: order._id.toString(), userId: req.userId },
    });

    res.status(200).json({ success: true, order: razorpayOrder, orderId: order._id.toString() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const userId = req.userId;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return fail(res, 400, "Missing required fields");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expectedSignature !== razorpay_signature) return fail(res, 400, "Invalid payment signature");

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) return fail(res, 404, "Order not found");
    if (order.isPaid) return res.json({ success: true, message: "Already verified" });

    const lines = [];
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) lines.push({ product, quantity: item.quantity });
    }
    try {
      await takeStock(lines);
    } catch (stockError) {
      // Paid, but stock ran out between checkout and payment: cancel and flag refund
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentInfo = { paymentId: razorpay_payment_id, razorpay_order_id };
      order.status = STATUS.CANCELLED;
      order.cancelReason = stockError.message;
      order.cancelledBy = "system";
      order.refundStatus = "Pending";
      order.stockRestored = true;
      addTimeline(order, STATUS.CANCELLED, "system", `${stockError.message}. Refund initiated.`);
      await order.save();
      return fail(res, 409, `${stockError.message}. Your payment will be refunded.`);
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentInfo = { paymentId: razorpay_payment_id, razorpay_order_id };
    addTimeline(order, STATUS.PLACED, "customer", "Paid online");
    await order.save();
    await User.findByIdAndUpdate(userId, { cartItems: {} });

    res.status(200).json({ success: true, message: "Payment verified and order placed" });
  } catch (error) {
    console.error("Payment verification error:", error.message);
    fail(res, 500, "Payment verification failed");
  }
};

// Fetch user-specific orders (with delivery OTP for active orders)
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.userId,
      deletedByUser: { $ne: true },
      ...FULFILLABLE,
    })
      .select("+deliveryOtp")
      .populate({ path: "items.product", select: "name image category offerPrice weight" })
      .populate("address")
      .populate("assignedTo", "name phone vehicleType vehicleNumber currentLocation")
      .sort({ createdAt: -1 })
      .lean();

    for (const order of orders) {
      // OTP only matters while the order is on its way
      if (!ACTIVE.includes(order.status)) delete order.deliveryOtp;
      // Share rider location only while they're carrying this order
      // Populated riders are shared objects across orders, so copy before trimming
      if (order.assignedTo) {
        order.assignedTo = { ...order.assignedTo };
        if (![STATUS.OUT, STATUS.ARRIVING, STATUS.REACHED].includes(order.status)) {
          delete order.assignedTo.currentLocation;
        }
      }
    }

    res.status(200).json({ success: true, orders });
  } catch (error) {
    fail(res, 500, "Error fetching your orders");
  }
};

// Customer cancels before the rider picks it up
export const cancelOrderByUser = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.userId });
    if (!order) return fail(res, 404, "Order not found");
    if (!PRE_PICKUP.includes(order.status)) return fail(res, 400, "Order is already on the way and can't be cancelled");

    const riderId = order.assignedTo;
    order.status = STATUS.CANCELLED;
    order.cancelReason = req.body?.reason || "Cancelled by customer";
    order.cancelledBy = "customer";
    order.assignedTo = null;
    if (order.isPaid && order.paymentType === "Online") order.refundStatus = "Pending";
    await restoreStock(order);
    addTimeline(order, STATUS.CANCELLED, "customer", order.cancelReason);
    await order.save();
    if (riderId) await syncRider(riderId);

    res.json({ success: true, message: order.refundStatus === "Pending" ? "Order cancelled. Refund initiated." : "Order cancelled" });
  } catch (error) {
    fail(res, 500, "Could not cancel order");
  }
};

// Admin/Seller: Get all orders + stats
export const getAllOrders = async (req, res) => {
  try {
    const allValidOrders = await Order.find(FULFILLABLE).select("amount isPaid status");
    const stats = {
      totalSales: allValidOrders.reduce((acc, order) => acc + (order.isPaid && order.status !== STATUS.CANCELLED ? order.amount : 0), 0),
      totalOrders: allValidOrders.length,
      pendingOrders: allValidOrders.filter((o) => ACTIVE.includes(o.status)).length,
    };

    const orders = await Order.find({ ...FULFILLABLE, deletedBySeller: { $ne: true } })
      .populate("items.product address")
      .populate("assignedTo", "name phone vehicleType vehicleNumber status")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders, stats });
  } catch (error) {
    fail(res, 500, "Error fetching orders");
  }
};

const syncRider = async (riderId) => {
  const rider = await DeliveryAgent.findById(riderId);
  if (!rider || rider.status === "Inactive") return;
  const active = await Order.countDocuments({ assignedTo: riderId, status: { $in: ACTIVE } });
  rider.status = active > 0 ? "On Delivery" : "Available";
  await rider.save();
};

// Seller actions: pack or cancel. Delivery steps belong to the rider.
export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.body.orderId;
    const { status, reason } = req.body;
    if (!orderId) return fail(res, 400, "Order ID is required");

    const order = await Order.findById(orderId);
    if (!order) return fail(res, 404, "Order not found");
    if (FINAL.includes(order.status)) return fail(res, 400, `Order is already ${order.status}`);

    if (status === STATUS.PACKED) {
      if (order.status !== STATUS.PLACED) return fail(res, 400, "Only new orders can be marked packed");
      order.status = STATUS.PACKED;
      order.packedAt = new Date();
      addTimeline(order, STATUS.PACKED, "seller");
    } else if (status === STATUS.CANCELLED) {
      const riderId = order.assignedTo;
      order.status = STATUS.CANCELLED;
      order.cancelReason = reason || "Cancelled by store";
      order.cancelledBy = "seller";
      if (order.isPaid && order.paymentType === "Online") order.refundStatus = "Pending";
      await restoreStock(order);
      addTimeline(order, STATUS.CANCELLED, "seller", order.cancelReason);
      await order.save();
      if (riderId) await syncRider(riderId);
      return res.json({ success: true, message: "Order cancelled" });
    } else {
      return fail(res, 400, "Store can only mark orders Packed or Cancelled. Delivery steps are updated by the rider.");
    }

    await order.save();
    res.status(200).json({ success: true, message: `Order marked ${order.status}` });
  } catch (error) {
    fail(res, 500, "Failed to update order status");
  }
};

// Seller marks a refund as done
export const markRefunded = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return fail(res, 404, "Order not found");
    if (order.refundStatus !== "Pending") return fail(res, 400, "No refund pending");
    order.refundStatus = "Refunded";
    addTimeline(order, "Refunded", "seller");
    await order.save();
    res.json({ success: true, message: "Refund marked as completed" });
  } catch (error) {
    fail(res, 500, "Server error");
  }
};

export const deleteDeliveredOrders = async (req, res) => {
  try {
    const result = await Order.updateMany(
      { status: { $in: FINAL }, deletedBySeller: { $ne: true }, refundStatus: { $ne: "Pending" } },
      { $set: { deletedBySeller: true } }
    );
    if (result.matchedCount === 0) return fail(res, 404, "No completed orders to clear");
    res.status(200).json({ success: true, message: `${result.modifiedCount} completed orders cleared from your view` });
  } catch (error) {
    fail(res, 500, "Error clearing orders");
  }
};

// User: hide a finished order from history
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.userId });
    if (!order) return fail(res, 404, "Order not found or not authorized");
    if (!FINAL.includes(order.status)) return fail(res, 400, "Active orders cannot be removed from history");
    order.deletedByUser = true;
    await order.save();
    res.status(200).json({ success: true, message: "Order removed from history" });
  } catch (error) {
    fail(res, 500, "Error deleting order");
  }
};

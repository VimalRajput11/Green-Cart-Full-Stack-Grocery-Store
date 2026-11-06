import crypto from "crypto";
import Product from "../models/Product.js";

// Single source of truth for the order lifecycle
export const STATUS = {
  PLACED: "Order Placed",
  PACKED: "Packed",
  PICKED: "Picked",
  OUT: "Out for Delivery",
  ARRIVING: "Arriving", // legacy status, treated like OUT
  REACHED: "Reached Location",
  DELIVERED: "Delivered",
  FAILED: "Delivery Failed",
  CANCELLED: "Cancelled",
};

export const ALL_STATUSES = Object.values(STATUS);

// Statuses where the order is still with the store (can be cancelled / reassigned)
export const PRE_PICKUP = [STATUS.PLACED, STATUS.PACKED];
// Statuses where the rider holds the parcel
export const IN_TRANSIT = [STATUS.PICKED, STATUS.OUT, STATUS.ARRIVING, STATUS.REACHED];
export const ACTIVE = [...PRE_PICKUP, ...IN_TRANSIT];
export const FINAL = [STATUS.DELIVERED, STATUS.FAILED, STATUS.CANCELLED];

// Max orders a rider can carry at once (batching)
export const MAX_ACTIVE_ORDERS = Number(process.env.MAX_ACTIVE_ORDERS_PER_RIDER) || 3;
// Flat payout per completed delivery
export const RIDER_PAYOUT = Number(process.env.RIDER_PAYOUT_PER_ORDER) || 30;

// Orders that are valid to fulfil: COD, or online orders that were actually paid
export const FULFILLABLE = {
  $or: [{ paymentType: "COD" }, { paymentType: "Online", isPaid: true }],
};

export const generateOtp = () => crypto.randomInt(1000, 10000).toString();

export const addTimeline = (order, status, by, note = "") => {
  order.timeline = order.timeline || [];
  order.timeline.push({ status, by, note, at: new Date() });
};

// Put items back in stock (cancelled / failed orders)
export const restoreStock = async (order) => {
  if (order.stockRestored) return;
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) continue;
    const newStock = (product.stock || 0) + item.quantity;
    await Product.findByIdAndUpdate(item.product, { stock: newStock, inStock: newStock > 0 });
  }
  order.stockRestored = true;
};

// Business timezone offset in minutes (default IST, +5:30). Servers run in UTC.
const TZ_OFFSET_MIN = Number(process.env.BUSINESS_TZ_OFFSET_MINUTES ?? 330);

// Start of the business day `daysAgo` days back, returned as a UTC Date
export const startOfDay = (daysAgo = 0) => {
  const local = new Date(Date.now() + TZ_OFFSET_MIN * 60000);
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() - daysAgo);
  return new Date(local.getTime() - TZ_OFFSET_MIN * 60000);
};

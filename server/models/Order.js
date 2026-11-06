import mongoose from "mongoose";
import { ALL_STATUSES, STATUS } from "../utils/orderFlow.js";

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    by: { type: String, enum: ["customer", "seller", "rider", "system"], default: "system" },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'user',
  },
  items: [
    {
      product: {
        type: String,
        required: true,
        ref: 'product',
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  amount: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
    ref: 'address',
  },

  status: {
    type: String,
    enum: ALL_STATUSES,
    default: STATUS.PLACED,
  },
  timeline: { type: [timelineSchema], default: [] },

  paymentType: {
    type: String,
    required: true,
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false,
  },
  paymentInfo: {
    paymentId: { type: String },
    razorpay_order_id: { type: String },
  },
  paidAt: { type: Date },
  // How a COD order was collected at the door
  collectionMethod: { type: String, enum: ["cash", "upi", null], default: null },
  // Cash collected by the rider and handed over to the store
  codSettled: { type: Boolean, default: false },
  codSettledAt: { type: Date },

  // Customer shares this with the rider at the door. Never sent to riders.
  deliveryOtp: { type: String, select: false },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryAgent',
    default: null,
  },
  assignedBy: { type: String, enum: ["seller", "rider", null], default: null },
  riderPayout: { type: Number, default: 0 },

  packedAt: { type: Date },
  acceptedAt: { type: Date },
  pickedAt: { type: Date },
  outForDeliveryAt: { type: Date },
  reachedAt: { type: Date },
  deliveredAt: { type: Date },

  cancelReason: { type: String },
  cancelledBy: { type: String },
  failReason: { type: String },
  refundStatus: { type: String, enum: ["None", "Pending", "Refunded"], default: "None" },
  stockRestored: { type: Boolean, default: false },

  deletedByUser: {
    type: Boolean,
    default: false,
  },
  deletedByAgent: {
    type: Boolean,
    default: false,
  },
  deletedBySeller: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

orderSchema.index({ assignedTo: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;

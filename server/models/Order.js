import mongoose from "mongoose";

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
    enum: ['Order Placed', 'Picked', 'Out for Delivery', 'Arriving', 'Reached Location', 'Delivered', 'Cancelled'],
    default: 'Order Placed',
  },

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
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryAgent',
    default: null,
  },
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

const Order = mongoose.models.order || mongoose.model('Order', orderSchema);
export default Order;

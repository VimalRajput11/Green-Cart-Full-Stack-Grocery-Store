import mongoose from "mongoose";

const deliveryAgentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  // Available = online & free, On Delivery = online with active orders, Inactive = offline
  status: { type: String, enum: ['Available', 'On Delivery', 'Inactive'], default: 'Inactive' },
  vehicleType: { type: String, enum: ['Bike', 'Scooter', 'Cycle', 'EV'], default: 'Bike' },
  vehicleNumber: { type: String, default: '', trim: true },
  isBlocked: { type: Boolean, default: false },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date },
  },
  lastSeenAt: { type: Date },
  assignedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
}, { timestamps: true });

export default mongoose.models.DeliveryAgent || mongoose.model("DeliveryAgent", deliveryAgentSchema);

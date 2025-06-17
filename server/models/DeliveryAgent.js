import mongoose from "mongoose";

const deliveryAgentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['Available', 'On Delivery', 'Inactive'], default: 'Available' },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
  },
  assignedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
});

export default mongoose.model("DeliveryAgent", deliveryAgentSchema);

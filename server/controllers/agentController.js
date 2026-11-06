import DeliveryAgent from '../models/DeliveryAgent.js';
import Order from '../models/Order.js';
import bcrypt from 'bcryptjs';
import Razorpay from "razorpay";
import crypto from "crypto";
import jwt from 'jsonwebtoken';
import {
  STATUS, PRE_PICKUP, IN_TRANSIT, ACTIVE, FULFILLABLE,
  MAX_ACTIVE_ORDERS, RIDER_PAYOUT, addTimeline, restoreStock, generateOtp, startOfDay,
} from '../utils/orderFlow.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
});

const publicAgent = (agent) => ({
  _id: agent._id,
  name: agent.name,
  phone: agent.phone,
  status: agent.status,
  vehicleType: agent.vehicleType,
  vehicleNumber: agent.vehicleNumber,
  isBlocked: agent.isBlocked,
  createdAt: agent.createdAt,
});

// Fields a rider is allowed to see about an order (never the OTP)
const RIDER_POPULATE = [
  { path: 'items.product', select: 'name image weight offerPrice category' },
  { path: 'address', select: 'firstName lastName street city state zipcode phone' },
];

const fail = (res, code, message) => res.status(code).json({ success: false, message });

// Load an order that belongs to the logged-in rider, or send an error
const loadMyOrder = async (req, res) => {
  const order = await Order.findById(req.params.id || req.body.orderId).select('+deliveryOtp');
  if (!order) { fail(res, 404, 'Order not found'); return null; }
  if (order.assignedTo?.toString() !== req.userId) {
    fail(res, 403, 'This order is not assigned to you'); return null;
  }
  return order;
};

const countActive = (agentId) =>
  Order.countDocuments({ assignedTo: agentId, status: { $in: ACTIVE } });

// Keep the rider's status in sync with their workload (unless they're offline)
const syncAgentStatus = async (agentId) => {
  const agent = await DeliveryAgent.findById(agentId);
  if (!agent || agent.status === 'Inactive') return;
  const active = await countActive(agentId);
  const next = active > 0 ? 'On Delivery' : 'Available';
  if (agent.status !== next) {
    agent.status = next;
    await agent.save();
  }
};

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

// Per-rider aggregates used by both the rider app and the seller panel
const riderStats = async (agentId) => {
  const today = startOfDay(0);
  const week = startOfDay(6);
  const [todayDone, weekDone, totalDeliveries, cashOrders, active] = await Promise.all([
    Order.find({ assignedTo: agentId, status: STATUS.DELIVERED, deliveredAt: { $gte: today } }).select('riderPayout'),
    Order.find({ assignedTo: agentId, status: STATUS.DELIVERED, deliveredAt: { $gte: week } }).select('riderPayout'),
    Order.countDocuments({ assignedTo: agentId, status: STATUS.DELIVERED }),
    Order.find({ assignedTo: agentId, status: STATUS.DELIVERED, collectionMethod: 'cash', codSettled: { $ne: true } }).select('amount'),
    countActive(agentId),
  ]);
  const sum = (arr, key) => arr.reduce((acc, o) => acc + (o[key] || 0), 0);
  return {
    todayDeliveries: todayDone.length,
    todayEarnings: sum(todayDone, 'riderPayout'),
    weekEarnings: sum(weekDone, 'riderPayout'),
    totalDeliveries,
    cashInHand: sum(cashOrders, 'amount'),
    cashOrders: cashOrders.length,
    activeOrders: active,
  };
};

// ---------------------------------------------------------------------------
// Auth (rider)
// ---------------------------------------------------------------------------

export const loginAgent = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return fail(res, 400, 'Phone and password are required');

    const agent = await DeliveryAgent.findOne({ phone: phone.trim() }).select('+password');
    if (!agent || !(await bcrypt.compare(password, agent.password))) {
      return fail(res, 400, 'Invalid phone or password');
    }
    if (agent.isBlocked) return fail(res, 403, 'Your account is blocked. Contact the store manager.');

    const token = jwt.sign(
      { phoneNumber: agent.phone, role: 'agent', agentId: agent._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('agentToken', token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });

    agent.lastSeenAt = new Date();
    await agent.save();

    res.json({ success: true, message: 'Login successful', agent: publicAgent(agent) });
  } catch (error) {
    console.error('Login error:', error);
    fail(res, 500, 'Server error');
  }
};

export const isAgentAuth = (req, res) => {
  res.json({ success: true, agent: publicAgent(req.agent) });
};

export const agentLogout = async (req, res) => {
  try {
    // Going off shift: mark offline if nothing is in hand
    const active = await countActive(req.userId);
    if (active === 0) await DeliveryAgent.findByIdAndUpdate(req.userId, { status: 'Inactive' });
  } catch { /* logout should still succeed */ }
  res.clearCookie('agentToken', cookieOptions());
  res.json({ success: true, message: 'Logged out successfully' });
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return fail(res, 400, 'Both old and new passwords are required');
    if (newPassword.length < 6) return fail(res, 400, 'New password must be at least 6 characters');

    const agent = await DeliveryAgent.findById(req.userId).select('+password');
    if (!(await bcrypt.compare(oldPassword, agent.password))) return fail(res, 400, 'Incorrect current password');

    agent.password = await bcrypt.hash(newPassword, 10);
    await agent.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    fail(res, 500, 'Server error');
  }
};

// ---------------------------------------------------------------------------
// Rider app
// ---------------------------------------------------------------------------

// Go online / offline
export const updateOwnStatus = async (req, res) => {
  try {
    const { online } = req.body;
    const agent = req.agent;
    if (agent.isBlocked) return fail(res, 403, 'Your account is blocked');

    const active = await countActive(agent._id);
    if (!online && active > 0) {
      return fail(res, 400, `Finish your ${active} active order(s) before going offline`);
    }
    agent.status = online ? (active > 0 ? 'On Delivery' : 'Available') : 'Inactive';
    agent.lastSeenAt = new Date();
    await agent.save();
    res.json({ success: true, message: online ? 'You are online' : 'You are offline', agent: publicAgent(agent) });
  } catch (error) {
    console.error('Status error:', error);
    fail(res, 500, 'Server error');
  }
};

// Everything the rider home screen needs in one call
export const getDashboard = async (req, res) => {
  try {
    const agent = req.agent;
    agent.lastSeenAt = new Date();
    await agent.save();

    const [stats, active] = await Promise.all([
      riderStats(agent._id),
      Order.find({ assignedTo: agent._id, status: { $in: ACTIVE } })
        .populate(RIDER_POPULATE).sort({ acceptedAt: 1, createdAt: 1 }),
    ]);

    let available = [];
    const online = agent.status !== 'Inactive' && !agent.isBlocked;
    if (online && active.length < MAX_ACTIVE_ORDERS) {
      available = await Order.find({
        ...FULFILLABLE,
        assignedTo: null,
        status: { $in: PRE_PICKUP },
      }).populate(RIDER_POPULATE).sort({ createdAt: 1 }).limit(20);
    }

    res.json({
      success: true,
      agent: publicAgent(agent),
      stats,
      active,
      available,
      limits: { maxActive: MAX_ACTIVE_ORDERS, payoutPerOrder: RIDER_PAYOUT },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    fail(res, 500, 'Server error');
  }
};

// Completed / failed deliveries
export const getHistory = async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const orders = await Order.find({
      assignedTo: req.userId,
      status: { $in: [STATUS.DELIVERED, STATUS.FAILED] },
      updatedAt: { $gte: startOfDay(days - 1) },
      deletedByAgent: { $ne: true },
    }).populate(RIDER_POPULATE).sort({ updatedAt: -1 });

    const stats = await riderStats(req.userId);
    res.json({ success: true, orders, stats });
  } catch (error) {
    console.error('History error:', error);
    fail(res, 500, 'Server error');
  }
};

// Rider picks an order from the pool
export const acceptOrder = async (req, res) => {
  try {
    const agent = req.agent;
    const { orderId } = req.body;
    if (!orderId) return fail(res, 400, 'Order ID required');
    if (agent.isBlocked) return fail(res, 403, 'Your account is blocked');
    if (agent.status === 'Inactive') return fail(res, 400, 'Go online to accept orders');
    if ((await countActive(agent._id)) >= MAX_ACTIVE_ORDERS) {
      return fail(res, 400, `You can carry at most ${MAX_ACTIVE_ORDERS} orders at a time`);
    }

    // Atomic: only one rider can win this order
    const order = await Order.findOneAndUpdate(
      { _id: orderId, ...FULFILLABLE, assignedTo: null, status: { $in: PRE_PICKUP } },
      {
        $set: { assignedTo: agent._id, assignedBy: 'rider', acceptedAt: new Date() },
        $push: { timeline: { status: 'Rider Assigned', by: 'rider', note: agent.name, at: new Date() } },
      },
      { new: true }
    );
    if (!order) return fail(res, 409, 'Order is no longer available');

    await syncAgentStatus(agent._id);
    res.json({ success: true, message: 'Order accepted', order });
  } catch (error) {
    console.error('Accept error:', error);
    fail(res, 500, 'Server error');
  }
};

// Rider hands an order back before pickup
export const rejectOrder = async (req, res) => {
  try {
    const order = await loadMyOrder(req, res);
    if (!order) return;
    if (!PRE_PICKUP.includes(order.status)) return fail(res, 400, 'Order already picked up. Use "Delivery failed" instead.');

    order.assignedTo = null;
    order.assignedBy = null;
    order.acceptedAt = undefined;
    addTimeline(order, 'Rider Unassigned', 'rider', req.body.reason || req.agent.name);
    await order.save();
    await syncAgentStatus(req.userId);
    res.json({ success: true, message: 'Order returned to the pool' });
  } catch (error) {
    console.error('Reject error:', error);
    fail(res, 500, 'Server error');
  }
};

// Forward-only status progression for the rider
const RIDER_STEPS = {
  pickup: { from: [STATUS.PACKED], to: STATUS.PICKED, stamp: 'pickedAt' },
  start: { from: [STATUS.PICKED], to: STATUS.OUT, stamp: 'outForDeliveryAt' },
  reached: { from: [STATUS.OUT, STATUS.ARRIVING], to: STATUS.REACHED, stamp: 'reachedAt' },
};

export const advanceOrder = async (req, res) => {
  try {
    const step = RIDER_STEPS[req.body.action];
    if (!step) return fail(res, 400, 'Invalid action');

    const order = await loadMyOrder(req, res);
    if (!order) return;

    if (req.body.action === 'pickup' && order.status === STATUS.PLACED) {
      return fail(res, 400, 'Store is still packing this order. Wait until it is marked Packed.');
    }
    if (!step.from.includes(order.status)) {
      return fail(res, 400, `Cannot do this while order is "${order.status}"`);
    }

    order.status = step.to;
    order[step.stamp] = new Date();
    if (!order.deliveryOtp) order.deliveryOtp = generateOtp(); // legacy orders
    addTimeline(order, step.to, 'rider');
    await order.save();

    order.deliveryOtp = undefined;
    res.json({ success: true, message: `Marked ${step.to}`, order });
  } catch (error) {
    console.error('Advance error:', error);
    fail(res, 500, 'Server error');
  }
};

// Complete delivery: verify customer OTP and payment
export const completeDelivery = async (req, res) => {
  try {
    const { otp, collectionMethod } = req.body;
    const order = await loadMyOrder(req, res);
    if (!order) return;

    if (![STATUS.OUT, STATUS.ARRIVING, STATUS.REACHED].includes(order.status)) {
      return fail(res, 400, 'Order must be out for delivery to complete it');
    }
    if (!otp || String(otp).trim() !== order.deliveryOtp) {
      return fail(res, 400, 'Incorrect OTP. Ask the customer for the 4-digit code in their app.');
    }

    if (!order.isPaid) {
      if (collectionMethod === 'cash') {
        order.isPaid = true;
        order.paidAt = new Date();
        order.collectionMethod = 'cash';
        order.codSettled = false;
      } else {
        return fail(res, 400, 'Collect payment (cash or UPI) before completing delivery');
      }
    }

    order.status = STATUS.DELIVERED;
    order.deliveredAt = new Date();
    order.riderPayout = RIDER_PAYOUT;
    addTimeline(order, STATUS.DELIVERED, 'rider', order.collectionMethod ? `Collected via ${order.collectionMethod}` : '');
    await order.save();
    await syncAgentStatus(req.userId);

    res.json({ success: true, message: 'Delivered successfully' });
  } catch (error) {
    console.error('Complete error:', error);
    fail(res, 500, 'Server error');
  }
};

export const FAIL_REASONS = [
  'Customer not reachable',
  'Customer not available at location',
  'Customer refused the order',
  'Wrong / incomplete address',
  'Vehicle breakdown',
  'Other',
];

// Delivery could not be completed: parcel goes back to the store
export const failDelivery = async (req, res) => {
  try {
    const { reason, note } = req.body;
    if (!FAIL_REASONS.includes(reason)) return fail(res, 400, 'Select a valid reason');

    const order = await loadMyOrder(req, res);
    if (!order) return;
    if (!IN_TRANSIT.includes(order.status)) return fail(res, 400, 'Only picked-up orders can be marked failed');

    order.status = STATUS.FAILED;
    order.failReason = note ? `${reason}: ${note}` : reason;
    if (order.isPaid && order.paymentType === 'Online') order.refundStatus = 'Pending';
    await restoreStock(order);
    addTimeline(order, STATUS.FAILED, 'rider', order.failReason);
    await order.save();
    await syncAgentStatus(req.userId);

    res.json({ success: true, message: 'Marked as failed. Return the parcel to the store.' });
  } catch (error) {
    console.error('Fail error:', error);
    fail(res, 500, 'Server error');
  }
};

export const getFailReasons = (req, res) => res.json({ success: true, reasons: FAIL_REASONS });

// Live location ping from the rider's phone
export const updateLocation = async (req, res) => {
  try {
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return fail(res, 400, 'Invalid coordinates');
    await DeliveryAgent.findByIdAndUpdate(req.userId, {
      currentLocation: { lat, lng, updatedAt: new Date() },
      lastSeenAt: new Date(),
    });
    res.json({ success: true });
  } catch (error) {
    fail(res, 500, 'Server error');
  }
};

// Rider hides a finished order from their history
export const deleteDeliveredOrder = async (req, res) => {
  try {
    req.params.id = req.params.orderId;
    const order = await loadMyOrder(req, res);
    if (!order) return;
    if (![STATUS.DELIVERED, STATUS.FAILED].includes(order.status)) {
      return fail(res, 400, 'Only completed orders can be removed');
    }
    order.deletedByAgent = true;
    await order.save();
    res.json({ success: true, message: 'Removed from history' });
  } catch (error) {
    console.error('Delete order error:', error);
    fail(res, 500, 'Server error');
  }
};

// UPI collection at the door (COD order paid online via Razorpay)
export const createRazorpayOrder = async (req, res) => {
  try {
    const order = await loadMyOrder(req, res);
    if (!order) return;
    if (order.isPaid) return fail(res, 400, 'Order is already paid');

    const rzpOrder = await getRazorpay().orders.create({
      amount: Math.round(order.amount * 100), // server-side amount, never trust the client
      currency: 'INR',
      receipt: `cod_${order._id}`,
      notes: { orderId: order._id.toString(), riderId: req.userId },
    });
    res.json({ success: true, order: rzpOrder, orderId: order._id });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    fail(res, 500, 'Could not start UPI payment');
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return fail(res, 400, 'Missing payment details');

    const order = await loadMyOrder(req, res);
    if (!order) return;

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_API_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expected !== razorpay_signature) return fail(res, 400, 'Invalid payment signature');

    order.isPaid = true;
    order.paidAt = new Date();
    order.collectionMethod = 'upi';
    order.paymentInfo = { paymentId: razorpay_payment_id, razorpay_order_id };
    addTimeline(order, 'Payment Collected', 'rider', 'UPI');
    await order.save();
    res.json({ success: true, message: 'Payment received. Enter OTP to complete delivery.' });
  } catch (error) {
    console.error('Payment verification error:', error);
    fail(res, 500, 'Payment verification failed');
  }
};

// ---------------------------------------------------------------------------
// Seller / fleet management
// ---------------------------------------------------------------------------

export const getAgents = async (req, res) => {
  try {
    const agents = await DeliveryAgent.find().sort({ createdAt: -1 });
    const withStats = await Promise.all(
      agents.map(async (a) => ({ ...publicAgent(a), lastSeenAt: a.lastSeenAt, currentLocation: a.currentLocation, stats: await riderStats(a._id) }))
    );
    res.json({ success: true, agents: withStats });
  } catch (error) {
    console.error('Error fetching agents:', error);
    fail(res, 500, 'Server error');
  }
};

export const createAgent = async (req, res) => {
  try {
    const { name, phone, password, vehicleType, vehicleNumber } = req.body;
    if (!name || !phone || !password) return fail(res, 400, 'Name, phone, and password are required');
    if (password.length < 6) return fail(res, 400, 'Password must be at least 6 characters');
    if (await DeliveryAgent.findOne({ phone: phone.trim() })) return fail(res, 400, 'A rider with this phone already exists');

    const agent = await DeliveryAgent.create({
      name, phone: phone.trim(), password: await bcrypt.hash(password, 10),
      vehicleType: vehicleType || 'Bike', vehicleNumber: vehicleNumber || '',
    });
    res.status(201).json({ success: true, message: 'Rider created', agent: publicAgent(agent) });
  } catch (error) {
    console.error('Error creating agent:', error);
    fail(res, 500, 'Server error');
  }
};

export const updateAgent = async (req, res) => {
  try {
    const allowed = ['name', 'vehicleType', 'vehicleNumber', 'isBlocked'];
    const update = {};
    for (const key of allowed) if (key in req.body) update[key] = req.body[key];

    if (update.isBlocked === true) {
      const active = await countActive(req.params.id);
      if (active > 0) return fail(res, 400, `Rider has ${active} active order(s). Reassign them first.`);
      update.status = 'Inactive';
    }
    const agent = await DeliveryAgent.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!agent) return fail(res, 404, 'Rider not found');
    res.json({ success: true, message: 'Rider updated', agent: publicAgent(agent) });
  } catch (error) {
    console.error('Update agent error:', error);
    fail(res, 500, 'Server error');
  }
};

export const resetAgentPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return fail(res, 400, 'Password must be at least 6 characters');
    const agent = await DeliveryAgent.findByIdAndUpdate(req.params.id, { password: await bcrypt.hash(password, 10) });
    if (!agent) return fail(res, 404, 'Rider not found');
    res.json({ success: true, message: 'Password reset' });
  } catch (error) {
    fail(res, 500, 'Server error');
  }
};

// Rider hands collected cash to the store
export const settleCash = async (req, res) => {
  try {
    const filter = { assignedTo: req.params.id, status: STATUS.DELIVERED, collectionMethod: 'cash', codSettled: { $ne: true } };
    const orders = await Order.find(filter).select('amount');
    if (orders.length === 0) return fail(res, 400, 'No cash pending for this rider');
    const total = orders.reduce((acc, o) => acc + o.amount, 0);
    await Order.updateMany(filter, { $set: { codSettled: true, codSettledAt: new Date() } });
    res.json({ success: true, message: `Settled ₹${total} from ${orders.length} order(s)`, total });
  } catch (error) {
    console.error('Settle error:', error);
    fail(res, 500, 'Server error');
  }
};

export const deleteAgent = async (req, res) => {
  try {
    const agentId = req.params.id;
    const active = await countActive(agentId);
    if (active > 0) return fail(res, 400, 'Cannot delete a rider with active orders');
    const unsettled = await Order.countDocuments({ assignedTo: agentId, collectionMethod: 'cash', codSettled: { $ne: true }, status: STATUS.DELIVERED });
    if (unsettled > 0) return fail(res, 400, 'Settle this rider\'s cash before deleting');

    const deleted = await DeliveryAgent.findByIdAndDelete(agentId);
    if (!deleted) return fail(res, 404, 'Rider not found');
    res.json({ success: true, message: 'Rider deleted' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    fail(res, 500, 'Server error');
  }
};

// Seller assigns or reassigns an order (only before pickup)
export const assignOrderToAgent = async (req, res) => {
  try {
    const { orderId, agentId } = req.body;
    if (!orderId || !agentId) return fail(res, 400, 'Order ID and rider are required');

    const [order, agent] = await Promise.all([Order.findById(orderId), DeliveryAgent.findById(agentId)]);
    if (!order) return fail(res, 404, 'Order not found');
    if (!agent) return fail(res, 404, 'Rider not found');
    if (!PRE_PICKUP.includes(order.status)) return fail(res, 400, 'Order is already picked up or closed');
    if (agent.isBlocked) return fail(res, 400, 'Rider is blocked');
    if (agent.status === 'Inactive') return fail(res, 400, 'Rider is offline');
    if (order.assignedTo?.toString() === agentId) return fail(res, 400, 'Already assigned to this rider');
    if ((await countActive(agentId)) >= MAX_ACTIVE_ORDERS) return fail(res, 400, 'Rider is at maximum load');

    const previous = order.assignedTo;
    order.assignedTo = agent._id;
    order.assignedBy = 'seller';
    order.acceptedAt = new Date();
    addTimeline(order, previous ? 'Rider Reassigned' : 'Rider Assigned', 'seller', agent.name);
    await order.save();

    await syncAgentStatus(agent._id);
    if (previous) await syncAgentStatus(previous);
    res.json({ success: true, message: `Assigned to ${agent.name}` });
  } catch (error) {
    console.error('Error assigning order:', error);
    fail(res, 500, 'Server error');
  }
};

// Seller unassigns a rider (before pickup)
export const unassignOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.body.orderId);
    if (!order) return fail(res, 404, 'Order not found');
    if (!order.assignedTo) return fail(res, 400, 'Order has no rider');
    if (!PRE_PICKUP.includes(order.status)) return fail(res, 400, 'Order is already picked up');
    const previous = order.assignedTo;
    order.assignedTo = null;
    order.assignedBy = null;
    addTimeline(order, 'Rider Unassigned', 'seller');
    await order.save();
    await syncAgentStatus(previous);
    res.json({ success: true, message: 'Rider removed from order' });
  } catch (error) {
    fail(res, 500, 'Server error');
  }
};

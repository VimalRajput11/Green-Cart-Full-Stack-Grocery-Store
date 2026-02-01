import DeliveryAgent from '../models/DeliveryAgent.js';
import Order from '../models/Order.js';
import bcrypt from 'bcrypt';

import Razorpay from "razorpay";
import crypto from "crypto";

import jwt from 'jsonwebtoken';

// Get all or filtered agents
export const getAgents = async (req, res) => {
  try {
    const { phone } = req.query;
    const agents = phone
      ? await DeliveryAgent.find({ phone })
      : await DeliveryAgent.find();

    res.json({ success: true, agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new delivery agent
export const createAgent = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone, and password are required' });
    }

    const existing = await DeliveryAgent.findOne({ phone });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Agent with this phone already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const agent = new DeliveryAgent({ name, phone, password: hashedPassword });
    await agent.save();

    res.status(201).json({ success: true, message: 'Agent created', agent });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update agent status (online/offline)
export const updateAgentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const agent = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    res.json({ success: true, agent });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete agent if no pending orders
export const deleteAgent = async (req, res) => {
  try {
    const agentId = req.params.id;

    const pendingOrders = await Order.find({
      assignedTo: agentId,
      status: { $ne: 'Delivered' },
    });

    if (pendingOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete agent with pending orders.',
      });
    }

    const deletedAgent = await DeliveryAgent.findByIdAndDelete(agentId);

    if (!deletedAgent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Assign an order to an agent
export const assignOrderToAgent = async (req, res) => {
  try {
    const { orderId, agentId } = req.body;

    if (!orderId || !agentId) {
      return res.status(400).json({ success: false, message: 'Order ID and Agent ID are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.assignedTo) {
      return res.status(400).json({ success: false, message: 'Order already assigned' });
    }

    order.assignedTo = agentId;
    await order.save();

    res.json({ success: true, message: 'Order assigned', order });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Agent fetches only their assigned orders
export const getAgentOrders = async (req, res) => {
  try {
    const orders = await Order.find({ assignedTo: req.params.id })
      .populate('items.product')
      .populate('address');

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching agent orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Agent accepts unassigned order
export const acceptOrder = async (req, res) => {
  try {
    const agentId = req.userId;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.assignedTo) {
      if (order.assignedTo.toString() !== agentId) {
        return res.status(400).json({ success: false, message: 'Already picked by another agent' });
      }
      return res.json({ success: true, message: 'Already accepted', order });
    }

    order.assignedTo = agentId;
    order.acceptedAt = new Date();
    await order.save();

    res.json({ success: true, message: 'Order accepted', order });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Agent sees visible orders: unassigned orders created after their registration + their own assigned orders
export const getVisibleOrdersForAgent = async (req, res) => {
  try {
    const agentId = req.userId;

    // Get agent's registration date
    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const orders = await Order.find({
      $or: [
        {
          assignedTo: null,
          createdAt: { $gte: agent.createdAt } // Only show unassigned orders created after agent registration
        },
        { assignedTo: agentId } // Show orders assigned to this agent
      ],
    })
      .populate('items.product')
      .populate('address')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching visible orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Agent login (public)
export const loginAgent = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required' });
    }

    const agent = await DeliveryAgent.findOne({ phone });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const isMatch = await bcrypt.compare(password, agent.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { phoneNumber: agent.phone, role: 'agent', agentId: agent._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('agentToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      agent: {
        _id: agent._id,
        name: agent.name,
        phone: agent.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Agent Auth Check (called on refresh to stay logged in)
export const isAgentAuth = (req, res) => {
  if (!req.agent) {
    return res.status(401).json({ success: false, message: 'Agent not authenticated' });
  }

  res.json({
    success: true,
    message: 'Agent is authenticated',
    agent: {
      _id: req.agent._id,
      name: req.agent.name,
      phone: req.agent.phone,
    },
  });
};

// Agent Logout
export const agentLogout = (req, res) => {
  res.clearCookie('agentToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });

  res.json({ success: true, message: 'Logged out successfully' });
};

// Agent updates their own status (Available/Inactive)
export const updateOwnStatus = async (req, res) => {
  try {
    const agentId = req.userId; // Set by authAgent middleware
    const { status } = req.body;

    // Validate status
    if (!['Available', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Available" or "Inactive"'
      });
    }

    const agent = await DeliveryAgent.findByIdAndUpdate(
      agentId,
      { status },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      agent: {
        _id: agent._id,
        name: agent.name,
        phone: agent.phone,
        status: agent.status
      }
    });
  } catch (error) {
    console.error('Error updating own status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Mark order as paid (or delivered) by order ID
export const markOrderPaid = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update order payment status or delivery status as needed
    order.isPaid = true;          // or order.status = 'Delivered';
    order.paidAt = new Date();

    await order.save();

    res.json({ success: true, message: 'Order marked as paid', order });
  } catch (error) {
    console.error('Error marking order as paid:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const updateOrderStatus = async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.status = status;
    await order.save();

    res.json({ success: true, message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};



const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    if (!amount || !currency || !receipt) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const options = {
      amount: amount, // in paise
      currency,
      receipt,
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(options);

    return res.status(200).json({
      success: true,
      order,
      orderId: receipt, // your order _id or unique id
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({ success: false, message: "Razorpay order creation failed", error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Update order payment status
    await Order.findByIdAndUpdate(orderId, {
      isPaid: true,
      paymentInfo: {
        paymentId: razorpay_payment_id,
        razorpay_order_id,
      },
    });

    res.status(200).json({ success: true, message: "Payment verified and order marked as paid" });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    // Assuming auth middleware sets req.agent
    const agentId = req.agent ? req.agent._id : req.userId; // Fallback if req.userId is used in auth

    if (!agentId) return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both old and new passwords are required' });
    }

    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, agent.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    agent.password = hashedPassword;
    await agent.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete delivered order (agent can only delete their own delivered orders)
export const deleteDeliveredOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const agentId = req.userId;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if order is assigned to this agent
    if (order.assignedTo?.toString() !== agentId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own orders' });
    }

    // Check if order is delivered
    if (order.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be deleted' });
    }

    await Order.findByIdAndDelete(orderId);

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

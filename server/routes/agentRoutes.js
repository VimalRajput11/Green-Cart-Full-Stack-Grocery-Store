import express from 'express';
import {
  getAgents,
  createAgent,
  updateAgentStatus,
  deleteAgent,
  assignOrderToAgent,
  getAgentOrders,
  acceptOrder,
  getVisibleOrdersForAgent,
  loginAgent,
  isAgentAuth,
  agentLogout,
  markOrderPaid,
  updateOrderStatus,
  createRazorpayOrder,
  verifyPayment
} from '../controllers/agentController.js';
import { authAgent } from '../middlewares/authAgent.js';
import authSeller from '../middlewares/authSeller.js';

const router = express.Router();

router.post('/login', loginAgent);
router.get('/is-auth', authAgent, isAgentAuth);
router.get('/logout', authAgent, agentLogout);

// Seller/Admin routes
router.get('/', authSeller, getAgents);
router.post('/create', authSeller, createAgent);
router.patch('/status/:id', authSeller, updateAgentStatus);
router.delete('/:id', authSeller, deleteAgent);
router.post('/assign', authSeller, assignOrderToAgent);

// Agent specific routes
router.get('/orders/visible', authAgent, getVisibleOrdersForAgent);
router.post('/accept', authAgent, acceptOrder);
router.get('/orders/:id', authAgent, getAgentOrders);
router.put('/mark-paid/:orderId', authAgent, markOrderPaid);
router.put('/status/:id', authAgent, updateOrderStatus);
router.post('/order/razorpay', authAgent, createRazorpayOrder);
router.post('/order/verify', authAgent, verifyPayment);

export default router;

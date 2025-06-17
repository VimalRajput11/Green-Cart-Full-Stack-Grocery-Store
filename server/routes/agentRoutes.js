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
  createRazorpayOrder,    // <-- import here
  verifyPayment          // <-- import here
} from '../controllers/agentController.js';
import { authAgent } from '../middlewares/authAgent.js';

const router = express.Router();

router.post('/login', loginAgent);
router.get('/is-auth', authAgent, isAgentAuth);
router.get('/logout', authAgent, agentLogout);

router.get('/', authAgent, getAgents);
router.post('/create', authAgent, createAgent);
router.patch('/status/:id', authAgent, updateAgentStatus);
router.delete('/:id', authAgent, deleteAgent);
router.post('/assign', authAgent, assignOrderToAgent);
router.get('/orders/visible', authAgent, getVisibleOrdersForAgent);
router.post('/accept', authAgent, acceptOrder);
router.get('/orders/:id', authAgent, getAgentOrders);
router.put('/mark-paid/:orderId', authAgent, markOrderPaid);
router.put('/status/:id', authAgent, updateOrderStatus);
router.post('/order/razorpay', authAgent, createRazorpayOrder);
router.post('/order/verify', authAgent, verifyPayment);

export default router;

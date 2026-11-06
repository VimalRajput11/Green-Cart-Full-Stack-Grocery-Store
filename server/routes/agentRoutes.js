import express from 'express';
import {
  loginAgent, isAgentAuth, agentLogout, changePassword,
  updateOwnStatus, getDashboard, getHistory, acceptOrder, rejectOrder,
  advanceOrder, completeDelivery, failDelivery, getFailReasons, updateLocation,
  deleteDeliveredOrder, createRazorpayOrder, verifyPayment,
  getAgents, createAgent, updateAgent, resetAgentPassword, settleCash, deleteAgent,
  assignOrderToAgent, unassignOrder,
} from '../controllers/agentController.js';
import { authAgent } from '../middlewares/authAgent.js';
import authSeller from '../middlewares/authSeller.js';

const router = express.Router();

// --- Rider auth ---
router.post('/login', loginAgent);
router.get('/is-auth', authAgent, isAgentAuth);
router.get('/logout', authAgent, agentLogout);
router.post('/change-password', authAgent, changePassword);

// --- Rider app ---
router.patch('/my-status', authAgent, updateOwnStatus);
router.get('/me/dashboard', authAgent, getDashboard);
router.get('/me/history', authAgent, getHistory);
router.post('/me/location', authAgent, updateLocation);
router.get('/fail-reasons', authAgent, getFailReasons);
router.post('/accept', authAgent, acceptOrder);
router.post('/orders/:id/reject', authAgent, rejectOrder);
router.post('/orders/:id/advance', authAgent, advanceOrder);
router.post('/orders/:id/complete', authAgent, completeDelivery);
router.post('/orders/:id/fail', authAgent, failDelivery);
router.post('/orders/:id/upi', authAgent, createRazorpayOrder);
router.post('/orders/:id/upi/verify', authAgent, verifyPayment);
router.delete('/order/:orderId', authAgent, deleteDeliveredOrder);

// --- Seller: fleet management ---
router.get('/', authSeller, getAgents);
router.post('/create', authSeller, createAgent);
router.post('/assign', authSeller, assignOrderToAgent);
router.post('/unassign', authSeller, unassignOrder);
router.patch('/:id', authSeller, updateAgent);
router.post('/:id/reset-password', authSeller, resetAgentPassword);
router.post('/:id/settle-cash', authSeller, settleCash);
router.delete('/:id', authSeller, deleteAgent);

export default router;

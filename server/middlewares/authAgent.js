import jwt from 'jsonwebtoken';
import DeliveryAgent from '../models/DeliveryAgent.js';

export const authAgent = async (req, res, next) => {
  try {
    const token = req.cookies?.agentToken;

    // If no token is found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized as agent. No token found.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const agentId = decoded.agentId;

    // If token is invalid
    if (!agentId) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token structure for agent.',
      });
    }

    // Fetch agent from DB
    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found.',
      });
    }

    // Set to request for further use
    req.userId = agent._id.toString();
    req.agent = agent;

    next(); // Go to next middleware or controller
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

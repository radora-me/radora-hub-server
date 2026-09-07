import jwt from 'jsonwebtoken';
import { authService } from '../services/authService.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'radora_hub_super_secret_jwt_key_2026_architect';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No Bearer token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }

    const user = await authService.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact your Project Architect Admin.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This action requires one of the following roles: [${roles.join(', ')}]. Your role is: ${req.user.role}`,
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('architect_admin');

// Optional authentication middleware: extracts user if token present without throwing 401
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.id) {
        const user = await authService.getUserById(decoded.id);
        if (user && user.status !== 'inactive') {
          req.user = user;
        }
      }
    }
  } catch (e) {
    // Ignore invalid tokens in optional auth mode
  }
  next();
};

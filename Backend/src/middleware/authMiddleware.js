/**
 * @file authMiddleware.js
 * @description Authentication middleware for admin routes.
 * Provides JWT verification and role-based access control for administrative operations.
 * @module middleware/authMiddleware
 */

import jwt from 'jsonwebtoken';
import { getAuth } from '../config/firebaseAdmin.js';
import AdminUser from '../models/AdminUser.js';
import Resident from '../models/Resident.js';

export async function requireResidentAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing or malformed Authorization header' });
    }

    const idToken = authHeader.split(' ')[1];

    const auth = getAuth();
    if (!auth) {
      console.error('[authMiddleware] Firebase Admin not initialized - cannot verify resident token');
      return res.status(500).json({ success: false, message: 'Server auth misconfiguration' });
    }

    const decoded = await auth.verifyIdToken(idToken);

    req.residentFirebaseUid = decoded.uid;
    req.residentFirebaseClaims = decoded;

    return next();
  } catch (err) {
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Session expired, please sign in again' });
    }
    console.error('[authMiddleware.requireResidentAuth]', err.message);
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
}

export async function requireAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[authMiddleware] JWT_SECRET is not configured');
      return res.status(500).json({ success: false, message: 'Server auth misconfiguration' });
    }

    const decoded = jwt.verify(token, secret);

    const admin = await AdminUser.findById(decoded.adminId).select('Email Role').lean();
    if (!admin || !['SUPER_ADMIN', 'OPERATIONS', 'SUPPORT'].includes(admin.Role)) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }

    req.admin = {
      adminId: admin._id.toString(),
      email: admin.Email,
      role: admin.Role,
    };

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    return next();
  };
}

export async function attachResident(req, res, next) {
  try {
    const resident = await Resident.findOne({ FirebaseUID: req.residentFirebaseUid });

    if (!resident) {
      return res.status(404).json({ success: false, message: 'No resident account found for this session - call /auth/sync first' });
    }

    req.resident = resident;
    return next();
  } catch (err) {
    console.error('[authMiddleware.attachResident]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export function requireOwnResident(req, res, next) {
  const { residentId } = req.params;

  if (residentId && residentId !== String(req.resident._id)) {
    return res.status(403).json({ success: false, message: 'Cannot act on another resident\'s account' });
  }

  return next();
}

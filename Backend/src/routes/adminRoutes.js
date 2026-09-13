/**
 * @file adminRoutes.js
 * @description Express router for admin API endpoints.
 * Defines routes for admin authentication, dashboard, vendor/resident/category management, and analytics.
 * @module routes/adminRoutes
 */

import express from 'express';
import { login, register, getDashboard, getMe } from '../controllers/adminController.js';
import { getPilotReport } from '../controllers/pilotController.js';
import {
  listVendors,
  getVendorDetail,
  updateVendorStatus,
} from '../controllers/adminVendorController.js';
import { listResidents, getResidentDetail } from '../controllers/adminResidentController.js';
import {
  listCategoriesWithCounts,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/adminCategoryController.js';
import { listRatings } from '../controllers/adminRatingController.js';
import { listAlerts } from '../controllers/adminAlertController.js';
import { listActivity } from '../controllers/adminActivityController.js';
import { requireAdminAuth, requireRole } from '../middleware/authMiddleware.js';
import { adminLoginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// --- Auth -----------------------------------------------------------------
router.post('/login', adminLoginLimiter, login);
router.get('/me', requireAdminAuth, getMe);
router.post('/register', adminLoginLimiter, requireAdminAuth, requireRole('SUPER_ADMIN'), register);

// --- Overview ---------------------------------------------------------------
router.get('/dashboard', requireAdminAuth, getDashboard);
router.get('/pilot-report', requireAdminAuth, getPilotReport);

// --- Vendors ----------------------------------------------------------------
router.get('/vendors', requireAdminAuth, listVendors);
router.get('/vendors/:vendorId', requireAdminAuth, getVendorDetail);
router.patch('/vendors/:vendorId/status', requireAdminAuth, updateVendorStatus);

// --- Residents (read-only for now) ------------------------------------------
router.get('/residents', requireAdminAuth, listResidents);
router.get('/residents/:residentId', requireAdminAuth, getResidentDetail);

// --- Categories ---------------------------------------------------------------
router.get('/categories', requireAdminAuth, listCategoriesWithCounts);
router.post('/categories', requireAdminAuth, requireRole('SUPER_ADMIN', 'OPERATIONS'), createCategory);
router.patch('/categories/:categoryId', requireAdminAuth, requireRole('SUPER_ADMIN', 'OPERATIONS'), updateCategory);
router.delete('/categories/:categoryId', requireAdminAuth, requireRole('SUPER_ADMIN'), deleteCategory);

// --- Ratings / Alerts / Activity (read-only feeds) --------------------------
router.get('/ratings', requireAdminAuth, listRatings);
router.get('/alerts', requireAdminAuth, listAlerts);
router.get('/activity', requireAdminAuth, listActivity);

export default router;

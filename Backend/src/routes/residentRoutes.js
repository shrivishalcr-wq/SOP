/**
 * @file residentRoutes.js
 * @description Express router for resident API endpoints.
 * Auth/profile routes are Firebase-token protected; everything derives the
 * resident's identity from the verified token, never from a client-supplied id.
 * @module routes/residentRoutes
 */

import express from 'express';
import { setPreferences, getPreferences } from '../controllers/residentPreferenceController.js';
import {
  syncResident,
  getMyResidentProfile,
  updateMyResidentProfile,
  updateMyFcmToken,
} from '../controllers/residentAuthController.js';
import { requireResidentAuth, attachResident, requireOwnResident } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/auth/sync', requireResidentAuth, syncResident);
router.get('/auth/me', requireResidentAuth, getMyResidentProfile);
router.patch('/auth/me', requireResidentAuth, updateMyResidentProfile);
router.patch('/auth/fcm-token', requireResidentAuth, updateMyFcmToken);

router.put('/:residentId/preferences', requireResidentAuth, attachResident, requireOwnResident, setPreferences);
router.get('/:residentId/preferences', requireResidentAuth, attachResident, requireOwnResident, getPreferences);

export default router;

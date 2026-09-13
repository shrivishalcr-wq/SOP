/**
 * @file ratingRoutes.js
 * @description Express router for rating API endpoints.
 * Defines routes for creating vendor ratings with proximity validation.
 * @module routes/ratingRoutes
 */

import express from 'express';
import { createRating } from '../controllers/ratingController.js';
import { requireResidentAuth, attachResident } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', requireResidentAuth, attachResident, createRating);

export default router;

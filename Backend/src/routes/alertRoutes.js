/**
 * @file alertRoutes.js
 * @description Express router for alert API endpoints.
 * Defines routes for creating proximity alerts between vendors and residents.
 * @module routes/alertRoutes
 */

import express from 'express';
import { createAlert } from '../controllers/alertController.js';

const router = express.Router();

router.post('/', createAlert);

export default router;

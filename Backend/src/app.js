/**
 * @file app.js
 * @description Main Express application entry point.
 * Configures middleware, routes, and starts the HTTP server for the VendiConnect backend API.
 * @module app
 */

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import connectDB from './config/db.js';
import './config/firebaseAdmin.js';

import { corsMiddleware } from './middleware/corsConfig.js';
import { publicApiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, centralizedErrorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.js';
import vendorRoutes from './routes/vendorRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import residentRoutes from './routes/residentRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

connectDB();

app.use('/api/health', healthRoutes);
app.use('/api/vendors', publicApiLimiter, vendorRoutes);
app.use('/api/ratings', publicApiLimiter, ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/residents', publicApiLimiter, residentRoutes);
app.use('/api/categories', publicApiLimiter, categoryRoutes);
app.use(notFoundHandler);
app.use(centralizedErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] VendiConnect backend listening on port ${PORT}`);
});

export default app;

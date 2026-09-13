/**
 * @file adminRatingController.js
 * @description Controller for managing admin rating operations.
 * Handles retrieval of vendor ratings with pagination and filtering capabilities.
 * @module controllers/adminRatingController
 */

import mongoose from 'mongoose';
import Rating from '../models/Rating.js';
import { parsePagination, buildPageMeta } from '../utils/paginate.js';

export async function listRatings(req, res) {
  try {
    const { vendorId } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const match = {};
    if (vendorId) {
      if (!mongoose.Types.ObjectId.isValid(vendorId)) {
        return res.status(400).json({ success: false, message: 'Invalid vendorId' });
      }
      match.Vendor_ID = vendorId;
    }

    const [ratings, total] = await Promise.all([
      Rating.find(match)
        .populate({ path: 'Vendor_ID', select: 'VendorName' })
        .sort({ RatingDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Rating.countDocuments(match),
    ]);

    const data = ratings.map((rating) => ({
      Rating_ID: rating._id,
      VendorName: rating.Vendor_ID?.VendorName || 'Unknown vendor',
      Vendor_ID: rating.Vendor_ID?._id || null,
      Resident_ID: rating.Resident_ID,
      RatingValue: rating.RatingValue,
      Review: rating.Review,
      RatingDate: rating.RatingDate,
    }));

    return res.status(200).json({ success: true, data, meta: buildPageMeta({ page, limit, total }) });
  } catch (err) {
    console.error('[adminRatingController.listRatings]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

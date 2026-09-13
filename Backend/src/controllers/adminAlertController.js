/**
 * @file adminAlertController.js
 * @description Controller for managing admin alert operations.
 * Handles retrieval and filtering of proximity alerts with pagination.
 * @module controllers/adminAlertController
 */

import mongoose from 'mongoose';
import Alert from '../models/Alert.js';
import { parsePagination, buildPageMeta } from '../utils/paginate.js';

export async function listAlerts(req, res) {
  try {
    const { vendorId, residentId } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const match = {};
    if (vendorId) {
      if (!mongoose.Types.ObjectId.isValid(vendorId)) {
        return res.status(400).json({ success: false, message: 'Invalid vendorId' });
      }
      match.Vendor_ID = vendorId;
    }
    if (residentId) {
      if (!mongoose.Types.ObjectId.isValid(residentId)) {
        return res.status(400).json({ success: false, message: 'Invalid residentId' });
      }
      match.Resident_ID = residentId;
    }

    const [alerts, total] = await Promise.all([
      Alert.find(match)
        .populate({ path: 'Vendor_ID', select: 'VendorName' })
        .populate({ path: 'Resident_ID', select: 'DisplayName' })
        .sort({ Timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Alert.countDocuments(match),
    ]);

    const data = alerts.map((alert) => ({
      Alert_ID: alert._id,
      VendorName: alert.Vendor_ID?.VendorName || 'Unknown vendor',
      ResidentName: alert.Resident_ID?.DisplayName || 'Unknown resident',
      EtaMinutes: alert.EtaMinutes,
      DistanceAtAlert: alert.DistanceAtAlert,
      Timestamp: alert.Timestamp,
    }));

    return res.status(200).json({ success: true, data, meta: buildPageMeta({ page, limit, total }) });
  } catch (err) {
    console.error('[adminAlertController.listAlerts]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

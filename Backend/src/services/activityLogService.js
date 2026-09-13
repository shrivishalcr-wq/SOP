/**
 * @file activityLogService.js
 * @description Service for vendor activity logging operations.
 * Provides functions to log events, retrieve recent activity, and generate paginated activity feeds.
 * @module services/activityLogService
 */

import ActivityLog from '../models/ActivityLog.js';

export async function logActivity(vendorId, event, description = '') {
  try {
    return await ActivityLog.create({
      Vendor_ID: vendorId,
      Event: event,
      Description: description,
      EventTime: new Date(),
    });
  } catch (err) {
    console.error(`[activityLogService] Failed to log "${event}" for vendor ${vendorId}:`, err.message);
    return null;
  }
}

export async function getRecentActivity(vendorId, limit = 20) {
  return ActivityLog.find({ Vendor_ID: vendorId })
    .sort({ EventTime: -1 })
    .limit(limit)
    .lean();
}

/**
 * Site-wide activity feed for the admin "Activity" page - unlike
 * getRecentActivity above (single vendor, fixed limit), this supports
 * pagination and optional vendor/event filters.
 */
export async function getActivityFeed({ vendorId, event, skip = 0, limit = 20 } = {}) {
  const match = {};
  if (vendorId) match.Vendor_ID = vendorId;
  if (event) match.Event = event;

  const [items, total] = await Promise.all([
    ActivityLog.find(match)
      .populate({ path: 'Vendor_ID', select: 'VendorName' })
      .sort({ EventTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(match),
  ]);

  return { items, total };
}

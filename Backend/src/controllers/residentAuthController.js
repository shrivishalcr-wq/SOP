/**
 * @file residentAuthController.js
 * @description Controller for resident account creation/sync and profile access.
 * A resident authenticates client-side with Firebase email/password auth
 * only; this backend never sees the password, only a verified Firebase ID
 * token (checked by requireResidentAuth). All endpoints here derive the
 * resident's identity from that token, never from a client-supplied residentId.
 * @module controllers/residentAuthController
 */

import Resident from '../models/Resident.js';

function serializeResident(resident) {
  return {
    Resident_ID: resident._id,
    Email: resident.Email,
    DisplayName: resident.DisplayName,
    Address: resident.Address,
    HomeLatitude: resident.HomeLatitude,
    HomeLongitude: resident.HomeLongitude,
    NotificationRadius: resident.NotificationRadius,
    hasLocation: resident.HomeLatitude !== null && resident.HomeLongitude !== null,
  };
}

export async function syncResident(req, res) {
  try {
    const firebaseUid = req.residentFirebaseUid;
    const claims = req.residentFirebaseClaims;

    const email = claims.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          'This Firebase session has no email on file - sign in with email/password before syncing.',
      });
    }

    if (claims.email_verified === false) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before continuing.',
      });
    }

    const { displayName, address, homeLatitude, homeLongitude } = req.body || {};
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check by FirebaseUID first (returning resident, same account)
    let resident = await Resident.findOne({ FirebaseUID: firebaseUid });

    // 2. Fall back to email (e.g. account existed before a FirebaseUID
    //    change is theoretically possible, kept for parity with the
    //    original phone-based fallback logic)
    if (!resident) {
      resident = await Resident.findOne({ Email: normalizedEmail });
    }

    if (resident) {
      let updated = false;
      if (resident.FirebaseUID !== firebaseUid) {
        resident.FirebaseUID = firebaseUid;
        updated = true;
      }
      if (resident.Email !== normalizedEmail) {
        resident.Email = normalizedEmail;
        updated = true;
      }
      if (displayName && resident.DisplayName !== displayName) {
        resident.DisplayName = displayName;
        updated = true;
      }
      if (address !== undefined && resident.Address !== address) {
        resident.Address = address;
        updated = true;
      }
      if (typeof homeLatitude === 'number' && typeof homeLongitude === 'number') {
        if (resident.HomeLatitude !== homeLatitude || resident.HomeLongitude !== homeLongitude) {
          resident.HomeLatitude = homeLatitude;
          resident.HomeLongitude = homeLongitude;
          updated = true;
        }
      }

      if (updated) {
        await resident.save();
      }

      return res.status(200).json({ success: true, message: 'Resident session synced', data: serializeResident(resident) });
    }

    // 3. New resident account creation
    const residentDoc = {
      FirebaseUID: firebaseUid,
      Email: normalizedEmail,
      DisplayName: displayName || 'Resident',
      Address: address || '',
    };

    if (typeof homeLatitude === 'number' && typeof homeLongitude === 'number') {
      residentDoc.HomeLatitude = homeLatitude;
      residentDoc.HomeLongitude = homeLongitude;
    }

    resident = await Resident.create(residentDoc);

    return res.status(201).json({ success: true, message: 'Resident account created', data: serializeResident(resident) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account already exists for this email address' });
    }
    console.error('[residentAuthController.syncResident]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getMyResidentProfile(req, res) {
  try {
    const resident = await Resident.findOne({ FirebaseUID: req.residentFirebaseUid });

    if (!resident) {
      return res.status(404).json({ success: false, message: 'No resident account found for this session - call /auth/sync first' });
    }

    return res.status(200).json({ success: true, data: serializeResident(resident) });
  } catch (err) {
    console.error('[residentAuthController.getMyResidentProfile]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateMyResidentProfile(req, res) {
  try {
    const { displayName, address, homeLatitude, homeLongitude, notificationRadius } = req.body || {};

    const update = {};
    if (displayName !== undefined) update.DisplayName = displayName;
    if (address !== undefined) update.Address = address;

    if (homeLatitude !== undefined || homeLongitude !== undefined) {
      if (typeof homeLatitude !== 'number' || typeof homeLongitude !== 'number') {
        return res.status(400).json({ success: false, message: 'homeLatitude and homeLongitude must both be provided as numbers' });
      }
      if (homeLatitude < -90 || homeLatitude > 90 || homeLongitude < -180 || homeLongitude > 180) {
        return res.status(400).json({ success: false, message: 'homeLatitude/homeLongitude out of range' });
      }
      update.HomeLatitude = homeLatitude;
      update.HomeLongitude = homeLongitude;
    }

    if (notificationRadius !== undefined) {
      if (typeof notificationRadius !== 'number' || notificationRadius < 50 || notificationRadius > 5000) {
        return res.status(400).json({ success: false, message: 'notificationRadius must be between 50 and 5000 meters' });
      }
      update.NotificationRadius = notificationRadius;
    }

    const resident = await Resident.findOneAndUpdate(
      { FirebaseUID: req.residentFirebaseUid },
      { $set: update },
      { returnDocument: 'after', runValidators: true }
    );

    if (!resident) {
      return res.status(404).json({ success: false, message: 'No resident account found for this session - call /auth/sync first' });
    }

    return res.status(200).json({ success: true, message: 'Profile updated', data: serializeResident(resident) });
  } catch (err) {
    console.error('[residentAuthController.updateMyResidentProfile]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateMyFcmToken(req, res) {
  try {
    const { fcmToken } = req.body || {};

    if (!fcmToken || typeof fcmToken !== 'string') {
      return res.status(400).json({ success: false, message: 'fcmToken is required' });
    }

    const resident = await Resident.findOneAndUpdate(
      { FirebaseUID: req.residentFirebaseUid },
      { $set: { FcmToken: fcmToken } },
      { returnDocument: 'after' }
    );

    if (!resident) {
      return res.status(404).json({ success: false, message: 'No resident account found for this session - call /auth/sync first' });
    }

    return res.status(200).json({ success: true, message: 'FCM token updated' });
  } catch (err) {
    console.error('[residentAuthController.updateMyFcmToken]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

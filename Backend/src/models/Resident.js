/**
 * @file Resident.js
 * @description Mongoose model for resident accounts.
 * Stores resident information, home location, notification preferences, and Firebase tokens.
 * Email/password authentication: every resident signs in with a Firebase
 * email/password account, so Email is always present. (Previously
 * phone-OTP based - switched to avoid per-verification SMS charges from
 * Firebase Phone Auth; vendors still use phone identity via WhatsApp.)
 * @module models/Resident
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const ResidentSchema = new Schema(
  {
    Email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    FirebaseUID: {
      type: String,
      required: [true, 'FirebaseUID is required'],
      unique: true,
      index: true,
    },

    FcmToken: {
      type: String,
      default: null,
    },

    DisplayName: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    Address: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },

    HomeLatitude: {
      type: Number,
      default: null,
      min: -90,
      max: 90,
    },

    HomeLongitude: {
      type: Number,
      default: null,
      min: -180,
      max: 180,
    },

    NotificationRadius: {
      type: Number,
      default: 500,
      min: 50,
      max: 5000,
    },
  },
  { timestamps: true }
);

ResidentSchema.virtual('Resident_ID').get(function () {
  return this._id;
});

ResidentSchema.set('toJSON', { virtuals: true });
ResidentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Resident', ResidentSchema);

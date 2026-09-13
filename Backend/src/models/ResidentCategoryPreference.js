/**
 * @file ResidentCategoryPreference.js
 * @description Mongoose model for resident category preferences.
 * Manages many-to-many relationship between residents and their preferred vendor categories.
 * @module models/ResidentCategoryPreference
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const ResidentCategoryPreferenceSchema = new Schema(
  {
    Resident_ID: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: [true, 'Resident_ID is required'],
      index: true,
    },

    Category_ID: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category_ID is required'],
      index: true,
    },
  },
  { timestamps: true }
);

ResidentCategoryPreferenceSchema.index({ Resident_ID: 1, Category_ID: 1 }, { unique: true });

export default mongoose.model('ResidentCategoryPreference', ResidentCategoryPreferenceSchema);

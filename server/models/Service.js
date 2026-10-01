import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['SOIL_PLOUGHING', 'SEED_SOWING', 'TROLLEY_LOAD'],
      required: true
    },
    categoryNames: {
      te: { type: String, required: true },
      en: { type: String, required: true },
      hi: { type: String, required: true }
    },
    name: {
      te: { type: String, required: true },
      en: { type: String, required: true },
      hi: { type: String, required: true }
    },
    unit: {
      type: String,
      enum: ['Acre', 'Trip'],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    image: {
      type: String,
      default: '/images/hero_banner.jpg'
    },
    icon: {
      type: String,
      default: 'Tractor'
    },
    description: {
      te: { type: String, default: '' },
      en: { type: String, default: '' },
      hi: { type: String, default: '' }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const Service = mongoose.model('Service', serviceSchema);
export default Service;

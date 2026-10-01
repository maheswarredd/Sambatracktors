import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Service description is required']
    },
    pricePerAcre: {
      type: Number,
      required: [true, 'Price per acre is required'],
      min: [100, 'Price per acre must be at least ₹100']
    },
    unit: {
      type: String,
      default: 'acre'
    },
    minAcres: {
      type: Number,
      default: 1
    },
    maxAcres: {
      type: Number,
      default: 50
    },
    estimatedHoursPerAcre: {
      type: Number,
      default: 1.5
    },
    category: {
      type: String,
      enum: ['Land Preparation', 'Sowing & Planting', 'Harvesting', 'Transport & Trolley', 'General Farming'],
      default: 'Land Preparation'
    },
    image: {
      type: String,
      default: ''
    },
    features: [
      {
        type: String
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Service', serviceSchema);

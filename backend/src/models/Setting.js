import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    upiId: {
      type: String,
      default: 'sambatractors@upi'
    },
    upiPayeeName: {
      type: String,
      default: 'Samba Tractors Fleet & Farm Services'
    },
    qrCodeUrl: {
      type: String,
      default: ''
    },
    supportPhone: {
      type: String,
      default: '+91 98420 56789'
    },
    supportEmail: {
      type: String,
      default: 'support@sambatractors.com'
    },
    workingHours: {
      type: String,
      default: '4:00 AM - 9:00 PM (All 7 Days)'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);

import mongoose from 'mongoose';

const tractorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tractor model/brand name is required'],
      trim: true
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    hp: {
      type: Number,
      default: 55
    },
    type: {
      type: String,
      default: '4WD Heavy Agricultural'
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'maintenance', 'inactive'],
      default: 'available'
    },
    currentRider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    image: {
      type: String,
      default: '/images/hero_banner.jpg'
    },
    notes: String
  },
  {
    timestamps: true
  }
);

export const Tractor = mongoose.model('Tractor', tractorSchema);
export default Tractor;

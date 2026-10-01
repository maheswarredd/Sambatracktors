import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email / Gmail is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.FARMER
    },
    isActive: {
      type: Boolean,
      default: true
    },
    riderDetails: {
      licenseNumber: { type: String, default: '' },
      experienceYears: { type: Number, default: 2 },
      currentTractor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tractor',
        default: null
      },
      rating: { type: Number, default: 4.9 },
      totalTrips: { type: Number, default: 0 },
      isAvailable: { type: Boolean, default: true },
      currentLocation: {
        lat: { type: Number, default: 11.6643 },
        lng: { type: Number, default: 78.1460 }
      }
    },
    farmerDetails: {
      village: { type: String, default: '' },
      defaultAddress: { type: String, default: '' },
      defaultLandmark: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);

import mongoose from 'mongoose';

const tractorSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Tractor registration number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    modelName: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true
    },
    horsePower: {
      type: Number,
      required: [true, 'Horsepower (HP) is required']
    },
    fuelType: {
      type: String,
      default: 'Diesel'
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'IN_SERVICE', 'MAINTENANCE'],
      default: 'AVAILABLE'
    },
    assignedRider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    implementsSupported: [
      {
        type: String
      }
    ],
    image: {
      type: String,
      default: '/images/tractors/default-tractor.jpg'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Tractor', tractorSchema);

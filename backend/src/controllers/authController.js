import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'samba_tractors_super_secret_jwt_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new Farmer
// @route   POST /api/auth/register
// @access  Public
export const registerFarmer = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword, village, defaultAddress, defaultLandmark } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email/Gmail, mobile number, and password'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please verify and try again.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email/Gmail already exists. Please login or use another email.'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: ROLES.FARMER,
      farmerDetails: {
        village: village || '',
        defaultAddress: defaultAddress || '',
        defaultLandmark: defaultLandmark || ''
      }
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Farmer account registered successfully! Welcome to Samba Tractors.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        farmerDetails: user.farmerDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login User (Farmer, Rider, or Admin)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password, requestedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with this email.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact Samba Tractors support.'
      });
    }

    // Role check if user logged in via specific portal
    if (requestedRole && requestedRole !== user.role && user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: `Account is registered as ${user.role}. Please login via the correct portal.`
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        farmerDetails: user.farmerDetails,
        riderDetails: user.riderDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, village, defaultAddress, defaultLandmark } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();

    if (user.role === ROLES.FARMER) {
      user.farmerDetails = {
        village: village !== undefined ? village : user.farmerDetails.village,
        defaultAddress: defaultAddress !== undefined ? defaultAddress : user.farmerDetails.defaultAddress,
        defaultLandmark: defaultLandmark !== undefined ? defaultLandmark : user.farmerDetails.defaultLandmark
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        farmerDetails: user.farmerDetails,
        riderDetails: user.riderDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

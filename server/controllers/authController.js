import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'samba_tractors_super_secret_jwt_key_2026', {
    expiresIn: '30d'
  });
};

// @desc    Register a new farmer / user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, role, language, village, address } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Gmail / email address' });
    }

    // Mobile number validation (10 digits)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
    }

    // Check duplicate email
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this Gmail already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: cleanPhone,
      password,
      role: role && ['farmer', 'rider', 'admin'].includes(role) ? role : 'farmer',
      language: language || 'te',
      village: village || '',
      address: address || ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        language: user.language,
        village: user.village,
        address: user.address,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/phone and password' });
    }

    // Search by email or phone
    const cleanInput = emailOrPhone.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: cleanInput }, { phone: cleanInput }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact Admin.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check and try again.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        language: user.language,
        village: user.village,
        address: user.address,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedTractor');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user language preference
// @route   PATCH /api/auth/language
// @access  Private
export const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    if (!['te', 'en', 'hi'].includes(language)) {
      return res.status(400).json({ success: false, message: 'Invalid language code' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { language },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Language updated',
      data: { language: user.language }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

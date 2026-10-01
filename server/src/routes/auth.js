const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  registerFarmer,
  loginUser,
  logoutUser,
  getMe,
  changePassword,
  updateProfile,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .isMobilePhone()
      .withMessage('Valid phone number is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('village').trim().notEmpty().withMessage('Village is required'),
    body('district').trim().notEmpty().withMessage('District is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
  ],
  validate,
  registerFarmer
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  loginUser
);

// POST /api/auth/logout
router.post('/logout', verifyToken, logoutUser);

// GET /api/auth/me
router.get('/me', verifyToken, getMe);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  verifyToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ],
  validate,
  changePassword
);

// PUT /api/auth/profile
router.put(
  '/profile',
  verifyToken,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('village').optional().trim().notEmpty().withMessage('Village cannot be empty'),
    body('district').optional().trim().notEmpty().withMessage('District cannot be empty'),
    body('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
  ],
  validate,
  updateProfile
);

module.exports = router;

const { body, param, query, validationResult } = require('express-validator');

// ---------------------------------------------------------------------------
// Reusable field validators
// ---------------------------------------------------------------------------

const phoneValidator = body('phone')
  .trim()
  .notEmpty().withMessage('Phone number is required.')
  .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number.');

const passwordValidator = (field = 'password') =>
  body(field)
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/\d/).withMessage('Password must contain at least one digit.');

// ---------------------------------------------------------------------------
// Validation rule sets
// ---------------------------------------------------------------------------

/**
 * registerFarmer — validate farmer registration payload
 */
const registerFarmer = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),

  phoneValidator,

  passwordValidator('password'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),

  body('village')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Village name must not exceed 100 characters.'),

  body('district')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('District name must not exceed 100 characters.'),

  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('State name must not exceed 100 characters.'),

  body('pincode')
    .optional()
    .trim()
    .matches(/^\d{6}$/).withMessage('Enter a valid 6-digit pincode.'),
];

/**
 * loginUser — validate login payload
 */
const loginUser = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

/**
 * createBooking — validate booking creation payload
 */
const createBooking = [
  body('serviceId')
    .notEmpty().withMessage('Service ID is required.')
    .isMongoId().withMessage('Invalid service ID.'),

  body('tractorId')
    .notEmpty().withMessage('Tractor ID is required.')
    .isMongoId().withMessage('Invalid tractor ID.'),

  body('scheduledDate')
    .notEmpty().withMessage('Scheduled date is required.')
    .isISO8601().withMessage('Scheduled date must be a valid date (ISO 8601).')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (date < now) {
        throw new Error('Scheduled date cannot be in the past.');
      }
      return true;
    }),

  body('timeSlot')
    .notEmpty().withMessage('Time slot is required.')
    .isIn(['morning', 'afternoon', 'evening', 'full-day'])
    .withMessage('Time slot must be one of: morning, afternoon, evening, full-day.'),

  body('acres')
    .notEmpty().withMessage('Number of acres is required.')
    .isFloat({ min: 0.1, max: 500 }).withMessage('Acres must be between 0.1 and 500.'),

  body('farmLocation')
    .notEmpty().withMessage('Farm location is required.')
    .isObject().withMessage('Farm location must be an object.'),

  body('farmLocation.address')
    .trim()
    .notEmpty().withMessage('Farm address is required.')
    .isLength({ max: 300 }).withMessage('Address must not exceed 300 characters.'),

  body('farmLocation.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude].'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters.'),
];

/**
 * createService — validate service creation payload
 */
const createService = [
  body('name')
    .trim()
    .notEmpty().withMessage('Service name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Service name must be between 2 and 100 characters.'),

  body('description')
    .trim()
    .notEmpty().withMessage('Service description is required.')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters.'),

  body('category')
    .notEmpty().withMessage('Category is required.')
    .isIn(['ploughing', 'sowing', 'harvesting', 'spraying', 'transportation', 'other'])
    .withMessage('Invalid service category.'),

  body('pricePerAcre')
    .notEmpty().withMessage('Price per acre is required.')
    .isFloat({ min: 1 }).withMessage('Price per acre must be a positive number.'),

  body('duration')
    .optional()
    .isInt({ min: 1 }).withMessage('Duration must be a positive integer (hours).'),

  body('availableTimeSlots')
    .optional()
    .isArray().withMessage('Available time slots must be an array.')
    .custom((slots) => {
      const valid = ['morning', 'afternoon', 'evening', 'full-day'];
      if (slots.some((s) => !valid.includes(s))) {
        throw new Error('Each time slot must be one of: morning, afternoon, evening, full-day.');
      }
      return true;
    }),
];

/**
 * createTractor — validate tractor creation payload
 */
const createTractor = [
  body('make')
    .trim()
    .notEmpty().withMessage('Tractor make is required.')
    .isLength({ max: 100 }).withMessage('Make must not exceed 100 characters.'),

  body('model')
    .trim()
    .notEmpty().withMessage('Tractor model is required.')
    .isLength({ max: 100 }).withMessage('Model must not exceed 100 characters.'),

  body('year')
    .notEmpty().withMessage('Manufacturing year is required.')
    .isInt({ min: 1980, max: new Date().getFullYear() + 1 })
    .withMessage(`Year must be between 1980 and ${new Date().getFullYear() + 1}.`),

  body('registrationNumber')
    .trim()
    .notEmpty().withMessage('Registration number is required.')
    .isLength({ max: 20 }).withMessage('Registration number must not exceed 20 characters.'),

  body('horsePower')
    .optional()
    .isFloat({ min: 1 }).withMessage('Horse power must be a positive number.'),

  body('serviceIds')
    .optional()
    .isArray().withMessage('Service IDs must be an array.')
    .custom((ids) => {
      const { isValidObjectId } = require('mongoose');
      if (ids.some((id) => !isValidObjectId(id))) {
        throw new Error('One or more service IDs are invalid.');
      }
      return true;
    }),

  body('operatorId')
    .optional()
    .isMongoId().withMessage('Invalid operator ID.'),

  body('ratePerAcre')
    .optional()
    .isFloat({ min: 0 }).withMessage('Rate per acre must be a non-negative number.'),
];

// ---------------------------------------------------------------------------
// Centralised validation result checker
// ---------------------------------------------------------------------------

/**
 * validateRequest — Express middleware that reads express-validator results
 * and returns a 422 with all field errors if validation failed.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please fix the errors and try again.',
      errors: formatted,
    });
  }
  next();
};

module.exports = {
  registerFarmer,
  loginUser,
  createBooking,
  createService,
  createTractor,
  validateRequest,
};

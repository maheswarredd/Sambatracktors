const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure a directory exists; create it recursively if it doesn't.
 * @param {string} dir - Absolute or relative path to directory
 */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Build a multer DiskStorage engine for a given subfolder under server/uploads/.
 * @param {string} subfolder - e.g. 'payments', 'services', 'qrcodes'
 */
const buildStorage = (subfolder) => {
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', subfolder);
  ensureDir(uploadDir);

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${subfolder}-${uniqueSuffix}${ext}`);
    },
  });
};

// ---------------------------------------------------------------------------
// File filter factories
// ---------------------------------------------------------------------------

/**
 * Accept only image MIME types.
 */
const imageFileFilter = (_req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        `Only image files are allowed. Received: ${file.mimetype}`
      ),
      false
    );
  }
};

// ---------------------------------------------------------------------------
// Multer instances
// ---------------------------------------------------------------------------

/**
 * uploadPayment — for payment screenshots.
 * Field name : 'screenshot'
 * Max size   : 5 MB
 * Types      : images only
 */
const uploadPayment = multer({
  storage: buildStorage('payments'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

/**
 * uploadServiceImages — for tractor / service images.
 * Field name : 'images' (up to 5 files)
 * Max size   : 5 MB per file
 * Types      : images only
 */
const uploadServiceImages = multer({
  storage: buildStorage('services'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 5,
  },
});

/**
 * uploadQrCode — for payment QR code images.
 * Field name : 'qrcode'
 * Max size   : 5 MB
 * Types      : images only
 */
const uploadQrCode = multer({
  storage: buildStorage('qrcodes'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

// ---------------------------------------------------------------------------
// Error-handling helper (use as next middleware after multer middleware)
// ---------------------------------------------------------------------------

/**
 * handleUploadError — catches Multer errors and returns a clean JSON response.
 * Place immediately after the multer upload middleware in route definitions.
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error.';
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File is too large. Maximum allowed size is 5 MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded at once.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = err.message || 'Unexpected file field.';
        break;
      default:
        message = err.message;
    }
    return res.status(400).json({ success: false, message });
  }
  next(err);
};

module.exports = {
  uploadPayment,
  uploadServiceImages,
  uploadQrCode,
  handleUploadError,
};

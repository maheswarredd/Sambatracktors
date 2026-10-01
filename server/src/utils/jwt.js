const jwt = require('jsonwebtoken');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

// ---------------------------------------------------------------------------
// generateToken
// ---------------------------------------------------------------------------

/**
 * Generate a signed JWT access token.
 * @param {string} userId  - MongoDB ObjectId string of the user
 * @param {string} role    - User's role (e.g. 'farmer', 'operator', 'admin')
 * @returns {string} Signed JWT string
 */
const generateToken = (userId, role) => {
  if (!userId || !role) {
    throw new Error('generateToken: userId and role are required.');
  }

  return jwt.sign(
    {
      userId: userId.toString(),
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'samba-tractors',
      audience: 'samba-tractors-client',
    }
  );
};

// ---------------------------------------------------------------------------
// verifyToken
// ---------------------------------------------------------------------------

/**
 * Verify a JWT access token and return its decoded payload.
 * Throws a JsonWebTokenError or TokenExpiredError on failure.
 * @param {string} token - JWT string to verify
 * @returns {{ userId: string, role: string, iat: number, exp: number }} Decoded payload
 */
const verifyToken = (token) => {
  if (!token) {
    throw new Error('verifyToken: token is required.');
  }

  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'samba-tractors',
    audience: 'samba-tractors-client',
  });
};

// ---------------------------------------------------------------------------
// generateRefreshToken
// ---------------------------------------------------------------------------

/**
 * Generate a long-lived refresh token for the given user.
 * @param {string} userId - MongoDB ObjectId string of the user
 * @returns {string} Signed refresh JWT string
 */
const generateRefreshToken = (userId) => {
  if (!userId) {
    throw new Error('generateRefreshToken: userId is required.');
  }

  return jwt.sign(
    {
      userId: userId.toString(),
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'samba-tractors',
      audience: 'samba-tractors-client',
    }
  );
};

/**
 * Verify a refresh token and return its decoded payload.
 * @param {string} token - Refresh JWT string to verify
 * @returns {{ userId: string, type: string, iat: number, exp: number }} Decoded payload
 */
const verifyRefreshToken = (token) => {
  if (!token) {
    throw new Error('verifyRefreshToken: token is required.');
  }

  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'samba-tractors',
    audience: 'samba-tractors-client',
  });

  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type. Expected refresh token.');
  }

  return payload;
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};

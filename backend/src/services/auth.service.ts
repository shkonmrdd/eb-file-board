import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT settings
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

interface UserPayload {
  userId: string;
}

// Token generation on first startup
let initialToken: string | null = null;

/**
 * Generate JWT token for authentication
 */
export const generateToken = (userId: string = 'admin'): string => {
  const payload: UserPayload = { userId };
  
  // Generate token with no expiration
  return jwt.sign(payload, JWT_SECRET);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

/**
 * Generate an initial token on first server startup
 * This is used for first-time access
 */
export const getInitialToken = (): string => {
  if (!initialToken) {
    initialToken = generateToken();
    console.log('\n=====================================================');
    console.log(`INITIAL LOGIN TOKEN: ${initialToken}`);
    console.log('=====================================================\n');
    console.log('Use this token to authenticate. This token does not expire.');
    console.log('To set a custom secret, use the JWT_SECRET environment variable.');
  }
  return initialToken;
};

/**
 * Get auth configuration for server
 */
export const getAuthConfig = () => {
  return {
    jwtSecret: JWT_SECRET,
    initialToken: getInitialToken()
  };
}; 
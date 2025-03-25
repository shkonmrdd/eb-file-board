import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { SignOptions } from 'jsonwebtoken';

// JWT settings
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d'; // 30 days by default

// Token generation on first startup
let initialToken: string | null = null;

interface UserPayload {
  userId: string;
}

/**
 * Generate JWT token for authentication
 */
export const generateToken = (userId: string = 'admin'): string => {
  const payload: UserPayload = { userId };
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as string
  };
  return jwt.sign(payload, JWT_SECRET, options);
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
    console.log('Use this token to authenticate. It will be valid for 30 days.');
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
    jwtExpiresIn: JWT_EXPIRES_IN,
    initialToken: getInitialToken()
  };
}; 
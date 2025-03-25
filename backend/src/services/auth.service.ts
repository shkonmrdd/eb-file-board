import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ms from 'ms';
import { SignOptions } from 'jsonwebtoken';

// JWT settings
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Default to 30 days
const DEFAULT_EXPIRY = '30d'; 

// Use the configured expiration time or the default
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRY;

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
  
  // Use a more direct approach to set the expiration
  // This avoids TypeScript errors while still using the JWT_EXPIRES_IN value
  return jwt.sign(payload, JWT_SECRET, {
    // Force the type to any to bypass TypeScript's strict typing
    // jsonwebtoken accepts strings like '30d', '7d', etc.
    expiresIn: JWT_EXPIRES_IN as any
  });
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
 * Get expiration time in milliseconds
 */
export const getExpirationMs = (): number => {
  try {
    // Use ms to convert time strings to milliseconds
    // We need to cast to StringValue type for ms
    const expiry = JWT_EXPIRES_IN as ms.StringValue;
    return ms(expiry);
  } catch (error) {
    console.error(`Error parsing JWT expiration time: ${error}`);
    // Default to 30 days if there's an error
    return ms(DEFAULT_EXPIRY as ms.StringValue);
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
    console.log(`Use this token to authenticate. It will be valid for ${JWT_EXPIRES_IN}.`);
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
    expirationMs: getExpirationMs(),
    initialToken: getInitialToken()
  };
}; 
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT settings
function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }

  const secret = crypto.randomBytes(32).toString('hex');
  console.log('\n=====================================================');
  console.log(`GENERATED JWT_SECRET: ${secret}`);
  console.log('=====================================================\n');
  return secret;
}

const JWT_SECRET = getJwtSecret();

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
    console.error('JWT verification failed:', (error as Error).message);
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
    console.log(`GENERATED INITIAL LOGIN TOKEN: ${initialToken}`);
    console.log('=====================================================\n');
    console.log('Use this token to authenticate. This token does not expire.');
    console.log('To set a custom secret, use the JWT_SECRET environment variable.');
  }
  return initialToken;
};

// Export JWT_SECRET for use in the server
export { JWT_SECRET }; 
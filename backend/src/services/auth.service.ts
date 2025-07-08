import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ms from 'ms';

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
  console.log('Generated random JWT_SECRET for development (rotates on each restart).');
  console.log('=====================================================\n');
  return secret;
}

const JWT_SECRET = getJwtSecret();

// Token expiry and issuer configuration for normal login tokens
// Convert expiry to seconds for jwt.sign (expects numeric seconds)
const BROWSER_TOKEN_EXPIRES_IN_SECONDS = Math.floor(
  ms((process.env.BROWSER_TOKEN_EXPIRES_IN || '365d') as ms.StringValue) / 1000,
);

// Initial bootstrap token lifetime (fixed 15 minutes)
const INITIAL_TOKEN_EXPIRES_IN_SECONDS = Math.floor(ms('15m') / 1000);
const JWT_ISSUER = 'eb-file-board';

interface UserPayload {
  userId: string;
}

// Token generation on first startup
let initialToken: string | null = null;

/**
 * Generate JWT token for authentication
 */
export const generateToken = (
  expiresInSeconds: number = BROWSER_TOKEN_EXPIRES_IN_SECONDS,
): string => {
  const payload: UserPayload = { userId: 'admin' };

  // Choose signing options based on whether we want expiration
  const signOptions: jwt.SignOptions = { expiresIn: expiresInSeconds, issuer: JWT_ISSUER };

  return jwt.sign(payload, JWT_SECRET, signOptions);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): UserPayload | null => {
  try {
    const verifyOptions: jwt.VerifyOptions = {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
    };
    return jwt.verify(token, JWT_SECRET, verifyOptions) as UserPayload;
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
    initialToken = generateToken(INITIAL_TOKEN_EXPIRES_IN_SECONDS);

    console.log('\n=====================================================');
    console.log(`BOOTSTRAP TOKEN: \n\n${initialToken}\n`);
    console.log(`Expires in 15 minutes.`);
    console.log('Restart the server to generate a new initial token.\n');
    console.log(`After login, your browser will receive an HTTP-only cookie with a JWT that expires in ${ms(BROWSER_TOKEN_EXPIRES_IN_SECONDS * 1000)}.`);
    console.log('=====================================================\n');
  
  setTimeout(() => {
    initialToken = null;
    console.log('\n=====================================================');
    console.log('Initial token expired. Restart the server if you want to generate a new one.');
    console.log('=====================================================\n');
  }, INITIAL_TOKEN_EXPIRES_IN_SECONDS * 1000);
  }
  return initialToken;
};

// Export JWT_SECRET for use in the server
export { JWT_SECRET }; 
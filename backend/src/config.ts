import path from "path";
import fs from "fs";
import crypto from "crypto";

// Function to generate or get the auth token from environment
function getAuthToken(): string {
  // Check if token is provided through environment variable
  if (process.env.API_TOKEN) {
    return process.env.API_TOKEN;
  }
  
  // Generate a new token if not provided through environment
  const newToken = crypto.randomBytes(32).toString('hex');
  console.log('\n=====================================================');
  console.log(`NEW AUTHENTICATION TOKEN GENERATED: ${newToken}`);
  console.log('=====================================================\n');
  console.log('This token will not be persisted and will be lost on container restart.');
  console.log('To use a persistent token, set the API_TOKEN environment variable.');
  
  return newToken;
}

// Configuration with environment variables and defaults
export const config = {
  port: parseInt(process.env.PORT || "3001", 10),

  // Files storage location - can be configured with environment variable
  // Default: 'files' (relative path for local development)
  // Docker: '/data/files' (absolute path for container, can be mounted as a volume)
  uploadsPath:
    process.env.NODE_ENV === "production"
      ? "/data/files"
      : path.join(process.cwd(), "files"),

  // Fixed route for accessing files - this should NOT be changed
  // as it's used in frontend URLs and other parts of the application
  uploadsRoute: "/files",
  
  // Authentication
  auth: {
    enabled: process.env.AUTH_ENABLED !== 'false', // Enabled by default
    token: getAuthToken(),
    headerName: 'X-API-Key',
  },
  
  // Network access controls
  network: {
    // Only allow connections from localhost by default
    allowedIPs: (process.env.ALLOWED_IPS || '127.0.0.1,::1').split(','),
  }
};

// Ensure the configuration is loaded only once
console.log(`Server configuration loaded:`);
console.log(`- Files storage location: ${config.uploadsPath}`);
console.log(`- Files access route: ${config.uploadsRoute}`);
console.log(`- Authentication: ${config.auth.enabled ? 'enabled' : 'disabled'}`);
if (!config.auth.enabled) {
  console.warn('WARNING: Authentication is disabled. This is not recommended for production.');
}
console.log(`- Allowed IPs: ${config.network.allowedIPs.join(', ')}`);

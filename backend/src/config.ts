import path from "path";
import fs from "fs";

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
console.log(`- JWT authentication: enabled`);
console.log(`- Allowed IPs: ${config.network.allowedIPs.join(', ')}`);

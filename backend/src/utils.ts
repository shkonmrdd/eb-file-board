export const log = (message: string): void => {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, -5);
  console.log(`[${timestamp}] ${message}`);
};

export const getCorsOrigins = () => {
  if (process.env.CORS_ORIGINS) {
    const origins = process.env.CORS_ORIGINS
    const cleaned = origins.replaceAll(' ', '');
    return cleaned.split(',');
  }
  
  // Default for development environment
  return ['http://localhost:5173'];
}

/**
 * Sanitize board name to prevent directory traversal attacks and ensure filesystem compatibility
 * Only allows alphanumeric characters and hyphens, replacing all other characters with underscores
 * @param boardName - The raw board name to sanitize
 * @returns Sanitized board name safe for filesystem operations
 */
export const sanitizeBoardName = (boardName: string): string => {
  return boardName.replace(/[^a-z0-9\-]/gi, '_');
}
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

export const sanitizeBoardName = (boardName: string): string => boardName.replace(/[^a-z0-9\-]/gi, '_');
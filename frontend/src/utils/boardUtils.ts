/**
 * Sanitize board name to match backend sanitization and ensure consistency
 * Only allows alphanumeric characters and hyphens, replacing all other characters with underscores
 * @param boardName - The raw board name to sanitize
 * @returns Sanitized board name safe for filesystem operations
 */
export const sanitizeBoardName = (boardName: string): string => {
  return boardName.replace(/[^a-z0-9\-]/gi, '_');
}; 
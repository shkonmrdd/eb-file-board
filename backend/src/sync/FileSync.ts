import crypto from 'crypto';

export interface FileUpdate {
  path: string;
  content: string;
  hash: string;
}

const fileHashes: Record<string, string> = {};

export const calculateHash = (content: string): string => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

export const setFileHash = (filePath: string, hash: string): void => {
  fileHashes[filePath] = hash;
};

export const getFileHash = (filePath: string): string => {
  return fileHashes[filePath] || '';
};

export const hasFileChanged = (filePath: string, newHash: string): boolean => {
  return getFileHash(filePath) !== newHash;
};

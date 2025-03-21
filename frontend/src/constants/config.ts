export const API_CONFIG = {
  BASE_URL: import.meta.env.PROD ? '' : 'http://localhost:3001',
  ENDPOINTS: {
    UPLOAD: '/upload',
    BOARD: '/files/:boardName/board.json'
  }
} as const;

export const FILE_TYPES = {
  MARKDOWN: ['md', 'markdown'],
  PDF: ['pdf'],
  TEXT: ['txt']
} as const;

export const DEFAULT_POSITION = {
  x: 100,
  y: 100
} as const;

export const DEBOUNCE_DELAY = 250; 
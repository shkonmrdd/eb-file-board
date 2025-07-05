import { API_CONFIG } from '../constants/config';

export const getFileType = (url: string): 'pdf' | 'markdown' | 'txt' | 'unknown' => {
  try {
    const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
    const urlObj = new URL(fullUrl);
    const pathname = urlObj.pathname.toLowerCase();

    if (pathname.endsWith('.pdf')) return 'pdf';
    if (pathname.endsWith('.md') || pathname.endsWith('.markdown')) return 'markdown';
    if (pathname.endsWith('.txt')) return 'txt';

    // Fallback for legacy formats
    if (url.includes('/pdf/')) return 'pdf';
    if (url.includes('/md/')) return 'markdown';
    if (url.includes('/txt/')) return 'txt';

    const fileParam = urlObj.searchParams.get('file');
    if (fileParam) {
      const lower = fileParam.toLowerCase();
      if (lower.endsWith('.pdf')) return 'pdf';
      if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
      if (lower.endsWith('.txt')) return 'txt';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
};

export const getPreviewMode = (url: string): 'edit' | 'live' | 'preview' => {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`);
    const preview = urlObj.searchParams.get('preview');
    if (preview === 'edit' || preview === 'live') return preview;
    return 'preview';
  } catch {
    return 'preview';
  }
}; 
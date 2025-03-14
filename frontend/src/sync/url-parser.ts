export interface ParsedEmbeddableUrl {
    type: 'markdown' | 'pdf' | 'unknown';
    filePath: string;
    previewMode?: 'edit' | 'view';
    originalUrl: string;
  }
  
  export function parseEmbeddableUrl(url: string): ParsedEmbeddableUrl {
    try {
      // Handle relative URLs
      const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
      const urlObj = new URL(fullUrl);
      
      // Extract the filePath parameter
      const filePath = urlObj.searchParams.get('url') || '';
      
      // Determine the type based on the path
      let type: 'markdown' | 'pdf' | 'unknown' = 'unknown';
      if (urlObj.pathname.includes('/md/')) {
        type = 'markdown';
      } else if (urlObj.pathname.includes('/pdf/')) {
        type = 'pdf';
      }
      
      // Extract the preview mode if available
      const previewMode = urlObj.searchParams.get('preview') as 'edit' | 'view' | undefined;
      
      return {
        type,
        filePath,
        previewMode,
        originalUrl: url
      };
    } catch (error) {
      console.error('Failed to parse embeddable URL:', error);
      return {
        type: 'unknown',
        filePath: '',
        originalUrl: url
      };
    }
  }
  
  export function constructEmbeddableUrl(
    type: 'markdown' | 'pdf',
    filePath: string,
    previewMode: 'edit' | 'view' = 'edit'
  ): string {
    const basePath = type === 'markdown' ? '/md/' : '/pdf/';
    return `${basePath}?url=${encodeURIComponent(filePath)}&preview=${previewMode}`;
  }
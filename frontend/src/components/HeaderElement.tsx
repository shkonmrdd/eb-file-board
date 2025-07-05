import React from 'react';
import { API_CONFIG } from '../constants/config';

interface HeaderElementProps {
  url: string;
  width?: string | number;
  height?: string | number;
}

const buildAbsoluteUrl = (fileParam: string | null): string | null => {
  if (!fileParam) return null;
  const trimmed = fileParam.startsWith('/') ? fileParam.slice(1) : fileParam;
  const uploadsPrefix = API_CONFIG.UPLOADS_ROUTE.replace(/^\//, '');
  const pathWithUploads = trimmed.startsWith(uploadsPrefix) ? trimmed : `${uploadsPrefix}/${trimmed}`;

  const prefix = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL;
  return `${prefix}/${pathWithUploads}`;
};

const HeaderElement: React.FC<HeaderElementProps> = ({ url, width = '100%', height = '50px' }) => {
  const fileUrl = url.startsWith('http') ? url : buildAbsoluteUrl(url);

  // Determine displayed file name
  let fileName = '';
  if (fileUrl) {
    try {
      const fileURL = new URL(fileUrl);
      fileName = decodeURI(fileURL.pathname.split('/').pop() || fileURL.pathname);
    } catch (error) {
      console.error('Invalid URL format:', error);
      fileName = url; // Fallback to original URL
    }
  }

  return (
    <div 
      style={{ 
        width, 
        height, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #ddd',
        borderRadius: '4px',
        isolation: 'isolate', // Prevent Tailwind interference
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        color: '#333'
      }}
    >
      {fileUrl && (
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            textDecoration: 'none',
            color: '#007bff',
            padding: '8px 16px',
            borderRadius: '4px',
            transition: 'background-color 0.2s ease',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e9ecef';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {fileName || 'Open File'}
        </a>
      )}
      {!fileUrl && (
        <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
          Invalid file URL
        </span>
      )}
    </div>
  );
};

export default HeaderElement; 
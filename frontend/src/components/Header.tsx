import React from 'react';
import { useLocation } from 'react-router';
import styles from './Header.module.css';
import { API_CONFIG } from '../constants/config';

const buildAbsoluteUrl = (fileParam: string | null): string | null => {
  if (!fileParam) return null;
  const trimmed = fileParam.startsWith('/') ? fileParam.slice(1) : fileParam;
  const uploadsPrefix = API_CONFIG.UPLOADS_ROUTE.replace(/^\//, '');
  const pathWithUploads = trimmed.startsWith(uploadsPrefix) ? trimmed : `${uploadsPrefix}/${trimmed}`;

  const prefix = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL;
  return `${prefix}/${pathWithUploads}`;
};

const Header: React.FC = () => {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);

  const urlParam = urlParams.get('url');
  const fileParam = urlParams.get('file');

  const fileUrl = urlParam || buildAbsoluteUrl(fileParam);

  // Determine displayed file name
  let fileName = '';
  if (fileParam) {
    fileName = decodeURI(fileParam);
  } else if (fileUrl) {
    try {
      const fileURL = new URL(fileUrl);
      fileName = decodeURI(fileURL.pathname);
    } catch (error) {
      console.error('Invalid URL format:', error);
      fileName = fileUrl; // Fallback
    }
  }

  return (
    <div className={styles.header}>
      {fileUrl && (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          {fileName}
        </a>
      )}
    </div>
  );
};

export default Header;

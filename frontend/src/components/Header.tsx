import React from 'react';
import { useLocation } from 'react-router';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const fileUrl = urlParams.get('url');

  // Only try to parse URL if fileUrl exists
  let fileName = '';
  if (fileUrl) {
    try {
      const fileURL = new URL(fileUrl);
      fileName = decodeURI(fileURL.pathname);
    } catch (error) {
      console.error('Invalid URL format:', error);
      fileName = fileUrl; // Fallback to the raw string if URL parsing fails
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

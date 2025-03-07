import React from "react";
import { useLocation } from "react-router";
import styles from "./Header.module.css";

const Header: React.FC = () => {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const fileUrl = urlParams.get("url");

  // parse the fileURL
  const fileURL = new URL(fileUrl ?? "");
  const fileName = decodeURI(fileURL.pathname);

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

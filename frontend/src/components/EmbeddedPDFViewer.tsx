import React, { useEffect, useRef, useState } from 'react';
import LocalPDFViewer from './LocalPDFViewer';
import { API_CONFIG } from '../constants/config';

interface EmbeddedPDFViewerProps {
  /** Original link value from Excalidraw embeddable element */
  link: string;
}

function buildAbsoluteUrl(fileParam: string | null): string | null {
  if (!fileParam) return null;
  const trimmed = fileParam.startsWith('/') ? fileParam.slice(1) : fileParam;
  const uploadsPrefix = API_CONFIG.UPLOADS_ROUTE.replace(/^\//, '');
  const pathWithUploads = trimmed.startsWith(uploadsPrefix) ? trimmed : `${uploadsPrefix}/${trimmed}`;

  const prefix = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL;
  return `${prefix}/${pathWithUploads}`;
}

/**
 * Performance-aware PDF viewer for board embeds.
 * 1. Parses the original link and resolves it to an absolute URL identical to the standalone page.
 * 2. Uses IntersectionObserver so we only fetch & render the PDF when the component is actually visible.
 */
const EmbeddedPDFViewer: React.FC<EmbeddedPDFViewerProps> = ({ link }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState<boolean>(false);

  // Observer to detect when the viewer enters viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect(); // load once
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Parse link -> pdf URL
  const urlObj = new URL(link, window.location.origin);
  const urlParam = urlObj.searchParams.get('url');
  const fileParam = urlObj.searchParams.get('file');
  const computedUrl = urlParam || buildAbsoluteUrl(fileParam);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {isInView && computedUrl ? (
        <LocalPDFViewer url={computedUrl} width="100%" height="100%" />
      ) : (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: '#666',
          }}
        >
          PDF preview
        </div>
      )}
    </div>
  );
};

export default EmbeddedPDFViewer; 
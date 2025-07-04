import React from 'react';
import { useLocation } from 'react-router';
import PDFViewer from '../components/LocalPDFViewer';
import { PDFViewerPageParams } from '../types/pdf';
import { API_CONFIG } from '../constants/config';

function buildAbsoluteUrl(fileParam: string | null): string | null {
  if (!fileParam) return null;
  const trimmed = fileParam.startsWith('/') ? fileParam.slice(1) : fileParam;
  const uploadsPrefix = API_CONFIG.UPLOADS_ROUTE.replace(/^\//, ''); // 'files'

  const pathWithUploads = trimmed.startsWith(uploadsPrefix) ? trimmed : `${uploadsPrefix}/${trimmed}`;

  const prefix = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL;
  return `${prefix}/${pathWithUploads}`;
}

function PDFViewerPage(): React.ReactElement {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);

  const urlFromParam = urlParams.get('url');
  const fileParam = urlParams.get('file');

  const computedUrl = urlFromParam || buildAbsoluteUrl(fileParam);

  const params: PDFViewerPageParams = {
    url: computedUrl,
  };

  console.log('PDF URL:', params.url);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      <PDFViewer url={params.url || ''} />
    </div>
  );
}

export default PDFViewerPage;

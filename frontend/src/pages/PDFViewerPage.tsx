import React from 'react';
import { useLocation } from 'react-router';
import PDFViewer from '../components/LocalPDFViewer';
import { PDFViewerPageParams } from '../types/pdf';

function PDFViewerPage(): React.ReactElement {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);

  const params: PDFViewerPageParams = {
    url: urlParams.get('url'),
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

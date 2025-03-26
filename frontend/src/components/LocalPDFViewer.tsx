import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFViewerProps, PDFDocumentState, PDFRenderContext } from '../types/pdf';
import { getAuthHeaders } from '../services/auth';

const pdfWorkerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const PDFViewer: React.FC<PDFViewerProps> = ({ url, width = '100%', height = '100%' }) => {
  const [state, setState] = useState<PDFDocumentState>({
    loading: true,
    error: null,
    scale: 4,
    pdfDoc: null,
    pageCanvases: [],
  });

  // Load the PDF document
  useEffect(() => {
    if (!url) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Add authentication headers
    const authHeaders = getAuthHeaders();
    const loadingTask = pdfjsLib.getDocument({
      url: url,
      httpHeaders: authHeaders
    });

    loadingTask.promise
      .then((doc) => {
        setState((prev) => ({ ...prev, pdfDoc: doc, loading: false }));
      })
      .catch((err) => {
        console.error('Error loading PDF:', err);
        setState((prev) => ({ ...prev, loading: false, error: 'Failed to load PDF: ' + err.message }));
      });

    return () => {
      if (loadingTask.destroy) loadingTask.destroy();
    };
  }, [url]);

  // Render all pages
  useEffect(() => {
    if (!state.pdfDoc) return;

    const renderAllPages = async (): Promise<void> => {
      const canvases: HTMLCanvasElement[] = [];

      try {
        // We already checked that state.pdfDoc is not null above
        const doc = state.pdfDoc!;

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          const page = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale: state.scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext: PDFRenderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
          canvases.push(canvas);
        }

        setState((prev) => ({ ...prev, pageCanvases: canvases }));
      } catch (err) {
        console.error('Error rendering pages:', err);
        setState((prev) => ({ ...prev, error: 'Failed to render pages' }));
      }
    };

    renderAllPages();
  }, [state.pdfDoc, state.scale]);

  const { loading, error, pageCanvases } = state;

  return (
    <div style={{ width, height, overflow: 'auto' }}>
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading PDF...</div>}
      {error && <div style={{ textAlign: 'center', color: 'red', padding: '20px' }}>{error}</div>}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'center',
          padding: '0px',
        }}
      >
        {pageCanvases.map((canvas, index) => (
          <div
            key={index}
            style={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              maxWidth: '100%',
            }}
          >
            <img
              src={canvas.toDataURL()}
              alt={`Page ${index + 1}`}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFViewer;

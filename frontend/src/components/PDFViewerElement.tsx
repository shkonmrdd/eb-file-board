import React, { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentState, PDFRenderContext } from '../types/pdf';
import { getAuthHeaders } from '../services/auth';
import { API_CONFIG } from '../constants/config';

const pdfWorkerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface PDFViewerElementProps {
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

const PDFViewerElement: React.FC<PDFViewerElementProps> = ({ url, width = '100%', height = '100%' }) => {
  const [state, setState] = useState<PDFDocumentState>({
    loading: true,
    error: null,
    scale: 1.5, // Smaller scale for embedded view
    pdfDoc: null,
    pageCanvases: [],
  });

  // Track active page render tasks so we can cancel them on cleanup
  const renderTasksRef = useRef<pdfjsLib.RenderTask[]>([]);

  // Load a PDF document whenever the URL changes
  useEffect(() => {
    let cancelled = false;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    const loadPdf = async (): Promise<void> => {
      if (!url) return;

      // Reset state in preparation for loading
      setState((prev) => ({ ...prev, loading: true, error: null, pageCanvases: [] }));

      // Ensure URL is absolute (backend may return relative paths)
      const absoluteUrl = url.startsWith('http') ? url : buildAbsoluteUrl(url);
      if (!absoluteUrl) {
        setState((prev) => ({ ...prev, error: 'Invalid URL', loading: false }));
        return;
      }

      try {
        loadingTask = pdfjsLib.getDocument({
          url: absoluteUrl,
          httpHeaders: getAuthHeaders(),
        });

        const doc = await loadingTask.promise;
        if (cancelled) {
          doc.destroy();
          return;
        }

        setState((prev) => ({ ...prev, pdfDoc: doc, loading: false }));
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading PDF:', err);
        setState((prev) => ({ ...prev, error: 'Failed to load PDF', loading: false }));
      }
    };

    loadPdf();

    return () => {
      cancelled = true;

      // Cancel any in-flight render tasks from the previous document
      renderTasksRef.current.forEach((task) => task.cancel());
      renderTasksRef.current = [];

      // Abort loading task if it is still pending
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch {
          /* ignore */
        }
      }
    };
  }, [url]);

  // Render all pages once the document is loaded or whenever the scale changes
  useEffect(() => {
    if (!state.pdfDoc) return;

    let cancelled = false;
    const currentRenderTasks: pdfjsLib.RenderTask[] = [];

    const renderAllPages = async (): Promise<void> => {
      const canvases: HTMLCanvasElement[] = [];

      try {
        const doc = state.pdfDoc;
        if (!doc) return;

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          if (cancelled) break;

          const page = await doc.getPage(pageNum);
          if (cancelled) break;

          const viewport = page.getViewport({ scale: state.scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext: PDFRenderContext = {
            canvasContext: context,
            viewport,
          };

          const renderTask = page.render(renderContext);
          currentRenderTasks.push(renderTask);
          await renderTask.promise;
          if (cancelled) break;

          canvases.push(canvas);
        }

        if (!cancelled) {
          setState((prev) => ({ ...prev, pageCanvases: canvases }));
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Error rendering pages:', err);
        setState((prev) => ({ ...prev, error: 'Failed to render pages' }));
      }
    };

    renderAllPages();
    renderTasksRef.current = currentRenderTasks;

    return () => {
      cancelled = true;
      currentRenderTasks.forEach((task) => task.cancel());
    };
  }, [state.pdfDoc, state.scale]);

  const { loading, error, pageCanvases } = state;

  return (
    <div 
      style={{ 
        width, 
        height, 
        overflow: 'auto',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px',
        isolation: 'isolate' // Prevent Tailwind interference
      }}
    >
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          Loading PDF...
        </div>
      )}
      {error && (
        <div style={{ 
          textAlign: 'center', 
          color: '#dc3545', 
          padding: '20px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center',
          padding: '10px',
        }}
      >
        {pageCanvases.map((canvas, index) => (
          <div
            key={index}
            style={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              maxWidth: '100%',
              backgroundColor: 'white',
              borderRadius: '2px',
            }}
          >
            <img
              src={canvas.toDataURL()}
              alt={`Page ${index + 1}`}
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFViewerElement; 
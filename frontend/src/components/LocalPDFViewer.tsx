import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

const pdfWorkerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface PDFViewerProps {
  url: string;
  width?: string | number;
  height?: string | number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  url,
  width = '100%',
  height = '100%',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale] = useState(4);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageCanvases, setPageCanvases] = useState<HTMLCanvasElement[]>([]);

  // Load the PDF document
  useEffect(() => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    
    const loadingTask = pdfjsLib.getDocument(url);
    
    loadingTask.promise
      .then(doc => {
        setPdfDoc(doc);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading PDF:', err);
        // setError('Failed to load PDF');
        setLoading(false);
      });
      
    return () => {
      if (loadingTask.destroy) loadingTask.destroy();
    };
  }, [url]);

  // Render all pages
  useEffect(() => {
    if (!pdfDoc) return;

    const renderAllPages = async () => {
      const canvases: HTMLCanvasElement[] = [];
      
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        canvases.push(canvas);
      }
      
      setPageCanvases(canvases);
    };

    renderAllPages().catch(err => {
      console.error('Error rendering pages:', err);
      setError('Failed to render pages');
    });
  }, [pdfDoc, scale]);

  return (
    <div style={{ width, height, overflow: 'auto' }}>
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading PDF...</div>}
      {error && <div style={{ textAlign: 'center', color: 'red', padding: '20px' }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '0px' }}>
        {pageCanvases.map((canvas, index) => (
          <div 
            key={index}
            style={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              maxWidth: '100%'
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
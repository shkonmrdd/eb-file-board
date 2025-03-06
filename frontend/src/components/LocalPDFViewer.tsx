import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Import the worker using Vite's ?url import
const pdfWorkerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();
  
  // Set the worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
  

interface PDFViewerProps {
  url: string;
  width?: string | number;
  height?: string | number;
  showControls?: boolean;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  url,
  width = '100%',
  height = '500px',
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  // Load the PDF document
  useEffect(() => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    
    const loadingTask = pdfjsLib.getDocument(url);
    
    loadingTask.promise
      .then(doc => {
        setPdfDoc(doc);
        setNumPages(doc.numPages);
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

  // Render the current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    
    const renderPage = async () => {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    };
    
    renderPage().catch(err => {
      console.error('Error rendering page:', err);
      setError('Failed to render page');
    });
  }, [pdfDoc, pageNum, scale]);

  const prevPage = () => {
    if (pageNum > 1) {
      setPageNum(prev => prev - 1);
    }
  };

  const nextPage = () => {
    if (pageNum < numPages) {
      setPageNum(prev => prev + 1);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div style={{ width, height, display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      {showControls && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', gap: '8px' }}>
          <button 
            onClick={prevPage} 
            disabled={pageNum <= 1 || loading}
            style={{ padding: '4px 8px' }}
          >
            Previous
          </button>
          <span>
            Page {pageNum} of {numPages}
          </span>
          <button 
            onClick={nextPage} 
            disabled={pageNum >= numPages || loading}
            style={{ padding: '4px 8px' }}
          >
            Next
          </button>
          <button onClick={zoomOut} style={{ padding: '4px 8px' }}>-</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} style={{ padding: '4px 8px' }}>+</button>
        </div>
      )}
      
      {/* PDF Canvas */}
      <div 
        style={{ 
          flex: 1, 
          overflow: 'auto', 
          display: 'flex', 
          justifyContent: 'center',
          border: '1px solid #ccc'
        }}
      >
        {loading && <div style={{ alignSelf: 'center' }}>Loading PDF...</div>}
        {error && <div style={{ alignSelf: 'center', color: 'red' }}>{error}</div>}
        <canvas ref={canvasRef} style={{ display: loading ? 'none' : 'block' }} />
      </div>
    </div>
  );
};

export default PDFViewer;
import * as pdfjsLib from 'pdfjs-dist';

// PDF Viewer Props
export interface PDFViewerProps {
  url: string;
  width?: string | number;
  height?: string | number;
}

// PDF Document State
export interface PDFDocumentState {
  loading: boolean;
  error: string | null;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  pageCanvases: HTMLCanvasElement[];
  scale: number;
}

// PDF Page Rendering Context
export interface PDFRenderContext {
  canvasContext: CanvasRenderingContext2D;
  viewport: pdfjsLib.PageViewport;
}

// Route params for PDF pages
export interface PDFViewerPageParams {
  url: string | null;
}

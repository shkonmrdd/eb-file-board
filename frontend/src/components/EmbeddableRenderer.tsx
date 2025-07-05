import React, { memo } from 'react';
import PDFViewerElement from './PDFViewerElement';
import MarkdownViewerElement from './MarkdownViewerElement';
import HeaderElement from './HeaderElement';
import { getFileType, getPreviewMode } from '../utils/linkUtils';

interface EmbeddableRendererProps {
  link: string;
}

const EmbeddableRenderer: React.FC<EmbeddableRendererProps> = memo(({ link }) => {
  const fileType = getFileType(link);

  const commonProps = {
    width: '100%',
    height: '100%',
  } as const;

  const renderWithHeader = (body: React.ReactElement) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: '0 0 auto' }}>
        <HeaderElement url={link} width="100%" height={40} />
      </div>
      <div style={{ flex: '1 1 0%', overflow: 'hidden' }}>{body}</div>
    </div>
  );

  switch (fileType) {
    case 'pdf':
      return renderWithHeader(<PDFViewerElement url={link} {...commonProps} />);
    case 'markdown':
      return renderWithHeader(
        <MarkdownViewerElement url={link} preview={getPreviewMode(link)} {...commonProps} />,
      );
    case 'txt':
      return renderWithHeader(
        <MarkdownViewerElement url={link} preview="edit" {...commonProps} />,
      );
    default:
      return <HeaderElement url={link} {...commonProps} />;
  }
});

EmbeddableRenderer.displayName = 'EmbeddableRenderer';

export default EmbeddableRenderer; 
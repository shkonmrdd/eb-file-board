import { useParams } from 'react-router';
import { Excalidraw, MainMenu, Footer } from '@excalidraw/excalidraw';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useBoardState } from '../hooks/useBoardState';
import { useState, useEffect, memo } from 'react';
import { ExcalidrawEmbeddableElement, NonDeleted } from '@excalidraw/excalidraw/element/types';
import FileCreationButtons from '../components/FileCreationButtons';
import LoadingScreen from '../components/LoadingScreen';
import BoardWrapper from '../layouts/BoardWrapper';
import { PDFViewerElement, MarkdownViewerElement, HeaderElement } from '../components';
import { API_CONFIG } from '../constants/config';

interface BoardProps {
  onLogout?: () => void;
}

const EmbeddableRenderer: React.FC<{ link: string }> = memo(({ link }) => {
  const getFileType = (url: string): string => {
    try {
      const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
      const urlObj = new URL(fullUrl);
      const pathname = urlObj.pathname.toLowerCase();

      if (pathname.endsWith('.pdf')) return 'pdf';
      if (pathname.endsWith('.md') || pathname.endsWith('.markdown')) return 'markdown';
      if (pathname.endsWith('.txt')) return 'txt';

      // Fallback for legacy formats
      if (url.includes('/pdf/')) return 'pdf';
      if (url.includes('/md/')) return 'markdown';
      if (url.includes('/txt/')) return 'txt';

      const fileParam = urlObj.searchParams.get('file');
      if (fileParam) {
        const lower = fileParam.toLowerCase();
        if (lower.endsWith('.pdf')) return 'pdf';
        if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
        if (lower.endsWith('.txt')) return 'txt';
      }

      return 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const fileType = getFileType(link);

  const getPreviewMode = (url: string): 'edit' | 'live' | 'preview' => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`);
      const preview = urlObj.searchParams.get('preview');
      if (preview === 'edit' || preview === 'live') return preview;
      return 'preview';
    } catch {
      return 'preview';
    }
  };

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
      return renderWithHeader(<MarkdownViewerElement url={link} preview="edit" {...commonProps} />);
    default:
      return <HeaderElement url={link} {...commonProps} />;
  }
});

EmbeddableRenderer.displayName = 'EmbeddableRenderer';

const Board: React.FC<BoardProps> = ({ onLogout }) => {
  const params = useParams();
  const boardName = params.boardName ?? 'main';
  const [isLoading, setIsLoading] = useState(true);

  const { excalidrawAPI, setExcalidrawAPI, initialState, debouncedUpdateState } =
    useBoardState(boardName);
  const { handleDrop, cursorPositionRef } = useDragAndDrop({
    excalidrawAPI,
    boardName,
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(
    initialState?.appState?.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  );

  // Reset loading state whenever board name changes so Excalidraw shows correct scene
  useEffect(() => {
    setIsLoading(true);
  }, [boardName]);

  useEffect(() => {
    if (initialState !== null) {
      setIsLoading(false);
      if (initialState.appState?.theme) {
        setTheme(initialState.appState.theme as 'light' | 'dark');
      }
    }
  }, [initialState]);

  return (
    <BoardWrapper currentBoard={boardName} onLogout={onLogout}>
      <div
        id="app"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
        }}
      >
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <Excalidraw
            key={boardName}
            // @ts-expect-error onDrop is not recognized by Excalidraw
            onDrop={handleDrop}
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            onPointerUpdate={(pointerData) => {
              if (pointerData.pointer) {
                cursorPositionRef.current = pointerData.pointer;
              }
            }}
            initialData={{
              elements: initialState?.elements ?? [],
              appState: {
                scrollX: initialState?.appState?.scrollX,
                scrollY: initialState?.appState?.scrollY,
                scrolledOutside: initialState?.appState?.scrolledOutside,
                name: initialState?.appState?.name,
                zoom: initialState?.appState?.zoom,
                viewBackgroundColor: initialState?.appState?.viewBackgroundColor,
                currentItemFontFamily: 2,
                currentItemRoughness: 0,
                zenModeEnabled: false,
                theme: theme,
              },
              files: initialState?.files,
            }}
            validateEmbeddable={() => true}
            renderEmbeddable={(element: NonDeleted<ExcalidrawEmbeddableElement>) => {
              if (element.link === null) {
                return null;
              }

              return <EmbeddableRenderer link={element.link} />;
            }}
            onChange={(elements, appState) => {
              debouncedUpdateState(elements, appState);
              if ((appState as any)?.theme && (appState as any).theme !== theme) {
                setTheme((appState as any).theme as 'light' | 'dark');
              }
            }}
          >
            <MainMenu>
              <MainMenu.DefaultItems.LoadScene />
              <MainMenu.DefaultItems.Export />
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.SearchMenu />
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.DefaultItems.ToggleTheme />
              <MainMenu.Separator />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>

            <Footer>
              <FileCreationButtons
                excalidrawAPI={excalidrawAPI}
                boardName={boardName}
                cursorPositionRef={cursorPositionRef}
                theme={theme}
              />
            </Footer>
          </Excalidraw>
        )}
      </div>
    </BoardWrapper>
  );
};

export default Board;

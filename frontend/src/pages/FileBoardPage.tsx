import { useParams } from 'react-router';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useBoardState } from '../hooks/useBoardState';
import { useState, useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { ExcalidrawEmbeddableElement, NonDeleted } from '@excalidraw/excalidraw/element/types';
import EmbeddedMarkdownViewer from '../components/EmbeddedMarkdownViewer';
import EmbeddedPDFViewer from '../components/EmbeddedPDFViewer';

// Add onLogout prop to the Board component
interface BoardProps {
  onLogout?: () => void;
}

const LoadingScreen = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#888',
    }}
  >
    Loading board...
  </div>
);

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

  const embeddableCacheRef = useRef<Map<string, React.ReactElement>>(new Map());

  useEffect(() => {
    if (initialState !== null) {
      setIsLoading(false);
    }
  }, [initialState]);

  return (
    <>
      <div
        id="app"
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          position: 'relative',
        }}
      >
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <Excalidraw
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
                theme:
                  initialState?.appState?.theme ||
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
              },
              files: initialState?.files,
            }}
            validateEmbeddable={() => true}
            renderEmbeddable={(element: NonDeleted<ExcalidrawEmbeddableElement>) => {
              if (element.link === null) {
                return null;
              }

              const cached = embeddableCacheRef.current.get(element.id);
              if (cached) {
                return cached;
              }

              let viewer: React.ReactElement;
              if (element.link.startsWith('/md/')) {
                viewer = <EmbeddedMarkdownViewer link={element.link} />;
              } else if (element.link.startsWith('/pdf/')) {
                viewer = <EmbeddedPDFViewer link={element.link} />;
              } else {
                viewer = (
                  <iframe
                    src={element.link}
                    title={element.link}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                );
              }

              embeddableCacheRef.current.set(element.id, viewer);
              return viewer;
            }}
            onChange={(elements, appState) => {
              debouncedUpdateState(elements, appState);
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
              <MainMenu.Separator />
              {onLogout && (
                <MainMenu.Item
                  onSelect={onLogout}
                  icon={<LogOut color="#555" strokeWidth={1.5} style={{ marginLeft: '1px' }} />}
                >
                  Logout
                </MainMenu.Item>
              )}
            </MainMenu>
          </Excalidraw>
        )}
      </div>
    </>
  );
};

export default Board;

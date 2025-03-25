import { useParams } from 'react-router';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useBoardState } from '../hooks/useBoardState';
import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';

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

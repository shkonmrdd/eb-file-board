import { useParams, useNavigate } from 'react-router';
import { Excalidraw, MainMenu, Footer } from '@excalidraw/excalidraw';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useBoardState } from '../hooks/useBoardState';
import { useState, useEffect } from 'react';
import { LogOut, FileText, RefreshCw } from 'lucide-react';
import { ExcalidrawEmbeddableElement, NonDeleted } from '@excalidraw/excalidraw/element/types';
import FileCreationButtons from '../components/FileCreationButtons';
import FileTree from '../components/FileTree';
import { useFileTreeStore } from '../store/fileTreeStore';

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

// Sidebar component
const Sidebar = ({ currentBoard, onLogout }: { currentBoard: string; onLogout?: () => void }) => {
  const { fileTree, isLoadingFileTree, fetchFileTree } = useFileTreeStore();
  const navigate = useNavigate();
  
  // Fetch file tree when component mounts
  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);
  
  const handleBoardSelect = (boardName: string) => {
    if (boardName === 'main') {
      navigate('/');
    } else {
      navigate(`/${boardName}`);
    }
  };

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Files
          </h2>
          <button
            onClick={fetchFileTree}
            disabled={isLoadingFileTree}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Refresh file tree"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingFileTree ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 p-2 min-h-0">
          {isLoadingFileTree ? (
            <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
              Loading file tree...
            </div>
          ) : (
            <FileTree 
              data={fileTree} 
              height="100%" 
              currentBoard={currentBoard}
              onBoardSelect={handleBoardSelect}
            />
          )}
        </div>
      </div>
      
      {/* Sidebar Footer */}
      {onLogout && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

// Top bar component
const TopBar = ({ currentBoard }: { currentBoard: string }) => {
  return (
    <div className="h-8 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center px-4">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {currentBoard}
      </span>
    </div>
  );
};

// Board wrapper component
const BoardWrapper = ({ children, currentBoard, onLogout }: { 
  children: React.ReactNode; 
  currentBoard: string; 
  onLogout?: () => void; 
}) => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar currentBoard={currentBoard} onLogout={onLogout} />
      <div className="flex-1 flex flex-col">
        <TopBar currentBoard={currentBoard} />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

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

              return (
                <iframe
                  src={element.link}
                  title={element.link}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              );
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

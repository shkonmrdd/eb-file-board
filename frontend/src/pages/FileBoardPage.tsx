import { useRef, useState, useEffect, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types/types";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { useExcalidrawElements } from "../hooks/useExcalidrawElements";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { debounce } from "lodash";
import { socket } from "../socket";

// Import new architecture components
import { ExcalidrawAdapter } from '../sync/adapters/excalidraw-adapter';
import { SocketFileSystemAdapter } from '../sync/adapters/socket-filesystem-adapter';
import { SimpleEventBus } from '../sync/eventbus';
import { SimpleStructureManager } from '../sync/structure-manager';

// Create singleton instances (could move to a context provider later)
const excalidrawAdapter = new ExcalidrawAdapter();
const fileSystemAdapter = new SocketFileSystemAdapter();
const eventBus = new SimpleEventBus();
const structureManager = new SimpleStructureManager(
  excalidrawAdapter,
  fileSystemAdapter,
  eventBus
);

function Board() {
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const { addElementToBoard } = useExcalidrawElements();
  const { handleDrop } = useDragAndDrop();
  const [initialState, setInitialState] =
    useState<ExcalidrawInitialDataState | null>(null);
  const [syncInitialized, setSyncInitialized] = useState(false);

  // Set up the Excalidraw API when it becomes available
  useEffect(() => {
    if (excalidrawAPI) {
      excalidrawAdapter.setExcalidrawAPI(excalidrawAPI);
    }
  }, [excalidrawAPI]);

  // Initialize sync system
  useEffect(() => {
    if (excalidrawAPI && !syncInitialized) {
      const initSync = async () => {
        await fileSystemAdapter.initialize();
        await structureManager.initialize({
          bidirectional: true,
          conflictResolution: 'latest-wins',
          autoSync: true,
          syncInterval: 30000 // Sync every 30 seconds
        });
        
        // Start sync
        await structureManager.startSync();
        setSyncInitialized(true);
      };
      
      initSync();
    }
    
    return () => {
      if (syncInitialized) {
        structureManager.stopSync();
      }
    };
  }, [excalidrawAPI, syncInitialized]);

  // Use existing hooks for backward compatibility
  useSubscriptions(excalidrawAPI, cursorPositionRef.current, addElementToBoard);

  // Load initial board state
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const response = await fetch("http://localhost:3001/files/board.json");

        if (!response.ok) {
          setInitialState({});
          return;
        }

        const state = await response.json();
        setInitialState(state);
        console.log("Loaded board state:", state);
      } catch (error) {
        console.error("Failed to load board state:", error);
      }
    };
    loadInitialState();
  }, []);

  // Keep the existing debounced update as a fallback during migration
  const debouncedUpdateState = useCallback(
    debounce((elements, appState) => {
      const elementsNew = elements.filter((element) => element.isDeleted !== true);
      socket.emit("update-state", { elements: elementsNew, appState });
      console.log("Auto-saving board state...");
      
      // Trigger sync with new architecture
      if (syncInitialized) {
        structureManager.forceSync().catch(console.error);
      }
    }, 250),
    [syncInitialized]
  );

  return (
    <>
      <div
        id="app"
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          position: "relative",
        }}
        onDrop={handleDrop}
      >
        {initialState && (
          <Excalidraw
            excalidrawAPI={(api) => {
              setExcalidrawAPI(api);
            }}
            initialData={{
              ...initialState,
              appState: {
                scrollX: initialState.appState?.scrollX,
                scrollY: initialState.appState?.scrollY,
                scrolledOutside: initialState.appState?.scrolledOutside,
                name: initialState.appState?.name,
                zoom: initialState.appState?.zoom,
                viewBackgroundColor: initialState.appState?.viewBackgroundColor,
                currentItemFontFamily: 2,
                currentItemRoughness: 0,
                zenModeEnabled: false,
                theme: initialState.appState?.theme ?? window.matchMedia("(prefers-color-scheme: dark)").matches
                  ? "dark"
                  : "light",
              },
            }}
            validateEmbeddable={() => true}
            onPointerUpdate={(event) => {
              cursorPositionRef.current = event.pointer;
            }}
            onChange={(elements, appState) => {
              debouncedUpdateState(elements, appState);
            }}
          />
        )}
      </div>
    </>
  );
}

export default Board;
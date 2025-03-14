import { useRef, useState, useEffect, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types/types";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { useExcalidrawElements } from "../hooks/useExcalidrawElements";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useSyncContext, SyncProvider } from "../sync/SyncContext";
import { SyncStatusIndicator } from "../components/SyncStatusIndicator";
import { debounce } from "lodash";

// Separate the board component for better organization
const BoardInternal = () => {
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const { addElementToBoard } = useExcalidrawElements();
  const { handleDrop } = useDragAndDrop();
  const [initialState, setInitialState] = useState<ExcalidrawInitialDataState | null>(null);
  const [loading, setLoading] = useState(true);
  const [internalUpdate, setInternalUpdate] = useState(false);
  
  // Use the sync context
  const { setExcalidrawAPI: setSyncExcalidrawAPI, forceSync } = useSyncContext();

  // Create a properly typed callback for checking frame changes
  const checkForFrameChanges = useCallback(
    debounce((elements: any[]) => {
      if (internalUpdate) return; // Skip if this was an internal update
      
      const frameElements = elements.filter(el => 
        !el.isDeleted && el.type === 'frame'
      );
      
      // Detect if any frame has changed
      if (frameElements.length > 0) {
        console.log('Frame elements detected:', frameElements.length);
        
        // Force sync after a short delay
        setTimeout(() => {
          forceSync().catch(console.error);
        }, 300);
      }
    }, 500),
    [internalUpdate, forceSync]
  );

  // Set up board element observer to detect changes to frames
  useEffect(() => {
    if (!excalidrawAPI) return undefined; // Proper return type for cleanup
    
    // Observer for element changes
    const observer = new MutationObserver(() => {
      const elements = excalidrawAPI.getSceneElements();
      checkForFrameChanges(elements);
    });
    
    // Try to find and observe the Excalidraw canvas
    const canvas = document.querySelector('.excalidraw .layer-ui__wrapper');
    if (canvas) {
      observer.observe(canvas, { 
        childList: true,
        subtree: true,
        attributes: true
      });
    }
    
    // Return cleanup function with explicit typing
    return () => {
      observer.disconnect();
    };
  }, [excalidrawAPI, checkForFrameChanges]); // Proper dependencies

  // Handle API initialization and loading state
  const handleExcalidrawAPIInit = (api: ExcalidrawImperativeAPI) => {
    console.log("Excalidraw API initialized");
    setExcalidrawAPI(api);
    setSyncExcalidrawAPI(api);
  };

  // Update ExcalidrawAPI in the sync context when it's available
  useEffect(() => {
    if (excalidrawAPI) {
      setSyncExcalidrawAPI(excalidrawAPI);
    }
  }, [excalidrawAPI, setSyncExcalidrawAPI]);

  // Keep existing hooks for backward compatibility
  useSubscriptions(excalidrawAPI, cursorPositionRef.current, addElementToBoard);

  // Load initial board state
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3001/files/board.json");

        if (!response.ok) {
          console.log("No existing board.json found, creating empty board");
          setInitialState({});
          setLoading(false);
          return;
        }

        const state = await response.json();
        console.log("Loaded board state:", state);
        setInitialState(state);
      } catch (error) {
        console.error("Failed to load board state:", error);
        setInitialState({});
      } finally {
        setLoading(false);
      }
    };
    loadInitialState();
  }, []);

  // Handle Excalidraw changes and sync them
  const handleExcalidrawChange = useCallback(() => {
    if (internalUpdate) return;
    
    try {
      // This will be handled by our sync system now
      // The forceSync will be triggered by the frame change detection above
    } catch (error) {
      console.error("Error handling Excalidraw change:", error);
    }
  }, [internalUpdate]);

  // Don't render anything until we have loaded the initial state
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        width: "100vw",
        height: "100vh",
        background: "#f5f5f5"
      }}>
        <div>Loading board...</div>
      </div>
    );
  }

  // Ensure we have a valid structure for appState and collaborators
  const safeInitialState = {
    ...initialState,
    appState: {
      ...(initialState?.appState || {}),
      collaborators: [], // Ensure collaborators is an empty object, not undefined
      currentItemFontFamily: 2,
      currentItemRoughness: 0,
      zenModeEnabled: false,
      theme: initialState?.appState?.theme ?? 
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    }
  };

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
        <Excalidraw
          excalidrawAPI={handleExcalidrawAPIInit}
          initialData={safeInitialState}
          validateEmbeddable={() => true}
          onPointerUpdate={(event) => {
            cursorPositionRef.current = event.pointer;
          }}
          onChange={handleExcalidrawChange}
        />
      </div>
      <SyncStatusIndicator />
    </>
  );
};

// Wrap the board with our sync provider
function Board() {
  return (
    <SyncProvider>
      <BoardInternal />
    </SyncProvider>
  );
}

export default Board;
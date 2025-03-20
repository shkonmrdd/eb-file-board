import { useState, useEffect, useCallback, useRef } from "react";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  AppState,
} from "@excalidraw/excalidraw/types";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { debounce } from "lodash";
import { socket } from "../socket";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { useParams } from "react-router";
import { BoardUpdatePayload } from "../types";
import { useBoardStore } from "../store/boardStore";

const Board = () => {
  const params = useParams();
  const boardName = params.boardName ?? "main";
  
  // Use the board store
  const { boards, updateBoard, setCurrentBoard } = useBoardStore();
  
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const { handleDrop, cursorPositionRef } = useDragAndDrop({
    excalidrawAPI,
    boardName,
  });
  const [initialState, setInitialState] =
    useState<ExcalidrawInitialDataState | null>(null);
  
  // Keep a reference to the last saved state for comparison
  const lastSavedStateRef = useRef<{
    elements: ExcalidrawElement[];
    appStateJson: string;
  }>({ elements: [], appStateJson: '' });

  useEffect(() => {
    // Set current board in the store
    setCurrentBoard(boardName);
    
    const loadInitialState = async (): Promise<void> => {
      try {
        // Check if we already have the board in our store
        if (boards[boardName]) {
          const elements = boards[boardName].elements;
          const appState = boards[boardName].appState;
          
          setInitialState({
            elements,
            appState
          });
          
          // Initialize the lastSavedStateRef with the loaded state
          lastSavedStateRef.current = {
            elements: [...elements],
            appStateJson: JSON.stringify(appState)
          };
          return;
        }
        
        const boardRelative = `/files/${boardName}/board.json`;
        const boardFull = "http://localhost:3001" + boardRelative;

        const url = import.meta.env.PROD ? boardRelative : boardFull;
        const response = await fetch(url);

        if (!response.ok) {
          setInitialState({});
          return;
        }

        const state = await response.json() as ExcalidrawInitialDataState;
        setInitialState(state);
        
        // Initialize the lastSavedStateRef with the loaded state
        if (state.elements) {
          lastSavedStateRef.current = {
            elements: [...state.elements],
            appStateJson: JSON.stringify(state.appState)
          };
        }
        
        console.log("Loaded board state:", state);
      } catch (error) {
        console.error("Failed to load board state:", error);
        setInitialState({});
      }
    };
    loadInitialState();
  }, [boardName, boards, setCurrentBoard]);

  const debouncedUpdateState = useCallback(
    debounce((elements: readonly ExcalidrawElement[], appState: AppState): void => {
      const elementsNew = elements.filter(
        (element: ExcalidrawElement) => element.isDeleted !== true
      );
      
      // Stringify the appState for comparison
      const appStateJson = JSON.stringify(appState);
      
      // Check if there's an actual change before updating
      const lastSavedElements = lastSavedStateRef.current.elements;
      const lastSavedAppStateJson = lastSavedStateRef.current.appStateJson;
      
      // Simple check for array length and then deep comparison for app state
      const hasElementsChanged = elementsNew.length !== lastSavedElements.length || 
        JSON.stringify(elementsNew) !== JSON.stringify(lastSavedElements);
      
      // Check if app state changed (simple string comparison)
      const hasAppStateChanged = appStateJson !== lastSavedAppStateJson;
      
      // Only update if something changed
      if (hasElementsChanged || hasAppStateChanged) {
        // Update the board in our store
        updateBoard(boardName, [...elementsNew], appState);
        
        // Update the lastSavedStateRef
        lastSavedStateRef.current = {
          elements: [...elementsNew],
          appStateJson
        };
        
        console.log("Auto-saving board state...");
      }
    }, 250),
    [boardName, updateBoard]
  );

  // Listen for board updates from other clients
  useEffect(() => {
    socket.on("board-update", (payload: BoardUpdatePayload) => {
      if (payload.boardName === boardName && excalidrawAPI) {
        excalidrawAPI.updateScene({
          elements: payload.board.elements,
          appState: payload.board.appState
        });
        
        // Update lastSavedStateRef when we receive updates from others
        lastSavedStateRef.current = {
          elements: [...payload.board.elements],
          appStateJson: JSON.stringify(payload.board.appState)
        };
      }
    });
    
    return () => {
      socket.off("board-update");
    };
  }, [boardName, excalidrawAPI]);

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
      >
        {initialState && (
          <Excalidraw
            // @ts-expect-error onDrop is not recognized by Excalidraw
            onDrop={handleDrop}
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            onPointerUpdate={(pointerData) => {
              // Update cursor position with the pointer data
              if (pointerData.pointer) {
                cursorPositionRef.current = pointerData.pointer;
              }
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
                theme:
                  initialState.appState?.theme ??
                  window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light",
              },
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
              <MainMenu.Separator />
              <MainMenu.DefaultItems.ToggleTheme />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
          </Excalidraw>
        )}
      </div>
    </>
  );
};

export default Board;

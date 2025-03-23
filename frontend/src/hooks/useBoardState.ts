import { useState, useEffect, useCallback, useRef } from "react";
import { ExcalidrawImperativeAPI, ExcalidrawInitialDataState, AppState } from "@excalidraw/excalidraw/types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { debounce } from "lodash";
import { socket } from "../socket";
import { BoardUpdatePayload, FileData } from "../types";
import { useBoardStore } from "../store/boardStore";
import { loadBoardState } from "../services/api";
import { DEBOUNCE_DELAY } from "../constants/config";

export const useBoardState = (boardName: string) => {
  const { boards, updateBoard, setCurrentBoard } = useBoardStore();
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [initialState, setInitialState] = useState<ExcalidrawInitialDataState | null>(null);
  
  const lastSavedStateRef = useRef<{
    elements: ExcalidrawElement[];
    appStateJson: string;
    filesJson: string;
  }>({ elements: [], appStateJson: '', filesJson: '{}' });

  useEffect(() => {
    setCurrentBoard(boardName);
    
    const loadInitialState = async (): Promise<void> => {
      try {
        if (boards[boardName]) {
          const elements = boards[boardName].elements;
          const appState = boards[boardName].appState;
          const files = boards[boardName].files || {};
          
          setInitialState({
            elements,
            appState,
            files: files as any
          });
          
          lastSavedStateRef.current = {
            elements: [...elements],
            appStateJson: JSON.stringify(appState),
            filesJson: JSON.stringify(files)
          };
          return;
        }
        
        const state = await loadBoardState(boardName);
        if (state) {
          setInitialState({
            elements: state.elements,
            appState: state.appState,
            files: (state.files || {}) as any
          });
          
          lastSavedStateRef.current = {
            elements: [...state.elements],
            appStateJson: JSON.stringify(state.appState),
            filesJson: JSON.stringify(state.files || {})
          };
        } else {
          // Create an empty state for a new board
          const emptyState = {
            elements: [],
            appState: {} as AppState,
            files: {} as any
          };
          
          setInitialState(emptyState);
          lastSavedStateRef.current = {
            elements: [],
            appStateJson: '{}',
            filesJson: '{}'
          };
          
          // Initialize this board in the store and save to backend
          updateBoard(boardName, [], {} as AppState, {});
        }
      } catch (error) {
        console.error("Failed to load board state:", error);
        
        // Fallback to empty state in case of error
        const emptyState = {
          elements: [],
          appState: {} as AppState,
          files: {} as any
        };
        
        setInitialState(emptyState);
        lastSavedStateRef.current = {
          elements: [],
          appStateJson: '{}',
          filesJson: '{}'
        };
        
        updateBoard(boardName, [], {} as AppState, {});
      }
    };
    loadInitialState();
  }, [boardName, boards, setCurrentBoard, updateBoard]);

  const debouncedUpdateState = useCallback(
    debounce((elements: readonly ExcalidrawElement[], appState: AppState): void => {
      const elementsNew = elements.filter(
        (element: ExcalidrawElement) => element.isDeleted !== true
      );
      
      const appStateJson = JSON.stringify(appState);
      
      // Get the files from the excalidraw instance
      // This is supported by Excalidraw but not in the TypeScript types
      const files = excalidrawAPI ? (excalidrawAPI as any).getFiles?.() || {} : {};
      const filesJson = JSON.stringify(files);
      
      const lastSavedElements = lastSavedStateRef.current.elements;
      const lastSavedAppStateJson = lastSavedStateRef.current.appStateJson;
      const lastSavedFilesJson = lastSavedStateRef.current.filesJson;
      
      const hasElementsChanged = elementsNew.length !== lastSavedElements.length || 
        JSON.stringify(elementsNew) !== JSON.stringify(lastSavedElements);
      
      const hasAppStateChanged = appStateJson !== lastSavedAppStateJson;
      const hasFilesChanged = filesJson !== lastSavedFilesJson;
      
      if (hasElementsChanged || hasAppStateChanged || hasFilesChanged) {
        updateBoard(boardName, [...elementsNew], appState, files);
        
        lastSavedStateRef.current = {
          elements: [...elementsNew],
          appStateJson,
          filesJson
        };
      }
    }, DEBOUNCE_DELAY),
    [boardName, updateBoard, excalidrawAPI]
  );

  useEffect(() => {
    socket.on("board-update", (payload: BoardUpdatePayload) => {
      if (payload.boardName === boardName && excalidrawAPI) {
        // The updateScene method accepts files even though it's not in the type definition
        (excalidrawAPI.updateScene as any)({
          elements: payload.board.elements,
          appState: payload.board.appState,
          files: payload.board.files
        });
        
        lastSavedStateRef.current = {
          elements: [...payload.board.elements],
          appStateJson: JSON.stringify(payload.board.appState),
          filesJson: JSON.stringify(payload.board.files || {})
        };
      }
    });
    
    return () => {
      socket.off("board-update");
    };
  }, [boardName, excalidrawAPI]);

  return {
    excalidrawAPI,
    setExcalidrawAPI,
    initialState,
    debouncedUpdateState
  };
}; 
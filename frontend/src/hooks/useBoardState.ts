import { useState, useEffect, useCallback, useRef } from "react";
import { ExcalidrawImperativeAPI, ExcalidrawInitialDataState, AppState } from "@excalidraw/excalidraw/types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { debounce } from "lodash";
import { socket } from "../socket";
import { BoardUpdatePayload } from "../types";
import { useBoardStore } from "../store/boardStore";

export const useBoardState = (boardName: string) => {
  const { boards, updateBoard, setCurrentBoard } = useBoardStore();
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [initialState, setInitialState] = useState<ExcalidrawInitialDataState | null>(null);
  
  const lastSavedStateRef = useRef<{
    elements: ExcalidrawElement[];
    appStateJson: string;
  }>({ elements: [], appStateJson: '' });

  useEffect(() => {
    setCurrentBoard(boardName);
    
    const loadInitialState = async (): Promise<void> => {
      try {
        if (boards[boardName]) {
          const elements = boards[boardName].elements;
          const appState = boards[boardName].appState;
          
          setInitialState({
            elements,
            appState
          });
          
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
      
      const appStateJson = JSON.stringify(appState);
      
      const lastSavedElements = lastSavedStateRef.current.elements;
      const lastSavedAppStateJson = lastSavedStateRef.current.appStateJson;
      
      const hasElementsChanged = elementsNew.length !== lastSavedElements.length || 
        JSON.stringify(elementsNew) !== JSON.stringify(lastSavedElements);
      
      const hasAppStateChanged = appStateJson !== lastSavedAppStateJson;
      
      if (hasElementsChanged || hasAppStateChanged) {
        updateBoard(boardName, [...elementsNew], appState);
        
        lastSavedStateRef.current = {
          elements: [...elementsNew],
          appStateJson
        };
        
        console.log("Auto-saving board state...");
      }
    }, 250),
    [boardName, updateBoard]
  );

  useEffect(() => {
    socket.on("board-update", (payload: BoardUpdatePayload) => {
      if (payload.boardName === boardName && excalidrawAPI) {
        excalidrawAPI.updateScene({
          elements: payload.board.elements,
          appState: payload.board.appState
        });
        
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

  return {
    excalidrawAPI,
    setExcalidrawAPI,
    initialState,
    debouncedUpdateState
  };
}; 
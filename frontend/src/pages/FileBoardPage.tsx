import { useState, useEffect, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { debounce } from "lodash";
import { socket } from "../socket";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { useParams } from 'react-router';

const Board = () => {
  const { boardName } = useParams();
  console.log(`Board Name: ${boardName}`);

  const [excalidrawAPI, setExcalidrawAPI] = 
    useState<ExcalidrawImperativeAPI | null>(null);
  const { handleDrop, cursorPositionRef } = useDragAndDrop({ excalidrawAPI, boardName: boardName ?? "root" });
  const [initialState, setInitialState] = 
    useState<ExcalidrawInitialDataState | null>(null);

  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const boardUrl = `http://localhost:3001/files/${boardName}/board.json`;
        const response = await fetch(boardUrl);

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

  const debouncedUpdateState = useCallback(
    debounce((elements, appState) => {
      const elementsNew = elements.filter((element: ExcalidrawElement) => element.isDeleted !== true);
      const payload = {
        board: { elements: elementsNew, appState },
        boardName,
      }
      socket.emit("update-state", payload);
      console.log("Auto-saving board state...");
    }, 250),
    []
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
                  theme: initialState.appState?.theme ?? window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light",
                },
              }}
              validateEmbeddable={() => true}
              onChange={(elements, appState) => {
                debouncedUpdateState(elements, appState);
              }}
            />
          )}
      </div>
    </>
  );
};

export default Board;

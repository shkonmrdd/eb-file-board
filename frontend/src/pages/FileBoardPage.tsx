import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import {
  // convertToExcalidrawElements,
  Excalidraw,
} from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
// import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { useExcalidrawElements } from "../hooks/useExcalidrawElements"; // Assuming this is the correct import path
import { useDragAndDrop } from "../hooks/useDragAndDrop";

const socket = io("http://localhost:3001");
socket.on("connect", () => console.log("Connected to server"));

function Board() {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const { addElementToBoard } = useExcalidrawElements();
  const { handleDrop } = useDragAndDrop();

  useEffect(() => {
    if (!excalidrawAPI) return;

    async function handleFileAdded(data: { path: string; type: string }) {
      console.log("handleFileAdded:", data);
      const { path, type } = data;
      if (excalidrawAPI) {
        addElementToBoard(excalidrawAPI, type, path, cursorPositionRef.current);
      }
    }

    socket.on("file-added", handleFileAdded);

    return () => {
      socket.off("file-added", handleFileAdded);
    };
  }, [excalidrawAPI, addElementToBoard]);

  console.log("APP STATE", excalidrawAPI?.getAppState());

  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

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
          excalidrawAPI={setExcalidrawAPI}
          initialData={{
            appState: {
              zenModeEnabled: false,
              theme: isDarkMode ? "dark" : "light",
            },
            scrollToContent: true,
          }}
          validateEmbeddable={() => true}
          onPointerUpdate={(event) => {
            cursorPositionRef.current = event.pointer;
          }}
        />
      </div>
    </>
  );
}

export default Board;

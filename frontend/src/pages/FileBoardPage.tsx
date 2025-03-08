import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import {
  // convertToExcalidrawElements,
  Excalidraw,
} from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
// import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { useExcalidrawElements } from "../hooks/useExcalidrawElements"; // Assuming this is the correct import path
import { useFileUpload } from "../hooks/useFileUpload";

const socket = io("http://localhost:3001");
socket.on("connect", () => console.log("Connected to server"));

function Board() {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const { addElementToBoard } = useExcalidrawElements();
  const { handleDrop } = useFileUpload();

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

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  useEffect(() => {
    // Capture the events at the capture phase, before they reach Excalidraw
    document.addEventListener("dragover", handleDragOver, { capture: true });
    document.addEventListener("drop", handleDrop, { capture: true });

    // Clean up
    return () => {
      document.removeEventListener("dragover", handleDragOver, {
        capture: true,
      });
      document.removeEventListener("drop", handleDrop, { capture: true });
    };
  }, [handleDrop]);

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
          position: "relative", // Add position to help with drag event handling
        }}
        onDrop={handleDrop}
      >
        <Excalidraw
          excalidrawAPI={setExcalidrawAPI}
          initialData={{
            appState: {
              zenModeEnabled: false,
              // gridSize: 16,
              // viewBackgroundColor: "#f0f0f0",
              // Calculate based on the system setting
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

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import {
  // convertToExcalidrawElements,
  Excalidraw,
} from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

const socket = io("http://localhost:3001");
socket.on("connect", () => console.log("Connected to server"));

function Board() {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  const cursorPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }

    console.log("I AM HERE");

    function addElementToBoard(
      type: string,
      link: string,
      pos: { x: number; y: number }
    ) {
      if (!["txt", "md", "pdf"].includes(type)) {
        console.error("Invalid file type");
        return;
      }

      let elements: ExcalidrawElement[] = [];
      const base = {
        id: crypto.randomUUID(),
        x: pos.x,
        y: pos.y,
        width: 1024,
        height: 1450,
      };

      if (["txt"].includes(type)) {
        elements = ([
          {
            ...base,
            type: "embeddable",
            link: "/md/?url=http://localhost:3001" + link + "&preview=edit",
            roundness: {
              type: 0,
              value: 0,
            },
            strokeColor: "black",
            strokeStyle: "solid",
            backgroundColor: "white",
            fillStyle: "solid",
            strokeWidth: 1,
            opacity: 100,
            angle: 0,
            groupIds: [],
          },
        ]);
      }

      if (["md"].includes(type)) {
        elements = ([
          {
            ...base,
            width: 1600,
            type: "embeddable",
            link: "/md/?url=http://localhost:3001" + link + "&preview=live",
            roundness: {
              type: 0,
              value: 0,
            },
            strokeColor: "black",
            strokeStyle: "solid",
            backgroundColor: "white",
            fillStyle: "solid",
            strokeWidth: 1,
            opacity: 100,
            angle: 0,
            groupIds: [],
          },
        ]);
      }

      if (type === "pdf") {
        elements = ([
          {
            ...base,
            type: "embeddable",
            link: "/pdf/?url=http://localhost:3001" + link,
            roundness: {
              type: 0,
              value: 0,
            },
            strokeColor: "black",
            strokeStyle: "solid",
            backgroundColor: "white",
            fillStyle: "solid",
            strokeWidth: 1,
            opacity: 100,
            angle: 0,
            groupIds: [],
          },
        ]);
      }

      if (excalidrawAPI) {
        console.log("API is defined");
      } else {
        console.error("Excalidraw API is not defined");
        return;
      }

      const oldElements = excalidrawAPI?.getSceneElements() ?? [];

      excalidrawAPI?.updateScene({
        elements: [...elements, ...oldElements],
      });
    }

    async function handleFileAdded(data: { path: string; type: string }) {
      console.log("A FILE ADDED");
      const { path, type } = data;
      addElementToBoard(type, path, cursorPositionRef.current);
    }

    socket.on("file-added", handleFileAdded);

    return () => {
      socket.off("file-added", handleFileAdded);
    };
  }, [excalidrawAPI]);

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  const handleDrop = async (
    event: React.DragEvent<HTMLDivElement> | DragEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      console.log(`Dropped ${files.length} file(s):`, Array.from(files));

      // Send the first dropped file to the backend
      const formData = new FormData();
      formData.append("file", files[0]);

      try {
        const response = await fetch("http://localhost:3001/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          console.log(await response.json());
        } else {
          console.error("Failed to upload file");
        }
      } catch (error) {
        console.error(error);
      }
    }

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
  }, []);

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

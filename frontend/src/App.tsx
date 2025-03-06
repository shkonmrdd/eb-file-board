import { useEffect, useRef, useState } from "react";
import { convertToExcalidrawElements, Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import {
  ExcalidrawElement,
  ExcalidrawRectangleElement,
  ExcalidrawTextContainer,
} from "@excalidraw/excalidraw/types/element/types";

import io from "socket.io-client";
const socket = io("http://localhost:3001");
socket.on("connect", () => console.log("Connected to server"));


function App() {
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
      data: any,
      pos: { x: number; y: number }
    ) {
    
      const elements = convertToExcalidrawElements([
        // {
        //   type: "rectangle",
        //   x: 300,
        //   y: 290,
        //   label: {
        //     text: data,
        //   },
        // },

        {
          type: "rectangle",
          x: pos.x,
          y: pos.y,
          // text: data,
          label: {
            text: data,
            // @ts-expect-error This is correct font
            fontFamily: "Nunito",
            fontSize: 20,
            textAlign: "left",
          },
          // fontFamily: "Nunito",
          // fontSize: 18,
          width: 1280,
          height: 800,
        },
      ]);

      if (excalidrawAPI) {
        console.log("API is defined");
      } else {
        console.error("Excalidraw API is not defined");
        return;
      }

      // excalidrawAPI?.addElements([element]);
      const oldElements = excalidrawAPI?.getSceneElements() ?? [];
      
      excalidrawAPI?.updateScene({
        elements: [...elements, ...oldElements],
      });
    }

    async function handleFileAdded(data: { path: string; type: string }) {
      console.log("A FILE ADDED");
      const { path, type } = data;
      let content;

      // Determine element type and content
      if (["md", "txt"].includes(type)) {
        content = await fetch(`http://localhost:3001${path}`).then((res) =>
          res.text()
        );
        console.log(content);
        // addElementToBoard(type, content, {x: 300, y: 300});
      } else {
        content = path; // For images/PDFs, use URL directly
      }

      if (!excalidrawAPI) return;

      const appState = excalidrawAPI.getAppState();

      const position = {
        x: cursorPositionRef.current.x,
        y: cursorPositionRef.current.y,
      }

      console.log("zoom", appState.zoom.value)

      addElementToBoard(type, content, position);
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

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // If you still want to handle files yourself
    const files = event.dataTransfer.files;
    if (files.length > 0) {
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

  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

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

export default App;

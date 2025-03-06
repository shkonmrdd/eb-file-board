import { useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import {
  ExcalidrawElement,
  ExcalidrawRectangleElement,
  ExcalidrawTextContainer,
} from "@excalidraw/excalidraw/types/element/types";

import io from "socket.io-client";
const socket = io("http://localhost:3001");
socket.on("connect", () => console.log("Connected to server"));

function getCursorPosition(event) {
  // Get the scroll position of the window
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  
  // Get cursor position relative to the viewport
  const clientX = event.clientX;
  const clientY = event.clientY;
  
  // Calculate the absolute position in the document by adding scroll offset
  return {
    x: clientX + scrollX,
    y: clientY + scrollY
  };
}


function App() {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  
  const cursorPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    document.addEventListener('mousemove', (event) => {
      const position = getCursorPosition(event);
      console.log(`Cursor position: x=${position.x}, y=${position.y}`);
      cursorPositionRef.current = position;
    });
  }, []);

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
      // Create element based on type
      // const element = {
      //   id: crypto.randomUUID(),
      //   type: "custom", // Use Excalidraw's custom element feature
      //   x: pos.x,
      //   y: pos.y,
      //   width: 200,
      //   height: 300,
      //   version: 1,
      //   data: { content: data },
      // };
      const rectangle: ExcalidrawTextContainer = {
        id: "rectangle-2",
        type: "rectangle",
        x: pos.x,
        y: pos.y,
        width: 100,
        height: 50,
        strokeColor: "#000000",
        backgroundColor: "#cccccc",
        strokeWidth: 2,
        roughness: 1,
        fillStyle: "solid", // Add this property
        strokeStyle: "solid", // Add this property
        roundness: null, // or provide a value like { type: RoundnessType; value?: number; }
        opacity: 100, // 100%
        seed: Math.floor(Math.random() * 1000),
        version: 0,
        versionNonce: Date.now(),
        isDeleted: false,
        groupIds: [],
        frameId: null,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        angle: 0,
        // text: data,
      };

      if (excalidrawAPI) {
        console.log("API is defined");
      } else {
        console.error("Excalidraw API is not defined");
        return;
        x;
      }

      // excalidrawAPI?.addElements([element]);
      excalidrawAPI?.updateScene({
        elements: [rectangle],
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

      addElementToBoard(type, content, cursorPositionRef.current);
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

  useEffect(() => {
    if (!excalidrawAPI) {
      console.log("no api");
      return;
    }

    const timer = setTimeout(() => {
      console.log("trying to add elements");

      // Create elements with dynamic IDs and references
      const rectangle: ExcalidrawRectangleElement = {
        id: "rectangle-1",
        type: "rectangle",
        x: 300,
        y: 300,
        width: 100,
        height: 50,
        strokeColor: "#000000",
        backgroundColor: "#cccccc",
        strokeWidth: 2,
        roughness: 1,
        fillStyle: "solid", // Add this property
        strokeStyle: "solid", // Add this property
        roundness: null, // or provide a value like { type: RoundnessType; value?: number; }
        opacity: 100, // 100%
        seed: Math.floor(Math.random() * 1000),
        version: 0,
        versionNonce: Date.now(),
        isDeleted: false,
        groupIds: [],
        frameId: null,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        angle: 0,
      };

      // const textElement: ExcalidrawTextElement = {
      //   id: textId,
      //   type: "text",
      //   x: rectangle.x + (rectangle.width / 2), // Centered horizontally
      //   y: rectangle.y + 30, // Offset from top of rectangle
      //   text: "Dynamic Text Here!",
      //   containerId: rectId, // Links to the rectangle's ID
      //   textAlign: "center",
      // };

      // Update scene with both elements
      excalidrawAPI.updateScene({
        elements: [rectangle],
      });
    }, 3000);

    return () => clearTimeout(timer); // Cleanup on unmount
  }, [excalidrawAPI]); // Dependency triggers effect when API is ready

  console.log("APP STATE", excalidrawAPI?.getAppState());

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
              zenModeEnabled: true,
              gridSize: 16,
              // viewBackgroundColor: "#f0f0f0",
              theme: "dark",
            },
            scrollToContent: true,
          }}
        />
      </div>
    </>
  );
}

export default App;

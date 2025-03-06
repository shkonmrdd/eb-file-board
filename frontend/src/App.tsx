import { useEffect, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { ExcalidrawRectangleElement, ExcalidrawTextElement } from "@excalidraw/excalidraw/types/element/types";

function App() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

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
      console.log("no api")
      return;
    }

    
    const timer = setTimeout(() => {
      console.log('trying to add elements')

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
        elements: [rectangle,]
      });
    }, 3000);

    return () => clearTimeout(timer); // Cleanup on unmount
  }, [excalidrawAPI]); // Dependency triggers effect when API is ready


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
            viewBackgroundColor: "#f0f0f0",
          },
          scrollToContent: true,
        }}
      />
      </div>
    </>
  );
}

export default App;

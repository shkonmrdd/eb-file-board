import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { useEffect } from "react";

function App() {
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

  const rectangle: ExcalidrawElement = {
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
    seed: Math.floor(Math.random() * 1000),
  };

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
          initialData={{
            elements: [rectangle],
            appState: { zenModeEnabled: true, viewBackgroundColor: "#ccc" },
            scrollToContent: true,
          }}
        />
      </div>
    </>
  );
}

export default App;

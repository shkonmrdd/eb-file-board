import { Excalidraw } from "@excalidraw/excalidraw";
import { useEffect } from "react";

function App() {
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // If you still want to handle files yourself
    // @ts-expect-error The event.dataTransfer.files property is actually there, but TypeScript doesn't know it.
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      console.log(`Dropped ${files.length} file(s):`, Array.from(files));
    }
    
    return false;
  };

  useEffect(() => {
    // Capture the events at the capture phase, before they reach Excalidraw
    document.addEventListener("dragover", handleDragOver, { capture: true });
    document.addEventListener("drop", handleDrop, { capture: true });
    
    // Clean up
    return () => {
      document.removeEventListener("dragover", handleDragOver, { capture: true });
      document.removeEventListener("drop", handleDrop, { capture: true });
    };
  }, []);

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
          // Use Excalidraw's prop to disable image dropping if available
          // onPaste={(data) => {
          //   // Prevent default paste behavior if needed
          //   return false;
          // }}
          // If Excalidraw exposes props to disable file handling, use them here
        />
      </div>
    </>
  );
}

export default App;
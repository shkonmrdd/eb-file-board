import { Excalidraw } from "@excalidraw/excalidraw";

function App() {
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    // @ts-expect-error The event.dataTransfer.files property is actually there, but TypeScript doesn't know it.
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      console.log(`Dropped ${files.length} file(s):`, Array.from(files));
    }
  };

  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Excalidraw />
      </div>
    </>
  );
}

export default App;
import { useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { useExcalidrawElements } from "../hooks/useExcalidrawElements";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { useSubscriptions } from "../hooks/useSubscriptions";

function Board() {
  const cursorPositionRef = useRef({ x: 0, y: 0 });
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const { addElementToBoard } = useExcalidrawElements();
  const { handleDrop } = useDragAndDrop();

  useSubscriptions(excalidrawAPI, cursorPositionRef.current, addElementToBoard);

  console.log("APP STATE", excalidrawAPI?.getAppState());

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
              currentItemFontFamily: 2,
              currentItemRoughness: 0,
              zenModeEnabled: false,
              theme: window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light",
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

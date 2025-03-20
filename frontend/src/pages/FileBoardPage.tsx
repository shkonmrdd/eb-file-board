import { useParams } from "react-router";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { useBoardState } from "../hooks/useBoardState";

const Board = () => {
  const params = useParams();
  const boardName = params.boardName ?? "main";
  
  const { excalidrawAPI, setExcalidrawAPI, initialState, debouncedUpdateState } = useBoardState(boardName);
  const { handleDrop, cursorPositionRef } = useDragAndDrop({
    excalidrawAPI,
    boardName,
  });

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
      >
        {initialState && (
          <Excalidraw
            // @ts-expect-error onDrop is not recognized by Excalidraw
            onDrop={handleDrop}
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            onPointerUpdate={(pointerData) => {
              if (pointerData.pointer) {
                cursorPositionRef.current = pointerData.pointer;
              }
            }}
            initialData={{
              ...initialState,
              appState: {
                scrollX: initialState.appState?.scrollX,
                scrollY: initialState.appState?.scrollY,
                scrolledOutside: initialState.appState?.scrolledOutside,
                name: initialState.appState?.name,
                zoom: initialState.appState?.zoom,
                viewBackgroundColor: initialState.appState?.viewBackgroundColor,
                currentItemFontFamily: 2,
                currentItemRoughness: 0,
                zenModeEnabled: false,
                theme:
                  initialState.appState?.theme ??
                  window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light",
              },
            }}
            validateEmbeddable={() => true}
            onChange={(elements, appState) => {
              debouncedUpdateState(elements, appState);
            }}
          >
            <MainMenu>
              <MainMenu.DefaultItems.LoadScene />
              <MainMenu.DefaultItems.Export />
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.SearchMenu />
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.Separator />
              <MainMenu.DefaultItems.ToggleTheme />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
          </Excalidraw>
        )}
      </div>
    </>
  );
};

export default Board;

import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { useCallback, useEffect } from 'react';
import type { DragEvent as ReactDragEvent } from 'react';
import { useExcalidrawElements } from './useExcalidrawElements';

export const useDragAndDrop = (excalidrawAPI: ExcalidrawImperativeAPI) => {
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }, []);

  const { addElementToBoard } = useExcalidrawElements();

  const handleDrop = useCallback(
    async (event: ReactDragEvent<HTMLDivElement> | DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        console.log(`Dropped ${files.length} file(s):`, Array.from(files));

        const formData = new FormData();
        formData.append("file", files[0]);

        try {
          const response = await fetch("http://localhost:3001/upload", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            
            const result = await response.json();
            console.log("File uploaded successfully:", result);
            console.log("excalidrawAPI", excalidrawAPI);

            addElementToBoard(excalidrawAPI, "txt", result.path, { x: 0, y: 0 });


          } else {
            console.error("Failed to upload file");
          }
        } catch (error) {
          console.error(error);
        }
      }

      return false;
    },
    []
  );

  useEffect(() => {
    document.addEventListener("dragover", handleDragOver, { capture: true });
    document.addEventListener("drop", handleDrop, { capture: true });

    return () => {
      document.removeEventListener("dragover", handleDragOver, {
        capture: true,
      });
      document.removeEventListener("drop", handleDrop, { capture: true });
    };
  }, [handleDragOver, handleDrop]); // Now properly depending on the callbacks

  return { handleDrop };
};
import { useCallback, useEffect } from 'react';
import type { DragEvent as ReactDragEvent } from 'react';

export const useFileUpload = () => {
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }, []);

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
            console.log(await response.json());
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
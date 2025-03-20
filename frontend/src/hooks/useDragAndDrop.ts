import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useCallback, useEffect, useRef } from 'react';
import type { DragEvent as ReactDragEvent } from 'react';
import { useExcalidrawElements } from './useExcalidrawElements';
import { FileType, Position, FileUploadResponse } from '../types';

interface UseDragAndDropProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  boardName: string;
}

interface UseDragAndDropResult {
  handleDrop: (event: ReactDragEvent<HTMLDivElement> | DragEvent) => Promise<boolean>;
  cursorPositionRef: React.MutableRefObject<Position>;
}

export const useDragAndDrop = ({ excalidrawAPI, boardName }: UseDragAndDropProps): UseDragAndDropResult => {
  const cursorPositionRef = useRef<Position>({ x: 100, y: 100 });
  const { addElementToBoard } = useExcalidrawElements();

  // Remove the handleMouseMove function as we'll use onPointerUpdate instead

  const handleDragOver = useCallback((event: DragEvent): boolean => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }, []);

  const getFileTypeFromName = (fileName: string): FileType => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Map extensions to supported types
    if (['md', 'markdown'].includes(extension)) return 'md';
    if (['pdf'].includes(extension)) return 'pdf';
    return 'txt'; // Default to text for all other types
  };

  const handleDrop = useCallback(
    async (event: ReactDragEvent<HTMLDivElement> | DragEvent): Promise<boolean> => {
      event.preventDefault();
      event.stopPropagation();

      if (!excalidrawAPI) {
        console.error("Excalidraw API not available");
        return false;
      }

      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        console.log(`Dropped ${files.length} file(s):`, Array.from(files));

        const formData = new FormData();
        formData.append("file", files[0]);
        formData.append("boardName", boardName);

        try {
          const url = import.meta.env.PROD ? "/upload" : "http://localhost:3001/upload";
          const response = await fetch(url, {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const result = await response.json() as FileUploadResponse;
            console.log("File uploaded successfully:", result);
            
            // Determine file type from the name
            const fileType = getFileTypeFromName(files[0].name);
            
            // Use cursor position for placement
            const position = { ...cursorPositionRef.current };
            
            // Add element to the board with appropriate type
            addElementToBoard(excalidrawAPI, fileType, result.fileUrl, position);
          } else {
            console.error("Failed to upload file");
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      }

      return false;
    },
    [excalidrawAPI, addElementToBoard, boardName]
  );

  useEffect(() => {
    document.addEventListener("dragover", handleDragOver, { capture: true });
    document.addEventListener("drop", handleDrop, { capture: true });
    // Remove mousemove listener since we'll use onPointerUpdate

    return () => {
      document.removeEventListener("dragover", handleDragOver, { capture: true });
      document.removeEventListener("drop", handleDrop, { capture: true });
      // Remove mousemove cleanup
    };
  }, [handleDragOver, handleDrop]);

  // Export the ref so we can update it from outside
  return { 
    handleDrop,
    cursorPositionRef 
  };
};
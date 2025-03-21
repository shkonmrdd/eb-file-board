import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useCallback, useEffect, useRef } from 'react';
import type { DragEvent as ReactDragEvent } from 'react';
import { useExcalidrawElements } from './useExcalidrawElements';
import { FileType, Position, FileUploadResponse, UseDragAndDropProps, UseDragAndDropResult } from '../types';
import { useFileStore } from '../store/fileStore';
import { uploadFile } from '../services/api';
import { FILE_TYPES, DEFAULT_POSITION } from '../constants/config';

export const useDragAndDrop = ({ excalidrawAPI, boardName }: UseDragAndDropProps): UseDragAndDropResult => {
  const cursorPositionRef = useRef<Position>(DEFAULT_POSITION);
  const { addElementToBoard } = useExcalidrawElements();
  const { addFile } = useFileStore();

  const handleDragOver = useCallback((event: DragEvent): boolean => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }, []);

  const getFileTypeFromName = (fileName: string): FileType => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (FILE_TYPES.MARKDOWN.includes(extension as 'md' | 'markdown')) return 'md';
    if (FILE_TYPES.PDF.includes(extension as 'pdf')) return 'pdf';
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
        try {
          const result = await uploadFile(files[0], boardName);
          
          // Determine file type from the name
          const fileType = getFileTypeFromName(files[0].name);
          
          // Add to file store (read file content if needed)
          if (fileType === 'md' || fileType === 'txt') {
            // For text files, we can read and store the content
            const fileContent = await files[0].text();
            addFile(result.fileUrl, fileContent, fileType);
          }
          
          // Use cursor position for placement
          const position = { ...cursorPositionRef.current };
          
          // Add element to the board with appropriate type
          addElementToBoard(excalidrawAPI, fileType, result.fileUrl, position);
        } catch (error) {
          console.error("Error handling file drop:", error);
        }
      }

      return false;
    },
    [excalidrawAPI, addElementToBoard, boardName, addFile]
  );

  useEffect(() => {
    document.addEventListener("dragover", handleDragOver, { capture: true });
    document.addEventListener("drop", handleDrop, { capture: true });

    return () => {
      document.removeEventListener("dragover", handleDragOver, { capture: true });
      document.removeEventListener("drop", handleDrop, { capture: true });
    };
  }, [handleDragOver, handleDrop]);

  return { 
    handleDrop,
    cursorPositionRef 
  };
};
import { useEffect } from 'react';
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { Point } from '@excalidraw/excalidraw/types/types';

import { socket } from '../socket';

interface FileAddedData {
  path: string;
  type: string;
}

export const useSubscriptions = (
  excalidrawAPI: ExcalidrawImperativeAPI | null,
  cursorPosition: Point,
  addElementToBoard: (
    api: ExcalidrawImperativeAPI,
    type: string,
    path: string,
    position: Point
  ) => void
) => {
  useEffect(() => {
    if (!excalidrawAPI) return;

    const handleFileAdded = async (data: FileAddedData) => {
      console.log("handleFileAdded:", data);
      const { path, type } = data;
      if (excalidrawAPI) {
        addElementToBoard(excalidrawAPI, type, path, cursorPosition);
      }
    };

    socket.on("file-added", handleFileAdded);

    return () => {
      socket.off("file-added", handleFileAdded);
    };
  }, [excalidrawAPI, addElementToBoard, cursorPosition]);
};
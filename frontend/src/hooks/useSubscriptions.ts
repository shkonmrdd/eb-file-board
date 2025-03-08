import { useEffect } from 'react';
import io from 'socket.io-client';
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { Point } from '@excalidraw/excalidraw/types/types';

const socket = io("http://localhost:3001");
socket.on("connect", () => console.log("Connected to server"));

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
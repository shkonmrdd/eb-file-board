import { useEffect, useCallback } from 'react';
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { socket, FolderRenamedEvent, FolderCreatedEvent } from '../socket';
import { v4 as uuidv4 } from 'uuid';

export const useFrameSync = (
  excalidrawAPI: ExcalidrawImperativeAPI | null
) => {
  const handleFolderRenamed = useCallback((data: FolderRenamedEvent) => {
    if (!excalidrawAPI) return;
    
    const { oldName, newName } = data;
    console.log(`Folder renamed: ${oldName} -> ${newName}`);
    
    const elements = excalidrawAPI.getSceneElements();
    let updated = false;
    
    const updatedElements = elements.map(element => {
      if (element.type === 'frame' && element.name === oldName) {
        updated = true;
        return {
          ...element,
          name: newName
        };
      }
      return element;
    });
    
    if (updated) {
      excalidrawAPI.updateScene({
        elements: updatedElements
      });
      console.log(`Updated frame name from ${oldName} to ${newName}`);
    }
  }, [excalidrawAPI]);
  
  const handleFolderCreated = useCallback((data: FolderCreatedEvent) => {
    if (!excalidrawAPI) return;
    
    const { name } = data;
    console.log(`Folder created: ${name}`);
    
    // Check if frame already exists with this name
    const elements = excalidrawAPI.getSceneElements();
    const frameExists = elements.some(
      element => element.type === 'frame' && element.name === name
    );
    
    if (!frameExists) {
    const appState = excalidrawAPI.getAppState();
      const newFrame = {
        id: uuidv4(),
        type: 'frame',
        name,
        x: appState.scrollX + 100,
        y: appState.scrollY + 100,
        width: 800,
        height: 600,
        angle: 0,
        strokeColor: "#bbb",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: Math.round(Math.random() * 2000),
        version: 1,
        versionNonce: Math.round(Math.random() * 2000),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false
      };
      
      excalidrawAPI.updateScene({
        elements: [...elements, newFrame]
      });
      console.log(`Created new frame for folder: ${name}`);
    }
  }, [excalidrawAPI]);
  
  useEffect(() => {
    socket.on("folder-renamed", handleFolderRenamed);
    socket.on("folder-created", handleFolderCreated);
    
    return () => {
      socket.off("folder-renamed", handleFolderRenamed);
      socket.off("folder-created", handleFolderCreated);
    };
  }, [handleFolderRenamed, handleFolderCreated]);
};

import { Socket } from "socket.io";
import * as fs from "fs/promises";
import path from "path";
import { log } from "../utils";
import { uploadsPath } from "../app";
import { frameManager } from "../sync/FrameManager";

interface CreateDirectoryPayload {
  elementId: string;
  name: string;
}

interface RenameDirectoryPayload {
  elementId: string;
  oldName: string;
  newName: string;
}

export const handleCreateDirectory = async (
  socket: Socket,
  { elementId, name }: CreateDirectoryPayload
): Promise<void> => {
  try {
    const dirPath = path.join(uploadsPath, name);
    
    // Create the directory
    await fs.mkdir(dirPath, { recursive: true });
    
    // Register with frame manager
    frameManager.registerFrame(elementId, name);
    
    log(`Created directory for frame: ${name}`);
    
    socket.emit("directory-created", {
      success: true,
      elementId,
      path: `/files/${name}`
    });
    
    // Notify other clients
    socket.broadcast.emit("folder-created", {
      name,
      path: `/files/${name}`,
      elementId
    });
  } catch (error) {
    log(`Error creating directory: ${error}`);
    socket.emit("directory-created", {
      success: false,
      error: `Failed to create directory: ${error}`
    });
  }
};

export const handleRenameDirectory = async (
  socket: Socket,
  { elementId, oldName, newName }: RenameDirectoryPayload
): Promise<void> => {
  try {
    const oldPath = path.join(uploadsPath, oldName);
    const newPath = path.join(uploadsPath, newName);
    
    // Check if old directory exists
    try {
      await fs.access(oldPath);
    } catch {
      // Create the new directory if the old one doesn't exist
      await fs.mkdir(newPath, { recursive: true });
      log(`Created directory for renamed frame: ${newName}`);
      
      frameManager.registerFrame(elementId, newName);
      
      socket.emit("directory-renamed", {
        success: true,
        oldName,
        newName
      });
      
      socket.broadcast.emit("folder-renamed", {
        oldName,
        newName,
        elementId
      });
      
      return;
    }
    
    // Rename the directory
    await fs.rename(oldPath, newPath);
    
    // Update in frame manager
    frameManager.updateFrameName(elementId, newName);
    
    log(`Renamed directory from ${oldName} to ${newName}`);
    
    socket.emit("directory-renamed", {
      success: true,
      oldName,
      newName
    });
    
    // Notify other clients
    socket.broadcast.emit("folder-renamed", {
      oldName,
      newName,
      elementId
    });
  } catch (error) {
    log(`Error renaming directory: ${error}`);
    socket.emit("directory-renamed", {
      success: false,
      error: `Failed to rename directory: ${error}`
    });
  }
};
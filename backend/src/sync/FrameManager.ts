import * as fs from 'fs/promises';
import path from 'path';
import { uploadsPath } from '../app';
import { log } from '../utils';

interface Frame {
  id: string;
  name: string | null;
  type: string;
}

class FrameManager {
  private frames: Map<string, Frame> = new Map();

  async handleFrameUpdate(element: any) {
    if (element.type !== 'frame') return;

    const frameId = element.id;
    const newName = element.name || element.id;
    const oldFrame = this.frames.get(frameId);

    if (!oldFrame) {
      // New frame
      await this.createFrameFolder(frameId, newName);
      this.frames.set(frameId, { id: frameId, name: newName, type: 'frame' });
    } else if (oldFrame.name !== newName) {
      // Renamed frame
      await this.renameFrameFolder(frameId, oldFrame.name || frameId, newName);
      this.frames.set(frameId, { ...oldFrame, name: newName });
    }
  }

  private async createFrameFolder(frameId: string, name: string) {
    const folderPath = path.join(uploadsPath, name);
    try {
      await fs.mkdir(folderPath, { recursive: true });
      log(`Created folder for frame: ${name}`);
    } catch (error) {
      console.error(`Error creating frame folder: ${error}`);
    }
  }

  private async renameFrameFolder(frameId: string, oldName: string, newName: string) {
    const oldPath = path.join(uploadsPath, oldName);
    const newPath = path.join(uploadsPath, newName);
    try {
      // Check if source folder exists
      try {
        await fs.access(oldPath);
      } catch (error) {
        // Source folder doesn't exist, create destination folder instead
        await fs.mkdir(newPath, { recursive: true });
        log(`Created folder for renamed frame: ${newName}`);
        return;
      }

      // Rename folder
      await fs.rename(oldPath, newPath);
      log(`Renamed folder from ${oldName} to ${newName}`);
    } catch (error) {
      console.error(`Error renaming frame folder: ${error}`);
    }
  }

  // New method to get a frame ID by name
  async getFrameIdByName(name: string): Promise<string | undefined> {
    for (const [id, frame] of this.frames.entries()) {
      if (frame.name === name) {
        return id;
      }
    }
    return undefined;
  }

  clear() {
    this.frames.clear();
  }

  // Initialize existing folders as frames
  async initializeFromFolders() {
    try {
      const entries = await fs.readdir(uploadsPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          // Generate a new ID for the folder-based frame if it doesn't exist
          const existingId = await this.getFrameIdByName(entry.name);
          const frameId = existingId || crypto.randomUUID();
          this.frames.set(frameId, { 
            id: frameId, 
            name: entry.name, 
            type: 'frame' 
          });
          log(`Initialized frame from folder: ${entry.name}`);
        }
      }
    } catch (error) {
      console.error(`Error initializing frames from folders: ${error}`);
    }
  }

  registerFrame(frameId: string, name: string) {
    this.frames.set(frameId, { id: frameId, name, type: 'frame' });
    log(`Registered frame: ${frameId} as ${name}`);
  }
  
  updateFrameName(frameId: string, newName: string) {
    const frame = this.frames.get(frameId);
    if (frame) {
      frame.name = newName;
      this.frames.set(frameId, frame);
      log(`Updated frame name: ${frameId} to ${newName}`);
    } else {
      log(`Frame not found: ${frameId}`);
      this.registerFrame(frameId, newName);
    }
  }
}

export const frameManager = new FrameManager();

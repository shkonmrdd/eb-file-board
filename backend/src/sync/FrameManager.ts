import * as fs from 'fs/promises';
import path from 'path';
import { uploadsPath } from '../app';

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
    } catch (error) {
      console.error(`Error creating frame folder: ${error}`);
    }
  }

  private async renameFrameFolder(frameId: string, oldName: string, newName: string) {
    const oldPath = path.join(uploadsPath, oldName);
    const newPath = path.join(uploadsPath, newName);
    try {
      await fs.rename(oldPath, newPath);
    } catch (error) {
      console.error(`Error renaming frame folder: ${error}`);
    }
  }

  clear() {
    this.frames.clear();
  }
}

export const frameManager = new FrameManager();

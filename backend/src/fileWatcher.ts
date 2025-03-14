import * as fs from "fs/promises";
import path from "path";
import nsfw from "nsfw";
import { Server } from "socket.io";
import { log } from "./utils";
import { uploadsPath } from "./app";
import { calculateHash, getFileHash, setFileHash } from "./sync/FileSync";
import { frameManager } from "./sync/FrameManager";

async function handleBoardChange(content: string): Promise<void> {
  const boardData = JSON.parse(content);
  for (const element of boardData.elements) {
    await frameManager.handleFrameUpdate(element);
  }
}

/**
 * Converts a file system path to a public web path
 */
function toPublicPath(filePath: string): string {
  const relativePath = path.relative(uploadsPath, filePath);
  return `/files/${relativePath.split(path.sep).join("/")}`;
}

/**
 * Handles file modification events
 */
async function handleModifiedEvent(event: any, io: Server): Promise<void> {
  const filePath = path.join(event.directory, event.file);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    
    if (event.file === "board.json") {
      await handleBoardChange(content);
    }

    const newHash = calculateHash(content);
    const publicPath = toPublicPath(filePath);

    if (getFileHash(publicPath) !== newHash) {
      setFileHash(publicPath, newHash);
      io.emit("file-changed", {
        path: publicPath,
        content,
      });
    }
  } catch (error) {
    log(`Error reading modified file: ${error}`);
  }
}

/**
 * Checks if a file path is a directory
 */
async function isDirectory(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Handles file creation events
 */
async function handleCreatedEvent(event: any, io: Server): Promise<void> {
  log(`File created: ${event.directory}/${event.file}`);
  const filePath = path.join(event.directory, event.file);
  const publicPath = toPublicPath(filePath);
  
  if (await isDirectory(filePath)) {
    io.emit("folder-created", {
      name: event.file,
      path: publicPath,
    });
    log(`Folder created: ${event.file}`);
  } else {
    io.emit("file-added", {
      path: publicPath,
      type: path.extname(filePath).slice(1),
    });
  }
}

/**
 * Handles file deletion events
 */
function handleDeletedEvent(event: any, io: Server): void {
  log(`File deleted: ${event.directory}/${event.file}`);
  const filePath = path.join(event.directory, event.file);
  const publicPath = toPublicPath(filePath);
  io.emit("file-deleted", {
    path: publicPath,
  });
}

/**
 * Handles file rename events
 */
async function handleRenamedEvent(event: any, io: Server): Promise<void> {
  const oldPath = path.join(event.directory, event.oldFile);
  const newPath = path.join(event.directory, event.newFile);
  log(`File renamed: ${oldPath} -> ${newPath}`);

  if (await isDirectory(newPath)) {
    io.emit("folder-renamed", {
      oldName: event.oldFile,
      newName: event.newFile,
    });
    log(`Folder renamed: ${event.oldFile} -> ${event.newFile}`);
  } else {
    io.emit("file-renamed", {
      oldPath: toPublicPath(oldPath),
      newPath: toPublicPath(newPath),
    });
  }
}

export function initFileWatcher(io: Server): void {
  const watcher = nsfw(uploadsPath, async (events) => {
    for (const event of events) {
      try {
        switch (event.action) {
          case nsfw.actions.MODIFIED:
            await handleModifiedEvent(event, io);
            break;
          case nsfw.actions.CREATED:
            await handleCreatedEvent(event, io);
            break;
          case nsfw.actions.DELETED:
            handleDeletedEvent(event, io);
            break;
          case nsfw.actions.RENAMED:
            await handleRenamedEvent(event, io);
            break;
        }
      } catch (error) {
        log(`Error processing file event: ${error}`);
      }
    }
  });
  
  watcher.then((w) => {
    w.start();
  });
}

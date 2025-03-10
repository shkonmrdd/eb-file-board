import * as fs from "fs/promises";
import path from "path";
import nsfw from "nsfw";
import { Server } from "socket.io";
import { log } from "./utils";
import { uploadsPath } from "./app";
import { calculateHash, getFileHash, setFileHash } from './sync/FileSync';
import { frameManager } from './sync/FrameManager';

export function initFileWatcher(io: Server): void {
  const watcher = nsfw(uploadsPath, async (events) => {
    for (const event of events) {
      if (event.action === nsfw.actions.MODIFIED) {
        const filePath = path.join(event.directory, event.file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const newHash = calculateHash(content);
          const relativePath = path.relative(uploadsPath, filePath);
          const publicPath = `/files/${relativePath.split(path.sep).join("/")}`;
          
          // Handle board.json changes
          if (event.file === 'board.json') {
            const boardData = JSON.parse(content);
            for (const element of boardData.elements) {
              await frameManager.handleFrameUpdate(element);
            }
          }

          if (getFileHash(publicPath) !== newHash) {
            setFileHash(publicPath, newHash);
            io.emit("file-changed", {
              path: publicPath,
              content
            });
          }
        } catch (error) {
          log(`Error reading modified file: ${error}`);
        }
      } else {
        switch (event.action) {
          case nsfw.actions.CREATED: {
            log(`File created: ${event.directory}/${event.file}`);

            const filePath = path.join(event.directory, event.file);
            const relativePath = path.relative(uploadsPath, filePath);

            const publicPath = `/files/${relativePath.split(path.sep).join("/")}`;
            io.emit("file-added", {
              path: publicPath,
              type: path.extname(filePath).slice(1),
            });

            log(
              "EMITTING A WEB SOCKET EVENT TO CLIENTS, public path: " + publicPath
            );
            break;
          }
          case nsfw.actions.DELETED:
            console.log(`File deleted: ${event.directory}/${event.file}`);
            break;
          case nsfw.actions.RENAMED:
            console.log(
              `File moved: ${event.directory}/${event.oldFile} -> ${event.directory}/${event.newFile}`
            );
            break;
        }
      }
    }
  });
  watcher.then((w) => {
    w.start();
  });
}

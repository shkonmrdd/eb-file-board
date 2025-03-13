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

export function initFileWatcher(io: Server): void {
  const watcher = nsfw(uploadsPath, async (events) => {
    for (const event of events) {
      if (event.action === nsfw.actions.MODIFIED) {
        const filePath = path.join(event.directory, event.file);
        try {
          const content = await fs.readFile(filePath, "utf-8");
          
          if (event.file === "board.json") {
            await handleBoardChange(content);
          }

          const newHash = calculateHash(content);
          const relativePath = path.relative(uploadsPath, filePath);
          const publicPath = `/files/${relativePath.split(path.sep).join("/")}`;

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
      } else {
        switch (event.action) {
          case nsfw.actions.CREATED: {
            log(`File created: ${event.directory}/${event.file}`);

            const filePath = path.join(event.directory, event.file);
            const relativePath = path.relative(uploadsPath, filePath);

            // Check if it's a directory
            try {
              const stats = await fs.stat(filePath);
              if (stats.isDirectory()) {
                io.emit("folder-created", {
                  name: event.file,
                  path: `/files/${relativePath.split(path.sep).join("/")}`,
                });
                log(`Folder created: ${event.file}`);
                break;
              }
            } catch (error) {
              log(`Error checking file type: ${error}`);
            }

            const publicPath = `/files/${relativePath
              .split(path.sep)
              .join("/")}`;
            io.emit("file-added", {
              path: publicPath,
              type: path.extname(filePath).slice(1),
            });

            log(
              "EMITTING A WEB SOCKET EVENT TO CLIENTS, public path: " +
                publicPath
            );
            break;
          }
          case nsfw.actions.DELETED: {
            log(`File deleted: ${event.directory}/${event.file}`);
            const relativePath = path.relative(
              uploadsPath,
              path.join(event.directory, event.file)
            );
            const publicPath = `/files/${relativePath.split(path.sep).join("/")}`;
            io.emit("file-deleted", {
              path: publicPath,
            });
            break;
          }
          case nsfw.actions.RENAMED: {
            const oldPath = path.join(event.directory, event.oldFile);
            const newPath = path.join(event.directory, event.newFile);
            log(`File renamed: ${oldPath} -> ${newPath}`);

            // Check if it's a directory
            try {
              const stats = await fs.stat(newPath);
              if (stats.isDirectory()) {
                io.emit("folder-renamed", {
                  oldName: event.oldFile,
                  newName: event.newFile,
                });
                log(`Folder renamed: ${event.oldFile} -> ${event.newFile}`);
                break;
              }
            } catch (error) {
              log(`Error checking file type during rename: ${error}`);
            }

            // Regular file rename handling
            const relativeOldPath = path.relative(uploadsPath, oldPath);
            const relativeNewPath = path.relative(uploadsPath, newPath);
            io.emit("file-renamed", {
              oldPath: `/files/${relativeOldPath.split(path.sep).join("/")}`,
              newPath: `/files/${relativeNewPath.split(path.sep).join("/")}`,
            });
            break;
          }
        }
      }
    }
  });
  watcher.then((w) => {
    w.start();
  });
}

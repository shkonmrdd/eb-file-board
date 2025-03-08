import path from "path";
import nsfw from "nsfw";
import { Server } from "socket.io";
import { log } from "./utils";
import { uploadsPath } from "./app";

export function initFileWatcher(io: Server): void {
  const watcher = nsfw(uploadsPath, (events) => {
    events.forEach((event) => {
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
        case nsfw.actions.MODIFIED:
          console.log(`File modified: ${event.directory}/${event.file}`);
          break;
        case nsfw.actions.RENAMED:
          console.log(
            `File moved: ${event.directory}/${event.oldFile} -> ${event.directory}/${event.newFile}`
          );
          break;
      }
    });
  });
  watcher.then((w) => {
    w.start();
  });
}

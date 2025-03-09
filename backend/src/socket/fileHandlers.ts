import { Socket } from "socket.io";
import * as fs from "fs/promises";
import path from "path";
import { log } from "../utils";
import { calculateHash, setFileHash, hasFileChanged } from '../sync/FileSync';

interface FileUpdatePayload {
  path: string;
  content: string;
}

export const handleFileUpdate = async (
  socket: Socket,
  { path: filePath, content }: FileUpdatePayload
): Promise<void> => {
  try {
    const actualPath = path.join(__dirname, "../../uploads", filePath.replace(/^\/files/, ""));
    const newHash = calculateHash(content);
    
    // Check if file has actually changed
    if (!hasFileChanged(filePath, newHash)) {
      socket.emit("file-updated", { success: true, path: filePath });
      return;
    }

    // Ensure the directory exists
    await fs.mkdir(path.dirname(actualPath), { recursive: true });
    
    // Write the file and update hash
    await fs.writeFile(actualPath, content);
    setFileHash(filePath, newHash);
    
    const response = { success: true, path: filePath };
    socket.emit("file-updated", response);

    // Broadcast change to other clients
    socket.broadcast.emit("file-changed", { path: filePath, content });
  } catch (error) {
    log(`Error updating file: ${error}`);
    const response = { 
      success: false, 
      error: `Failed to update file: ${error}` 
    };
    socket.emit("file-updated", response);
  }
};
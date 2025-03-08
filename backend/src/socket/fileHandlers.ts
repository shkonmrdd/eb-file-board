import { Socket } from "socket.io";
import fs from "fs/promises";
import path from "path";
import { log } from "../utils";

interface FileUpdatePayload {
  path: string;
  content: string;
}

interface FileUpdateResponse {
  success: boolean;
  path?: string;
  error?: string;
}

export const handleFileUpdate = async (
  socket: Socket,
  { path: filePath, content }: FileUpdatePayload
): Promise<void> => {
  try {
    // Convert /files route path to actual uploads folder path
    const actualPath = path.join(__dirname, "../../uploads", filePath.replace(/^\/files/, ""));
    
    // Ensure the directory exists
    await fs.mkdir(path.dirname(actualPath), { recursive: true });
    
    // Write the file
    await fs.writeFile(actualPath, content);
    
    const response: FileUpdateResponse = { success: true, path: filePath };
    socket.emit("file-updated", response);
  } catch (error) {
    log(`Error updating file: ${error}`);
    const response: FileUpdateResponse = { 
      success: false, 
      error: "Failed to update file" 
    };
    socket.emit("file-updated", response);
  }
};
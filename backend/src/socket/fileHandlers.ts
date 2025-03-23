import * as fs from "fs/promises";
import path from "path";
import { log } from "../utils";
import { config } from "../config";

interface FileUpdatePayload {
  path: string;
  content: string;
}

export const handleFileUpdate = async ({
  path: filePath,
  content,
}: FileUpdatePayload): Promise<void> => {
  try {
    const filePathDecoded = decodeURIComponent(filePath);
    // Use config.uploadsPath instead of hardcoded path
    const pathWithoutPrefix = filePathDecoded.replace(/^\/files/, "");
    
    // Sanitize path segments to match the upload route sanitization
    // Split path into segments and sanitize each directory/board name
    const pathSegments = pathWithoutPrefix.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      // Only sanitize the first segment (boardName)
      pathSegments[0] = pathSegments[0].replace(/[^a-z0-9\-]/gi, '_');
    }
    const sanitizedPath = pathSegments.join('/');
    
    const actualPath = path.join(config.uploadsPath, sanitizedPath);

    // Ensure the directory exists
    await fs.mkdir(path.dirname(actualPath), { recursive: true });
    await fs.writeFile(actualPath, content);
  } catch (error) {
    log(`Error updating file: ${error}`);
  }
};

interface StateUpdatePayload {
  board: {
    elements: any[];
    appState: any;
  };
  boardName: string;
}

export const handleStateUpdate = async (
  payload: StateUpdatePayload
): Promise<void> => {
  try {
    const { board, boardName } = payload;
    // Sanitize board name to prevent directory traversal and ensure consistency with file uploads
    const safeBoardName = boardName.replace(/[^a-z0-9\-]/gi, '_');
    const boardPath = path.join(config.uploadsPath, safeBoardName, `board.json`);

    // Ensure the directory exists
    await fs.mkdir(path.dirname(boardPath), { recursive: true });
    await fs.writeFile(boardPath, JSON.stringify(board, null, 2));
  } catch (error) {
    log(`Error updating state: ${error}`);
  }
};

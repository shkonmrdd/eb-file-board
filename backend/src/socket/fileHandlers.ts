import * as fs from "fs/promises";
import path from "path";
import { log, sanitizeBoardName } from "../utils";
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
      pathSegments[0] = sanitizeBoardName(pathSegments[0]);
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
    files?: Record<string, {
      id: string;
      mimeType: string;
      dataURL: string;
      created: number;
      lastRetrieved: number;
    }>;
  };
  boardName: string;
}

export const handleStateUpdate = async (
  payload: StateUpdatePayload
): Promise<void> => {
  try {
    const { board, boardName } = payload;
    // Sanitize board name to prevent directory traversal and ensure consistency with file uploads
    const safeBoardName = sanitizeBoardName(boardName);
    const boardPath = path.join(config.uploadsPath, safeBoardName, `board.json`);

    // Ensure the directory exists
    await fs.mkdir(path.dirname(boardPath), { recursive: true });
    
    // Create a complete board object with files data
    const boardToSave = {
      elements: board.elements,
      appState: board.appState,
      files: board.files || {}
    };
    
    await fs.writeFile(boardPath, JSON.stringify(boardToSave, null, 2));
  } catch (error) {
    log(`Error updating state: ${error}`);
  }
};

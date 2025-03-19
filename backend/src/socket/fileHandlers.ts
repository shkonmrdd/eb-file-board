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
    const actualPath = path.join(
      config.uploadsPath,
      filePathDecoded.replace(/^\/files/, "")
    );

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
    const boardPath = path.join(config.uploadsPath, boardName, `board.json`);

    // Ensure the directory exists
    await fs.mkdir(path.dirname(boardPath), { recursive: true });
    await fs.writeFile(boardPath, JSON.stringify(board, null, 2));
  } catch (error) {
    log(`Error updating state: ${error}`);
  }
};

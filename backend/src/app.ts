import express from "express";
import multer from "multer";
import cors from "cors";
import { log } from "./utils";
import { config } from "./config";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());

app.use(config.uploadsRoute, express.static(config.uploadsPath));

app.use((req, res, next) => {
  log(`Route accessed: ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("AI File board API is up and running!");
});

const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload", upload.single("file"), (req, res): void => {
  if (!req.file) {
    log("No file uploaded");
    res.status(400).send("No file uploaded.");
    return;
  }

  // Get board name from the request body
  const boardName = req.body.boardName;
  if (!boardName) {
    log("No board name provided");
    res.status(400).send("Board name is required.");
    return;
  }

  // Sanitize board name to prevent directory traversal
  const safeBoardName = boardName.replace(/[^a-z0-9]/gi, '_');
  
  // Create board directory if it doesn't exist
  const boardPath = path.join(config.uploadsPath, safeBoardName);
  fs.mkdirSync(boardPath, { recursive: true });
  
  // Save file from memory to disk
  const fileName = req.file.originalname;
  const filePath = path.join(boardPath, fileName);
  
  fs.writeFileSync(filePath, req.file.buffer);
  
  log(`File uploaded: ${fileName} for board: ${safeBoardName}`);

  res.json({
    message: "File uploaded successfully!",
    fileUrl: `${req.protocol}://${req.get("host")}${config.uploadsRoute}/${safeBoardName}/${fileName}`,
    type: req.file.mimetype,
  });
});

export { app };

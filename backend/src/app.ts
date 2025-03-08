import express from "express";
import multer from "multer";
import path from "path";
import cors from "cors";
import { log } from "./utils";

const app = express();
app.use(cors());

export const uploadsPath = path.join(__dirname, "../uploads");
app.use("/files", express.static(uploadsPath));

// Simple middleware to log route accesses
app.use((req, res, next) => {
  log(`Route accessed: ${req.url}`);
  next();
});

// Root route
app.get("/", (req, res) => {
  res.send("AI File board API is up and running!");
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// File upload endpoint
app.post("/upload", upload.single("file"), (req, res): void => {
  if (!req.file) {
    log("No file uploaded");
    res.status(400).send("No file uploaded.");
    return;
  }
  log(`File uploaded: ${req.file.filename}`);
  res.json({
    message: "File uploaded successfully!",
    fileUrl: `${req.protocol}://${req.get("host")}/files/${req.file.filename}`,
  });
});

export { app };

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors"; // Import the cors package
import http from "http";
import { Server } from "socket.io";
import chokidar from "chokidar";

const app = express();
app.use(cors()); // Add CORS middleware to enable cross-origin requests
const port = process.env.PORT || 3001;

// Set up HTTP server to use with socket.io
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust based on security needs
    methods: ["GET", "POST"],
  },
});

// Update log function to use a custom timestamp format
const log = (message: string) => {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, -5);
  console.log(`[${timestamp}] ${message}`);
};

log("Server is starting...");

const watcher = chokidar.watch("uploads/", { persistent: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: async (req, file, cb) => {
    let uniqueName = `${file.originalname}`;
    let filePath = path.join(__dirname, "../uploads", uniqueName);

    // Check if the file already exists
    if (fs.existsSync(filePath)) {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);

      let newUniqueName = `${timestamp}-${nameWithoutExt}${ext}`;
      let newFilePath = path.join(__dirname, "../uploads", newUniqueName);

      while (fs.existsSync(newFilePath)) {
        newUniqueName = `${timestamp}-${Math.random()
          .toString(36)
          .substr(2, 9)}-${nameWithoutExt}${ext}`;
        newFilePath = path.join(__dirname, "../uploads", newUniqueName);
      }

      fs.renameSync(filePath, newFilePath);
    }

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Serve uploaded files
app.use("/files", express.static(path.join(__dirname, "../uploads")));

// Since log() already adds a timestamp, we can simplify this middleware to just call the next function
// Simplified middleware to log route access
app.use((req, res, next) => {
  log(`Route accessed: ${req.url}`);
  next();
});

// Send "ok" on root route
app.get("/", (req, res) => {
  log("Root route accessed");
  res.send("AI File board API is up and running!");
});

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

watcher.on("change", (filePath) => {
  const publicPath = `/files/${path.basename(filePath)}`;
  io.emit("file-added", {
    path: publicPath,
    type: path.extname(filePath).slice(1),
  });

  log("EMITTING A WEB SOCKET EVENT TO CLIENTS");
  log(publicPath)
});

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

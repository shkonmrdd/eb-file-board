import express from "express";
import multer from "multer";
import cors from "cors";
import cookieParser from "cookie-parser";
import { log } from "./utils";
import { config } from "./config";
import path from "path";
import fs from "fs";
import { authenticateJWT } from "./middleware/jwt.middleware";
import authRoutes from "./routes/auth.routes";
import { getCorsOrigins } from "./utils";

const app = express();

// Determine appropriate CORS origin based on environment
const corsOrigins = getCorsOrigins();
console.log(`HTTP CORS configured with allowed origins: ${corsOrigins.join(', ')}`);

// 1. Configure CORS first - this must come before authentication to allow preflight requests
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // Important for cookies with JWT
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Parse cookies and JSON body
app.use(cookieParser());
app.use(express.json());

// 3. Mount auth routes
app.use('/auth', authRoutes);

// 4. Apply JWT authentication for API routes
app.use('/api', authenticateJWT);
app.use(config.uploadsRoute, authenticateJWT);

// 5. Serve static files and set up routes
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(config.uploadsRoute, express.static(config.uploadsPath));

app.use((req, res, next) => {
  log(`Route accessed: ${req.url}`);
  next();
});

app.get("/api", (req, res) => {
  res.send("AI File board API is up and running!");
});

app.get("/api/boards", (req, res) => {
  try {
    if (!fs.existsSync(config.uploadsPath)) {
      fs.mkdirSync(config.uploadsPath, { recursive: true });
    }
    
    const boardDirs = fs.readdirSync(config.uploadsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    log(`Found ${boardDirs.length} boards: ${boardDirs.join(', ')}`);
    
    res.json({
      boards: boardDirs
    });
  } catch (error) {
    log(`Error fetching boards: ${error}`);
    res.json({
      boards: []
    });
  }
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


  const safeBoardName = boardName.replace(/[^a-z0-9\-]/gi, '_');
  
  const boardPath = path.join(config.uploadsPath, safeBoardName);
  fs.mkdirSync(boardPath, { recursive: true });
  

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

// Catch-all route to serve the frontend for any unmatched routes
// This needs to be after all API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

export { app };

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3001;

// Update log function to use a custom timestamp format
const log = (message: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, -5);
    console.log(`[${timestamp}] ${message}`);
};

log('Server is starting...');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Serve uploaded files
app.use('/files', express.static(path.join(__dirname, '../uploads')));

// Since log() already adds a timestamp, we can simplify this middleware to just call the next function
// Simplified middleware to log route access
app.use((req, res, next) => {
    log(`Route accessed: ${req.url}`);
    next();
});

// Send "ok" on root route
app.get('/', (req, res) => {
  log('Root route accessed');
  res.send('AI File board API is up and running!');
});

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res): void => {
    if (!req.file) {
      log('No file uploaded');
      res.status(400).send('No file uploaded.');
      return;
    }
    log(`File uploaded: ${req.file.filename}`);
    res.json({
      message: 'File uploaded successfully!',
      fileUrl: `${req.protocol}://${req.get('host')}/files/${req.file.filename}`
    });
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
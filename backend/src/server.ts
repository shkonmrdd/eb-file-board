import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3001;

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

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res): void => {
    if (!req.file) {
      res.status(400).send('No file uploaded.');
      return;
    }
    res.json({
      message: 'File uploaded successfully!',
      fileUrl: `${req.protocol}://${req.get('host')}/files/${req.file.filename}`
    });
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

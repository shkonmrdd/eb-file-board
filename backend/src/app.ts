import express from "express";
import multer from "multer";
import cors from "cors";
import { log } from "./utils";
import { config } from "./config";

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res): void => {
  if (!req.file) {
    log("No file uploaded");
    res.status(400).send("No file uploaded.");
    return;
  }
  log(`File uploaded: ${req.file.filename}`);
  res.json({
    message: "File uploaded successfully!",
    fileUrl: `${req.protocol}://${req.get("host")}${config.uploadsRoute}/${req.file.filename}`,
    type: req.file.mimetype,
  });
});

export { app };

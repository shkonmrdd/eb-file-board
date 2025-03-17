import path from "path";

export const config = {
  uploadsPath: path.join(__dirname, "../files"),
  uploadsRoute: "/files",
} as const;

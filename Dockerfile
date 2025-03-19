# Backend build stage
FROM node:22-alpine AS backend-build

WORKDIR /app

# Copy package files and install dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Copy source code and build script
COPY backend/tsconfig.json ./
COPY backend/build.js ./
COPY backend/src ./src

# Build the application
RUN npm run build

# Frontend build stage
FROM node:22-alpine AS frontend-build

WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source code
COPY frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json ./
COPY frontend/vite.config.ts frontend/index.html ./
COPY frontend/src ./src
COPY frontend/public ./public

# Build the frontend application
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

# Copy backend built files and package.json
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/package.json ./
COPY --from=backend-build /app/package-lock.json ./

# Copy frontend build output to a directory the backend can serve
COPY --from=frontend-build /app/dist ./public

# Install only production dependencies for backend
RUN npm ci --production

# Create data directory structure for mounted volume
RUN mkdir -p /data/files

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["node", "./dist/server.js"]

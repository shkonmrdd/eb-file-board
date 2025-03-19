FROM node:18-alpine AS build

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
# Verify the build output location and content
RUN ls -la dist || echo "dist directory not found"

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy only the built files and package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./

# List contents to verify files were copied correctly
RUN ls -la && ls -la dist || echo "dist directory not found"

# Install only production dependencies
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

# CMD ["sh", "-c", "trap : TERM INT; sleep infinity & wait"]

# AI File Board Backend

## Docker Usage

To run the application with Docker:

```bash
# Build the Docker image
docker build -t ai-file-board .

# Run the container with file volume mounted
docker run -p 3001:3001 -v /path/on/host:/data/files ai-file-board

# Or
docker run -p 3001:3001 -v .:/data/files ai-file-board
```

The `/data/files` directory in the container is configured as the file storage location and can be mounted as a volume to persist files on the host machine.

## Environment Variables

- `PORT`: Server port (default: 3001)

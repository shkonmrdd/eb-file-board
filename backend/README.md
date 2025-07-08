# AI File Board Backend

## Docker Usage

To run the application with Docker:

```bash
# Build the Docker image
docker build -t eb-file-board .

# Run the container with file volume mounted
docker run -p 3001:3001 -v /path/on/host:/data/files eb-file-board

# Or
docker run -p 3001:3001 -v .:/data/files eb-file-board
```

The `/data/files` directory in the container is configured as the file storage location and can be mounted as a volume to persist files on the host machine.

## Environment Variables

- `PORT`: Server port (default: 3001)

## Authentication & Security

Environment variables:

- `JWT_SECRET` – secret key (**required in production**, min 32 chars)
- `BROWSER_TOKEN_EXPIRES_IN` – optional, JWT lifetime (default `365d`)

At initial server startup an **INITIAL LOGIN TOKEN** is printed to the console. POST this token to `/auth/login` from each device to obtain a short-lived JWT cookie.

When the JWT expires a subsequent API request will return HTTP 401. Simply log in again with the same initial token to get a fresh JWT.

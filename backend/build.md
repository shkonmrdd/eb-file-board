build:
```
docker build -t eb-file-board:latest .
```

run:
```
# Basic run command with JWT authentication and volume mounting
docker run -d --name eb-file-board \
  -p 127.0.0.1:3001:3001 \
  -v /path/to/local/files:/data/files \
  eb-file-board:latest

# After the first run, get your initial login token with:
docker logs eb-file-board | grep "INITIAL LOGIN TOKEN"
```

## Security Features

This application includes several security features:

1. **JWT-based Authentication**:
   - A secure JSON Web Token (JWT) authentication system
   - Initial token is generated on first startup and displayed in logs
   - 30-day JWT tokens are issued after successful login
   - Tokens are stored in HTTP-only cookies for added security
   - Automatic token refresh and verification

2. **Network Access Control**:
   - The server only binds to localhost (127.0.0.1) by default
   - The Docker run command binds only to localhost with `127.0.0.1:3001:3001`
   - Additional IP restrictions can be configured with the `ALLOWED_IPS` environment variable

3. **Environment Variables**:
   - `JWT_SECRET`: Set a custom secret for JWT signing (if not set, a random one is generated)
   - `JWT_EXPIRES_IN`: Set custom JWT expiration time (default: '30d')
   - `ALLOWED_IPS`: Comma-separated list of allowed IPs (default: 127.0.0.1,::1)
   - `CORS_ORIGINS`: Comma-separated list of allowed origins (default: http://localhost:3001,http://localhost:5173 in development, http://localhost:3001 in production)

## Advanced Usage

```
# Run with custom configuration and persistent JWT secret
docker run -d --name eb-file-board \
  -p 127.0.0.1:3001:3001 \
  -v /path/to/local/files:/data/files \
  -e JWT_SECRET="your-secure-jwt-secret" \
  -e JWT_EXPIRES_IN="7d" \
  -e ALLOWED_IPS="127.0.0.1,192.168.1.100" \
  -e CORS_ORIGINS="https://yourdomain.com" \
  eb-file-board:latest
```
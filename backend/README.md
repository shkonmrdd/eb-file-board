# EB File Board Backend

> Backend API server for EB File Board - a single-user visual workspace built on Excalidraw

This is the Node.js/Express backend that powers EB File Board, providing file management, authentication, and real-time board synchronization capabilities.

## What This Backend Does

- **File Management**: Upload, create, edit, and organize files (PDFs, Markdown, text, images)
- **Authentication**: Simple JWT-based auth system with bootstrap token
- **Real-time Sync**: WebSocket connections for live board updates
- **API Services**: RESTful endpoints for frontend integration
- **Static File Serving**: Serves uploaded files and board data

## Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Docker Setup

```bash
# Build the Docker image
docker build -t eb-file-board .

# Run with file persistence (./files = current directory's files folder)
docker run -p 3001:3001 -v ./files:/data/files eb-file-board

# Or with absolute path
docker run -p 3001:3001 -v /path/to/your/files:/data/files eb-file-board
```

## Configuration

### Environment Variables

```bash
# Required for production
JWT_SECRET=your-super-secret-minimum-32-characters

# Optional
PORT=3001                           # Server port
BROWSER_TOKEN_EXPIRES_IN=365d      # JWT lifetime
```

### File Storage

Files are stored in the `files/` directory by default. In Docker, this maps to `/data/files` and can be mounted as a volume for persistence.

## Authentication Flow

1. **Server starts** → Generates a **BOOTSTRAP TOKEN** (printed to console)
2. **Client authentication** → POST token to `/auth/login` 
3. **JWT issued** → Short-lived JWT cookie for subsequent requests
4. **Token expiry** → Bootstrap token expires in 15 minutes, restart server to regenerate

> **Security Note**: This backend uses HTTP-only cookies and is designed for localhost/trusted LAN use only. Do not expose to the Internet.

## API Overview

### Authentication
- `POST /auth/login` - Exchange bootstrap token for JWT
- `POST /auth/logout` - Clear authentication cookie

### File Management
- File upload, creation, and editing endpoints
- Directory tree traversal
- File metadata management

### Board Management
- Board creation and switching
- Real-time board state synchronization
- WebSocket connections for live updates

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # JWT auth middleware
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── socket/          # WebSocket handlers
│   ├── app.ts          # Express app setup
│   └── server.ts       # Server entry point
├── files/              # File storage directory
└── dist/               # Built JavaScript output
```

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build

### Dependencies
- **Express**: Web framework
- **Socket.IO**: Real-time communication
- **JWT**: Authentication tokens
- **Multer**: File upload handling
- **TypeScript**: Type safety

## Related

This backend is part of the **EB File Board** project. For the complete application:
- [Frontend](../frontend/) - React TypeScript UI
- [Main Repository](../) - Full project documentation

## License

MIT License - see [LICENSE](../LICENSE) for details.
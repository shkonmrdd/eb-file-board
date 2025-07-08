# EB File Board Frontend

> React TypeScript frontend for EB File Board - a single-user visual workspace built on Excalidraw

This is the React TypeScript frontend that provides the user interface for EB File Board, featuring an infinite canvas for drawing, embedded file viewing, and intuitive file management.

## What This Frontend Does

- **Infinite Canvas**: Excalidraw-powered drawing and annotation workspace
- **File Integration**: Drag-and-drop file uploads and embedded viewing
- **PDF Viewing**: In-canvas PDF display and navigation
- **Markdown Editing**: Live preview markdown editor embedded on canvas
- **Image Support**: Drag and drop images directly onto the canvas
- **Board Management**: Create and switch between different project boards
- **File Tree**: Hierarchical file browser with preview capabilities
- **Theme Support**: Light/dark theme toggle
- **Real-time Sync**: Live board updates via WebSocket connection

## Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm run preview
```

### Backend Connection

The frontend automatically connects to the backend at `http://localhost:3001`. Make sure the backend is running first.

For custom backend configuration, modify `src/constants/config.ts`.

## Technology Stack

### Core Framework
- **React 18+**: Component-based UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server

### Drawing & Canvas
- **Excalidraw**: Infinite canvas drawing engine
- **React-Excalidraw**: React integration for Excalidraw

### File Handling
- **PDF.js**: PDF rendering in the browser
- **React Markdown Editor**: Live preview markdown editing
- **File drag-and-drop**: Native HTML5 file API

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Modules**: Component-scoped styling
- **PostCSS**: CSS processing

### State Management
- **Zustand**: Lightweight state management
- **React Hooks**: Built-in state and effect management

### Communication
- **Socket.IO Client**: Real-time WebSocket connection
- **Fetch API**: HTTP requests to backend

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── FileTree.tsx    # File browser
│   │   ├── Header.tsx      # Top navigation
│   │   ├── LoginForm.tsx   # Authentication
│   │   ├── PDFViewerElement.tsx    # PDF embedding
│   │   ├── MarkdownViewerElement.tsx # Markdown editing
│   │   └── ...
│   ├── pages/              # Main application pages
│   │   ├── FileBoardPage.tsx       # Main board interface
│   │   ├── PDFViewerPage.tsx       # Standalone PDF viewer
│   │   └── MarkdownViewerPage.tsx  # Standalone markdown editor
│   ├── layouts/            # Layout components
│   ├── store/              # Zustand state stores
│   │   ├── authStore.ts    # Authentication state
│   │   ├── boardStore.ts   # Board/canvas state
│   │   ├── fileStore.ts    # File management state
│   │   └── fileTreeStore.ts # File tree state
│   ├── services/           # API communication
│   │   ├── api.ts          # HTTP API client
│   │   ├── auth.ts         # Authentication service
│   │   └── socket.ts       # WebSocket connection
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── constants/          # Configuration constants
├── public/                 # Static assets
├── dist/                   # Built application
└── package.json           # Dependencies and scripts
```

## Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler checks

### Code Style
- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking enabled

### Environment
- **Vite**: Fast development server and build tool
- **Hot Module Replacement**: Instant updates during development
- **TypeScript**: Full type safety and IntelliSense

## Features

### Canvas Integration
- Seamless Excalidraw integration for drawing and annotation
- Embedded file viewing directly on the canvas
- Image support with drag-and-drop functionality

### File Management
- Hierarchical file tree with expand/collapse
- File upload via drag-and-drop
- In-line file creation (text and markdown)
- File preview and editing capabilities

### Board System
- Multiple boards for different projects
- Board switching with state preservation
- Auto-save functionality

### Authentication
- Simple token-based authentication
- Persistent login state
- Secure HTTP-only cookie handling

## Related

This frontend is part of the **EB File Board** project. For the complete application:
- [Backend](../backend/) - Node.js API server
- [Main Repository](../) - Full project documentation

## License

MIT License - see [LICENSE](../LICENSE) for details.

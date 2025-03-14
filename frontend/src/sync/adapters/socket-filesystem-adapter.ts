import { FileSystemAdapter, FileSystemEvent, FileSystemStructure } from '../interfaces';
import { Element, FileInfo, DirectoryInfo } from '../core-types';
import { socket } from '../../socket';
import { parseEmbeddableUrl } from '../url-parser';
import { debounce } from 'lodash';

export class SocketFileSystemAdapter implements FileSystemAdapter {
  private callbacks: ((event: FileSystemEvent) => void)[] = [];
  private pathToElementMap: Map<string, string> = new Map();
  private processingStateChange = false;
  
  constructor(private baseUrl: string = 'http://localhost:3001') {}
  
  async initialize(): Promise<void> {
    console.log('Initializing SocketFileSystemAdapter');
    
    // Set up socket event handlers with error handling
    this.setupSocketListeners();
    
    // Request initial file system structure
    try {
      await this.getFileSystemStructure();
      console.log('File system structure loaded');
    } catch (err) {
      console.error('Failed to load initial file system structure', err);
    }
  }
  
  private setupSocketListeners(): void {
    // Clean up existing listeners if any
    socket.off('file-changed');
    socket.off('file-added');
    socket.off('file-deleted');
    socket.off('folder-created');
    socket.off('folder-renamed');
    socket.off('state-changed');
    
    // File changed event
    socket.on('file-changed', (data: { path: string, content: string }) => {
      try {
        // Skip board.json updates to avoid circular updates
        if (data.path.endsWith('board.json') && this.processingStateChange) {
          return;
        }
        
        this.notifySubscribers({
          type: 'fileModified',
          path: data.path,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error handling file-changed event', error);
      }
    });
    
    // File added event
    socket.on('file-added', (data: { path: string, type: string }) => {
      try {
        this.notifySubscribers({
          type: 'fileCreated',
          path: data.path,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error handling file-added event', error);
      }
    });
    
    // File deleted event
    socket.on('file-deleted', (data: { path: string }) => {
      try {
        this.notifySubscribers({
          type: 'fileDeleted',
          path: data.path,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error handling file-deleted event', error);
      }
    });
    
    // Folder created event
    socket.on('folder-created', (data: { path: string, name: string }) => {
      try {
        this.notifySubscribers({
          type: 'directoryCreated',
          path: data.path,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error handling folder-created event', error);
      }
    });
    
    // State changed event (board updates)
    socket.on('state-changed', (data: { elements: any[], appState: any }) => {
      try {
        if (this.processingStateChange) {
          return; // Skip if we're already processing a state change
        }
        
        console.log('Received state-changed event from server');
        // This will be handled by the structure manager
        this.notifySubscribers({
          type: 'stateSync',
          path: '/files/board.json',
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error handling state-changed event', error);
      }
    });
  }
  
  subscribe(callback: (event: FileSystemEvent) => void): void {
    this.callbacks.push(callback);
  }
  
  async createFile(element: Element): Promise<void> {
    if (element.type !== 'embeddable') return;
    
    try {
      const parsedUrl = parseEmbeddableUrl((element as any).link);
      if (!parsedUrl.filePath) {
        console.warn('Cannot create file: Invalid URL', (element as any).link);
        return;
      }
      
      // Create an empty file
      socket.emit('update-file', {
        path: parsedUrl.filePath,
        content: ''
      });
      
      console.log('Created file:', parsedUrl.filePath);
    } catch (error) {
      console.error('Error creating file:', error);
    }
  }
  
  async createDirectory(element: Element): Promise<void> {
    if (element.type !== 'frame') return;
    
    try {
      // Get the frame name or use the ID if no name is set
      const frameName = (element as any).name || `frame-${element.id}`;
      
      socket.emit('create-directory', {
        elementId: element.id,
        name: frameName
      });
      
      console.log(`Creating directory for frame: ${frameName}`);
      
      // Store mapping between element ID and directory name
      this.pathToElementMap.set(`/files/${frameName}`, element.id);
    } catch (error) {
      console.error('Error creating directory for frame:', error);
    }
  }
  
  async removeFile(path: string): Promise<void> {
    // Not directly supported in current backend
    console.log('removeFile called for path:', path);
  }
  
  async removeDirectory(path: string): Promise<void> {
    // Not directly supported in current backend
    console.log('removeDirectory called for path:', path);
  }
  
  // Safe wrapper for state updates
  updateBoardState = debounce(async (elements: any[], appState: any): Promise<void> => {
    try {
      this.processingStateChange = true;
      socket.emit('update-state', { elements, appState });
      console.log('Sent update-state event to server');
      
      // Reset processing flag after a delay to prevent race conditions
      setTimeout(() => {
        this.processingStateChange = false;
      }, 1000);
    } catch (error) {
      console.error('Error updating board state:', error);
      this.processingStateChange = false;
    }
  }, 500);
  
  async getFileSystemStructure(): Promise<FileSystemStructure> {
    // Since your backend doesn't have an endpoint for this,
    // we'll create a simplified version based on what we know
    return {
      files: [],
      directories: []
    };
  }
  
  private notifySubscribers(event: FileSystemEvent): void {
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in file system event callback:', error);
      }
    });
  }
}
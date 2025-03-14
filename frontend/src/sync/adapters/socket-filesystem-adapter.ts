import { FileSystemAdapter, FileSystemEvent, FileSystemStructure } from '../interfaces';
import { Element, FileInfo, DirectoryInfo } from '../core-types';
import { socket } from '../../socket';

export class SocketFileSystemAdapter implements FileSystemAdapter {
  private callbacks: ((event: FileSystemEvent) => void)[] = [];
  
  constructor() {}
  
  async initialize(): Promise<void> {
    // Set up socket event listeners
    socket.on('file-created', (data: { path: string, lastModified: number }) => {
      this.notifySubscribers({
        type: 'fileCreated',
        path: data.path,
        timestamp: data.lastModified
      });
    });
    
    socket.on('file-modified', (data: { path: string, lastModified: number }) => {
      this.notifySubscribers({
        type: 'fileModified',
        path: data.path,
        timestamp: data.lastModified
      });
    });
    
    socket.on('file-deleted', (data: { path: string }) => {
      this.notifySubscribers({
        type: 'fileDeleted',
        path: data.path,
        timestamp: Date.now()
      });
    });
    
    socket.on('directory-created', (data: { path: string, lastModified: number }) => {
      this.notifySubscribers({
        type: 'directoryCreated',
        path: data.path,
        timestamp: data.lastModified
      });
    });
    
    socket.on('directory-deleted', (data: { path: string }) => {
      this.notifySubscribers({
        type: 'directoryDeleted',
        path: data.path,
        timestamp: Date.now()
      });
    });
  }
  
  subscribe(callback: (event: FileSystemEvent) => void): void {
    this.callbacks.push(callback);
  }
  
  async createFile(element: Element): Promise<void> {
    socket.emit('create-file', {
      elementId: element.id,
      link: (element as any).link || '',
      content: '' // Default empty content
    });
  }
  
  async createDirectory(element: Element): Promise<void> {
    socket.emit('create-directory', {
      elementId: element.id
    });
  }
  
  async removeFile(path: string): Promise<void> {
    socket.emit('delete-file', { path });
  }
  
  async removeDirectory(path: string): Promise<void> {
    socket.emit('delete-directory', { path });
  }
  
  async getFileSystemStructure(): Promise<FileSystemStructure> {
    return new Promise((resolve) => {
      socket.emit('get-filesystem-structure', {}, (structure: FileSystemStructure) => {
        resolve(structure);
      });
      
      // Add timeout in case we don't get a response
      setTimeout(() => {
        resolve({ files: [], directories: [] });
      }, 5000);
    });
  }
  
  private notifySubscribers(event: FileSystemEvent): void {
    this.callbacks.forEach(callback => callback(event));
  }
}
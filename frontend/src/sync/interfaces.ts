import { Element, ElementId, Structure, SyncOptions, SyncStatus, SyncEvent, FileInfo, DirectoryInfo } from './core-types';

// Frontend Adapter Interface
export interface FrontendEvent {
  type: 'elementAdded' | 'elementUpdated' | 'elementDeleted' | 'structureChanged';
  payload: any;
}

export interface FrontendAdapter {
  initialize(structure: Structure): Promise<void>;
  subscribe(callback: (event: FrontendEvent) => void): void;
  updateElement(element: Element): Promise<void>;
  addElement(element: Element): Promise<void>;
  removeElement(elementId: ElementId): Promise<void>;
  getCurrentStructure(): Promise<Structure>;
}

// File System Adapter Interface
export interface FileSystemStructure {
  files: FileInfo[];
  directories: DirectoryInfo[];
}

export interface FileSystemEvent {
  type: 'fileCreated' | 'fileModified' | 'fileDeleted' | 'directoryCreated' | 'directoryDeleted';
  path: string;
  timestamp: number;
}

export interface FileSystemAdapter {
  initialize(): Promise<void>;
  subscribe(callback: (event: FileSystemEvent) => void): void;
  createFile(element: Element): Promise<void>;
  createDirectory(element: Element): Promise<void>;
  removeFile(path: string): Promise<void>;
  removeDirectory(path: string): Promise<void>;
  getFileSystemStructure(): Promise<FileSystemStructure>;
}

// Structure Manager Interface
export interface StructureManager {
  initialize(options: SyncOptions): Promise<void>;
  startSync(): Promise<void>;
  stopSync(): Promise<void>;
  forceSync(): Promise<void>;
  getSyncStatus(): SyncStatus;
  subscribe(callback: (event: SyncEvent) => void): void;
}

// Event Bus Interface
export interface Event<T = any> {
  type: string;
  payload: T;
  timestamp: number;
}

export type EventCallback<T = any> = (event: Event<T>) => void;

export interface EventBus {
  subscribe<T>(eventType: string, callback: EventCallback<T>): void;
  unsubscribe<T>(eventType: string, callback: EventCallback<T>): void;
  publish<T>(eventType: string, payload: T): void;
}

// Mapping Strategy Interface
export interface MappingStrategy {
  // Convert from front-end element to file system path
  elementToPath(element: Element): string;
  
  // Convert from file system path to front-end element
  pathToElement(path: string, fileInfo: FileInfo | DirectoryInfo): Element;
  
  // Determine if a file system path should be synchronized
  shouldIncludePath(path: string): boolean;
}
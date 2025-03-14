// Core domain types
export type ElementId = string;

export interface BaseElement {
  id: ElementId;
  type: string;
  updated: number; // timestamp
}

export interface EmbeddableElement extends BaseElement {
  type: 'embeddable';
  link: string; // URL to the content
}

export interface FrameElement extends BaseElement {
  type: 'frame';
  // Frame-specific properties
}

export type Element = EmbeddableElement | FrameElement;

export interface Structure {
  elements: Element[];
}

// Sync events
export interface SyncEvent {
  type: 'syncStarted' | 'syncCompleted' | 'syncFailed' | 'conflictDetected' | 'changeApplied';
  timestamp: number;
  details: any;
}

export interface SyncOptions {
  bidirectional: boolean;
  conflictResolution: 'frontend-wins' | 'filesystem-wins' | 'latest-wins' | 'manual';
  autoSync: boolean;
  syncInterval?: number; // in milliseconds
}

export interface SyncStatus {
  isActive: boolean;
  lastSyncTime: number | null;
  pendingChanges: boolean;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  elementId: ElementId;
  frontendVersion: Element;
  fileSystemVersion: FileInfo | DirectoryInfo;
  timestamp: number;
}

// File system types (simplified for frontend)
export interface FileInfo {
  path: string;
  lastModified: number;
}

export interface DirectoryInfo {
  path: string;
  lastModified: number;
}
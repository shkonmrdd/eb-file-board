import { StructureManager, FrontendAdapter, FileSystemAdapter, EventBus } from './interfaces';
import { Structure, SyncOptions, SyncStatus, SyncEvent } from './core-types';
import { debounce } from 'lodash';

export class SimpleStructureManager implements StructureManager {
  private options: SyncOptions = {
    bidirectional: true,
    conflictResolution: 'latest-wins',
    autoSync: false,
  };
  
  private syncStatus: SyncStatus = {
    isActive: false,
    lastSyncTime: null,
    pendingChanges: false,
    conflicts: []
  };
  
  private subscribers: ((event: SyncEvent) => void)[] = [];
  private previousFrames = new Map<string, any>();
  
  constructor(
    private frontendAdapter: FrontendAdapter,
    private fileSystemAdapter: SocketFileSystemAdapter,
    private eventBus: EventBus
  ) {}
  
  async initialize(options: SyncOptions): Promise<void> {
    console.log('Initializing SimpleStructureManager');
    
    this.options = { ...this.options, ...options };
    
    // Set up frontend event listeners with special frame handling
    this.frontendAdapter.subscribe(event => {
      if (!this.options.bidirectional) return;
      
      try {
        switch (event.type) {
          case 'elementAdded':
            console.log('Element added:', event.payload.id, event.payload.type);
            if (event.payload.type === 'embeddable') {
              this.fileSystemAdapter.createFile(event.payload);
            } else if (event.payload.type === 'frame') {
              // Handle frame creation
              this.fileSystemAdapter.createDirectory(event.payload);
              this.previousFrames.set(event.payload.id, {...event.payload});
            }
            break;
            
          case 'elementUpdated':
            // Check if it's a frame and if the name has changed
            if (event.payload.type === 'frame') {
              const prevFrame = this.previousFrames.get(event.payload.id);
              const currentFrame = event.payload;
              
              if (prevFrame && prevFrame.name !== currentFrame.name) {
                console.log(`Frame renamed: ${prevFrame.name} -> ${currentFrame.name}`);
                
                // Send frame rename event
                socket.emit('rename-directory', {
                  elementId: currentFrame.id,
                  oldName: prevFrame.name || `frame-${currentFrame.id}`,
                  newName: currentFrame.name || `frame-${currentFrame.id}`
                });
              }
              
              // Update previous frame state
              this.previousFrames.set(currentFrame.id, {...currentFrame});
            }
            break;
            
          case 'elementDeleted':
            // Handle element deletion
            this.previousFrames.delete(event.payload.id);
            break;
            
          case 'structureChanged':
            // When the structure changes significantly, update the whole board state
            if (event.payload.elements && event.payload.appState) {
              // Update frame tracking for all current frames
              const frameElements = event.payload.elements.filter(el => el.type === 'frame');
              frameElements.forEach(frame => {
                this.previousFrames.set(frame.id, {...frame});
              });
              
              this.fileSystemAdapter.updateBoardState(
                event.payload.elements, 
                event.payload.appState
              );
              
              this.syncStatus.pendingChanges = false;
              this.syncStatus.lastSyncTime = Date.now();
              
              this.notifySyncEvent({
                type: 'syncCompleted',
                timestamp: Date.now(),
                details: { source: 'frontend' }
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error handling frontend event:', error);
      }
    });
    
    // Set up filesystem event listeners
    this.fileSystemAdapter.subscribe(event => {
      if (!this.options.bidirectional) return;
      
      try {
        console.log('File system event:', event.type, event.path);
        
        // When receiving a stateSync event, it means the board.json has changed
        // We'll force a sync to update our frontend
        if (event.type === 'stateSync') {
          this.forceSync().catch(console.error);
        }
      } catch (error) {
        console.error('Error handling file system event:', error);
      }
    });
    
    // Set sync status to active
    this.syncStatus.isActive = true;
    
    this.notifySyncEvent({
      type: 'syncStarted',
      timestamp: Date.now(),
      details: { mode: 'websocket-only' }
    });
    
    console.log('SimpleStructureManager initialized');
  }
  
  async startSync(): Promise<void> {
    if (this.syncStatus.isActive) return;
    
    this.syncStatus.isActive = true;
    
    this.notifySyncEvent({
      type: 'syncStarted',
      timestamp: Date.now(),
      details: { mode: 'manual' }
    });
    
    console.log('Sync started');
  }
  
  async stopSync(): Promise<void> {
    if (!this.syncStatus.isActive) return;
    
    this.syncStatus.isActive = false;
    
    this.notifySyncEvent({
      type: 'syncCompleted',
      timestamp: Date.now(),
      details: { reason: 'manual-stop' }
    });
    
    console.log('Sync stopped');
  }
  
  async forceSync(): Promise<void> {
    if (!this.syncStatus.isActive) {
      console.log('Skipping force sync - already in progress or sync inactive');
      return;
    }
    
    try {
      this.notifySyncEvent({
        type: 'syncStarted',
        timestamp: Date.now(),
        details: { mode: 'manual' }
      });
      
      console.log('Force sync started');
      
      // Just update the current structure
      const frontendStructure = await this.frontendAdapter.getCurrentStructure();
      
      // Get the current scene state from Excalidraw
      const excalidrawAPI = (this.frontendAdapter as any).excalidrawInstance;
      if (excalidrawAPI) {
        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        
        // Only emit if we have elements to avoid unnecessary updates
        if (elements && elements.length > 0) {
          this.fileSystemAdapter.updateBoardState(
            elements.filter(el => !el.isDeleted),
            appState
          );
        }
      }
      
      this.syncStatus.lastSyncTime = Date.now();
      this.syncStatus.pendingChanges = false;
      
      this.notifySyncEvent({
        type: 'syncCompleted',
        timestamp: Date.now(),
        details: { conflicts: 0 }
      });
      
      console.log('Force sync completed');
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifySyncEvent({
        type: 'syncFailed',
        timestamp: Date.now(),
        details: { error }
      });
    }
  }
  
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }
  
  subscribe(callback: (event: SyncEvent) => void): void {
    this.subscribers.push(callback);
  }
  
  private notifySyncEvent(event: SyncEvent): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(event);
      } catch (error) {
        console.error('Error in sync event subscriber:', error);
      }
    });
    
    this.eventBus.publish('sync', event);
  }
}

// Import at the top
import { SocketFileSystemAdapter } from './adapters/socket-filesystem-adapter';
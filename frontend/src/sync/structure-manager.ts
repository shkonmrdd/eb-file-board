import { StructureManager, FrontendAdapter, FileSystemAdapter, EventBus } from './interfaces';
import { Structure, SyncOptions, SyncStatus, SyncEvent, Element, ElementId } from './core-types';

export class SimpleStructureManager implements StructureManager {
  private options: SyncOptions = {
    bidirectional: true,
    conflictResolution: 'latest-wins',
    autoSync: true
  };
  
  private syncStatus: SyncStatus = {
    isActive: false,
    lastSyncTime: null,
    pendingChanges: false,
    conflicts: []
  };
  
  private syncIntervalId: number | null = null;
  private subscribers: ((event: SyncEvent) => void)[] = [];
  
  constructor(
    private frontendAdapter: FrontendAdapter,
    private fileSystemAdapter: FileSystemAdapter,
    private eventBus: EventBus
  ) {}
  
  async initialize(options: SyncOptions): Promise<void> {
    this.options = { ...this.options, ...options };
    
    // Set up event listeners for frontend changes
    this.frontendAdapter.subscribe(event => {
      if (!this.options.bidirectional) return;
      
      switch (event.type) {
        case 'elementAdded':
          const element = event.payload as Element;
          if (element.type === 'embeddable') {
            this.fileSystemAdapter.createFile(element);
          } else {
            this.fileSystemAdapter.createDirectory(element);
          }
          break;
          
        case 'elementUpdated':
          // Handle update - might need more complex logic depending on needs
          break;
          
        case 'elementDeleted':
          // Handle deletion - needs path information from mapping
          break;
      }
      
      this.syncStatus.pendingChanges = true;
    });
    
    // Start auto-sync if configured
    if (this.options.autoSync && this.options.syncInterval) {
      this.startSync();
    }
  }
  
  async startSync(): Promise<void> {
    if (this.syncStatus.isActive) return;
    
    this.syncStatus.isActive = true;
    
    if (this.options.autoSync && this.options.syncInterval) {
      this.syncIntervalId = window.setInterval(() => {
        this.forceSync();
      }, this.options.syncInterval);
    }
    
    this.notifySyncEvent({
      type: 'syncStarted',
      timestamp: Date.now(),
      details: { mode: this.options.autoSync ? 'auto' : 'manual' }
    });
  }
  
  async stopSync(): Promise<void> {
    if (!this.syncStatus.isActive) return;
    
    this.syncStatus.isActive = false;
    
    if (this.syncIntervalId !== null) {
      window.clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    
    this.notifySyncEvent({
      type: 'syncCompleted',
      timestamp: Date.now(),
      details: { reason: 'manual-stop' }
    });
  }
  
  async forceSync(): Promise<void> {
    try {
      this.notifySyncEvent({
        type: 'syncStarted',
        timestamp: Date.now(),
        details: { mode: 'manual' }
      });
      
      // Basic sync implementation - just save current frontend state
      const frontendStructure = await this.frontendAdapter.getCurrentStructure();
      
      // For now, we just save the whole board state via socket
      // In a more sophisticated implementation, we'd do differential updates
      this.eventBus.publish('sync-filesystem', { structure: frontendStructure });
      
      this.syncStatus.lastSyncTime = Date.now();
      this.syncStatus.pendingChanges = false;
      
      this.notifySyncEvent({
        type: 'syncCompleted',
        timestamp: Date.now(),
        details: { conflicts: 0 }
      });
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
    this.subscribers.forEach(subscriber => subscriber(event));
    this.eventBus.publish('sync', event);
  }
}
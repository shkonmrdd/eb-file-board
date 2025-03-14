import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { ExcalidrawAdapter } from './adapters/excalidraw-adapter';
import { SocketFileSystemAdapter } from './adapters/socket-filesystem-adapter';
import { SimpleEventBus } from './eventbus';
import { SimpleStructureManager } from './structure-manager';
import { SyncStatus, SyncEvent } from './core-types';
import { socket } from '../socket';

interface SyncContextType {
  excalidrawAdapter: ExcalidrawAdapter;
  fileSystemAdapter: SocketFileSystemAdapter;
  structureManager: SimpleStructureManager;
  eventBus: SimpleEventBus;
  syncStatus: SyncStatus;
  setExcalidrawAPI: (api: ExcalidrawImperativeAPI) => void;
  forceSync: () => Promise<void>;
  resetSync: () => void;
  syncError: Error | null;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};

interface SyncProviderProps {
  children: React.ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  // State for tracking sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    lastSyncTime: null,
    pendingChanges: false,
    conflicts: []
  });
  
  // State for tracking errors
  const [syncError, setSyncError] = useState<Error | null>(null);
  
  // Circuit breaker state
  const [failureCount, setFailureCount] = useState(0);
  const consecutiveFailuresRef = useRef(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create instances of our architecture components
  const excalidrawAdapter = React.useMemo(() => new ExcalidrawAdapter(), []);
  const fileSystemAdapter = React.useMemo(() => new SocketFileSystemAdapter(), []);
  const eventBus = React.useMemo(() => new SimpleEventBus(), []);
  const structureManager = React.useMemo(
    () => new SimpleStructureManager(excalidrawAdapter, fileSystemAdapter, eventBus),
    [excalidrawAdapter, fileSystemAdapter, eventBus]
  );

  // Initialize the components when they're created
  useEffect(() => {
    const initSync = async () => {
      try {
        console.log('SyncContext: Initializing sync system');
        
        // Initialize file system adapter
        await fileSystemAdapter.initialize();
        
        // Listen for socket reconnection events
        socket.on('connect', handleSocketReconnect);
        socket.on('disconnect', handleSocketDisconnect);
        
        // Initialize structure manager with WebSocket-only sync option
        await structureManager.initialize({
          bidirectional: true,
          conflictResolution: 'latest-wins',
          autoSync: false, // No timers
          syncInterval: 0   // Not used
        });

        // Listen for sync status changes
        structureManager.subscribe(handleSyncEvent);
        
        setSyncStatus({
          ...syncStatus,
          isActive: true
        });
        
        console.log('SyncContext: Sync system initialized');
      } catch (error) {
        console.error('SyncContext: Failed to initialize sync', error);
        setSyncError(error instanceof Error ? error : new Error('Failed to initialize sync'));
        setFailureCount(prev => prev + 1);
      }
    };

    initSync();
    
    return () => {
      // Clean up any active timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      // Clean up socket listeners
      socket.off('connect', handleSocketReconnect);
      socket.off('disconnect', handleSocketDisconnect);
      
      console.log('SyncContext: Cleaned up');
    };
  }, [fileSystemAdapter, structureManager]);

  // Handle socket reconnection
  const handleSocketReconnect = () => {
    console.log('SyncContext: Socket reconnected');
    // Reset circuit breaker on successful reconnection
    consecutiveFailuresRef.current = 0;
    setFailureCount(0);
    
    // Force a sync to get the latest state
    forceSync();
  };
  
  const handleSocketDisconnect = () => {
    console.log('SyncContext: Socket disconnected');
    setSyncStatus({
      ...syncStatus,
      isActive: false
    });
  };
  
  // Handle sync events
  const handleSyncEvent = (event: SyncEvent) => {
    console.log('SyncContext: Sync event received', event.type);
    
    try {
      switch (event.type) {
        case 'syncStarted':
          setSyncStatus(prev => ({
            ...prev,
            pendingChanges: true
          }));
          break;
          
        case 'syncCompleted':
          // Reset circuit breaker on successful sync
          consecutiveFailuresRef.current = 0;
          setFailureCount(0);
          setSyncError(null);
          
          setSyncStatus({
            ...structureManager.getSyncStatus(),
            isActive: true
          });
          break;
          
        case 'syncFailed':
          // Increment failure count for circuit breaker
          consecutiveFailuresRef.current++;
          setFailureCount(prev => prev + 1);
          
          // If too many consecutive failures, delay next sync attempt
          if (consecutiveFailuresRef.current >= 3) {
            const backoffTime = Math.min(2000 * Math.pow(2, consecutiveFailuresRef.current - 3), 30000);
            console.warn(`SyncContext: Too many failures, backing off for ${backoffTime}ms`);
            
            setSyncStatus(prev => ({
              ...prev,
              isActive: false
            }));
            
            // Reactivate after backoff period
            if (syncTimeoutRef.current) {
              clearTimeout(syncTimeoutRef.current);
            }
            syncTimeoutRef.current = setTimeout(() => {
              setSyncStatus(prev => ({
                ...prev,
                isActive: true
              }));
              syncTimeoutRef.current = null;
            }, backoffTime);
          }
          
          setSyncError(new Error(`Sync failed: ${event.details.error?.message || 'Unknown error'}`));
          break;
      }
    } catch (error) {
      console.error('SyncContext: Error handling sync event', error);
    }
  };

  // Set the Excalidraw API when it becomes available
  const setExcalidrawAPI = (api: ExcalidrawImperativeAPI) => {
    try {
      excalidrawAdapter.setExcalidrawAPI(api);
      console.log('SyncContext: Excalidraw API set');
      
      // Initial sync after API is set
      setTimeout(() => {
        forceSync().catch(console.error);
      }, 500);
    } catch (error) {
      console.error('SyncContext: Error setting Excalidraw API', error);
      setSyncError(error instanceof Error ? error : new Error('Failed to set Excalidraw API'));
    }
  };

  // Force sync method for manual triggers - with additional safeguards
  const forceSync = async () => {
    // Don't attempt sync if we're in circuit breaker mode
    if (failureCount >= 5) {
      console.warn('SyncContext: Too many failures, sync is disabled');
      return;
    }
    
    try {
      await structureManager.forceSync();
    } catch (error) {
      console.error('SyncContext: Force sync failed', error);
      setSyncError(error instanceof Error ? error : new Error('Force sync failed'));
      setFailureCount(prev => prev + 1);
    }
  };
  
  // Reset sync system if it gets into a bad state
  const resetSync = () => {
    console.log('SyncContext: Resetting sync system');
    
    // Reset circuit breaker
    consecutiveFailuresRef.current = 0;
    setFailureCount(0);
    setSyncError(null);
    
    // Reset sync status
    setSyncStatus({
      isActive: true,
      lastSyncTime: null,
      pendingChanges: false,
      conflicts: []
    });
    
    // Force a sync after reset
    setTimeout(() => {
      forceSync().catch(console.error);
    }, 500);
  };

  return (
    <SyncContext.Provider
      value={{
        excalidrawAdapter,
        fileSystemAdapter,
        structureManager,
        eventBus,
        syncStatus,
        setExcalidrawAPI,
        forceSync,
        resetSync,
        syncError
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};
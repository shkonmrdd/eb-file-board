import React from 'react';
import { useSyncContext } from '../sync/SyncContext';
import '../styles/SyncStatusIndicator.css';

export const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, forceSync, resetSync, syncError } = useSyncContext();
  
  // Format the last sync time
  const getLastSyncText = () => {
    if (!syncStatus.lastSyncTime) return 'Never';
    
    const now = Date.now();
    const diff = now - syncStatus.lastSyncTime;
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else {
      const date = new Date(syncStatus.lastSyncTime);
      return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
  };
  
  return (
    <div className={`sync-status-indicator ${syncError ? 'has-error' : ''}`}>
      <div className={`status-dot ${syncStatus.isActive ? 'active' : 'inactive'}`}></div>
      <span className="status-text">
        {syncError ? 'Sync Error' : `Sync: ${syncStatus.isActive ? 'Active' : 'Inactive'}`}
        {syncStatus.lastSyncTime && ` • Last: ${getLastSyncText()}`}
        {syncStatus.pendingChanges && ' • Changes pending'}
      </span>
      
      {/* Show different buttons based on state */}
      {syncError ? (
        <div className="button-group">
          <button 
            className="sync-button retry"
            onClick={forceSync}
            title={syncError.message}
          >
            Retry
          </button>
          <button 
            className="sync-button reset"
            onClick={resetSync}
            title="Reset sync system"
          >
            Reset
          </button>
        </div>
      ) : (
        <button 
          className="sync-button"
          onClick={forceSync}
          disabled={!syncStatus.isActive}
        >
          Sync Now
        </button>
      )}
    </div>
  );
};
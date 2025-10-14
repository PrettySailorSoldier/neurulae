import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { syncService } from '@/services/syncService';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setStatus('offline');
      return;
    }

    // Load last sync time
    syncService.getLastSyncTime().then(time => {
      setLastSyncTime(time);
      if (time) {
        setStatus('synced');
      }
    });

    // Check online status
    const handleOnline = () => setStatus('synced');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const manualSync = async () => {
    setStatus('syncing');
    setError(null);
    
    try {
      // Get all localStorage data
      const localData: Record<string, any> = {};
      const keys = ['tasks', 'projects', 'priorities', 'timeblocks', 'scheduledTasks', 
                    'playbooks', 'reminderWidgets', 'energyWidgets', 'messengerWidgets',
                    'moodGardenWidgets', 'parallelUniverseWidgets', 'soundSignatureWidgets',
                    'theme', 'customTheme', 'customTabs', 'timerSessions'];
      
      keys.forEach(key => {
        const item = localStorage.getItem(`neurulae-${key}`);
        if (item) {
          try {
            localData[key] = JSON.parse(item);
          } catch (e) {
            console.error(`Failed to parse ${key}:`, e);
          }
        }
      });

      const results = await syncService.syncAll(localData);
      const allSuccessful = results.every(r => r.success);
      
      if (allSuccessful) {
        setStatus('synced');
        const time = await syncService.getLastSyncTime();
        setLastSyncTime(time);
      } else {
        setStatus('error');
        setError('Some items failed to sync');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Sync failed');
    }
  };

  return {
    status,
    lastSyncTime,
    error,
    manualSync
  };
}

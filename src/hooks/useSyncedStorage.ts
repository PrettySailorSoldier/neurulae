import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { syncService, DataType } from '@/services/syncService';

interface SyncOptions {
  syncEnabled?: boolean;
  onSyncError?: (error: string) => void;
}

/**
 * Convert a localStorage key to the database DataType enum format
 * e.g., 'neurulae-scheduled-tasks' -> 'scheduledTasks'
 */
function toDataType(key: string): DataType {
  // Remove 'neurulae-' prefix
  const stripped = key.replace('neurulae-', '');
  
  // Convert hyphenated-case to camelCase
  // e.g., 'scheduled-tasks' -> 'scheduledTasks'
  const camelCase = stripped.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  
  return camelCase as DataType;
}

export function useSyncedStorage<T>(
  key: string,
  initialValue: T,
  options: SyncOptions = { syncEnabled: true }
) {
  const [value, setValue] = useLocalStorage<T>(key, initialValue);
  const { user, session } = useAuth();
  const isFirstRender = useRef(true);

  // Queue sync when value changes and user is authenticated
  useEffect(() => {
    // Skip syncing on first render to avoid uploading default/loaded values
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (user && session && options.syncEnabled) {
      const dataType = toDataType(key);
      console.debug(`[Sync] Queuing sync for key "${key}" as dataType "${dataType}"`);
      syncService.queueSync(dataType, value);
    }
  }, [value, user, session, options.syncEnabled, key]);

  return [value, setValue] as const;
}

import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { syncService, DataType } from '@/services/syncService';

interface SyncOptions {
  syncEnabled?: boolean;
  onSyncError?: (error: string) => void;
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
      // Remove 'neurulae-' prefix to get the data type
      const dataType = key.replace('neurulae-', '') as DataType;
      syncService.queueSync(dataType, value);
    }
  }, [value, user, session, options.syncEnabled, key]);

  return [value, setValue] as const;
}

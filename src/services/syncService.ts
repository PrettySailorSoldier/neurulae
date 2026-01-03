import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from './deviceManager';

export type DataType =
  | 'tasks' | 'projects' | 'priorities' | 'timeblocks'
  | 'scheduledTasks' | 'playbooks' | 'reminderWidgets'
  | 'energyWidgets' | 'messengerWidgets' | 'moodGardenWidgets'
  | 'parallelUniverseWidgets' | 'soundSignatureWidgets'
  | 'theme' | 'customTheme' | 'customTabs' | 'timerSessions'
  // ND features
  | 'anchorPoints' | 'routineVariants' | 'ndOnboarding'
  | 'patternInsights' | 'aiPersonality';

interface SyncResult {
  success: boolean;
  error?: string;
  cloudData?: any;
  localData?: any;
}

class SyncService {
  private syncQueue: Map<DataType, any> = new Map();
  private syncTimeout: NodeJS.Timeout | null = null;
  private isSyncing = false;

  // Upload local data to cloud
  async uploadToCloud(dataType: DataType, data: any): Promise<SyncResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.debug(`[Sync] Upload skipped - not authenticated`);
        return { success: false, error: 'Not authenticated' };
      }

      const deviceId = getDeviceId();
      console.debug(`[Sync] Uploading dataType="${dataType}" for user=${user.id.substring(0, 8)}...`);
      
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          data_type: dataType,
          data: data,
          device_id: deviceId,
          last_modified: new Date().toISOString()
        }, {
          onConflict: 'user_id,data_type'
        });

      if (error) {
        console.error(`[Sync] Upload failed for dataType="${dataType}":`, error);
        throw error;
      }

      // Update sync metadata
      await supabase
        .from('sync_metadata')
        .upsert({
          user_id: user.id,
          device_id: deviceId,
          last_sync_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,device_id'
        });

      console.debug(`[Sync] Upload success for dataType="${dataType}"`);
      return { success: true };
    } catch (error: any) {
      console.error('[Sync] Upload to cloud failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Download data from cloud
  async downloadFromCloud(dataType: DataType): Promise<SyncResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_data')
        .select('data, last_modified, sync_version')
        .eq('user_id', user.id)
        .eq('data_type', dataType)
        .maybeSingle();

      if (error) throw error;

      return { 
        success: true, 
        cloudData: data?.data,
        localData: null 
      };
    } catch (error: any) {
      console.error('Download from cloud failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Queue a sync operation (debounced)
  queueSync(dataType: DataType, data: any) {
    this.syncQueue.set(dataType, data);
    
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.processSyncQueue();
    }, 2000); // 2 second debounce
  }

  // Process all queued syncs
  private async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.size === 0) return;

    this.isSyncing = true;
    const entries = Array.from(this.syncQueue.entries());
    this.syncQueue.clear();

    for (const [dataType, data] of entries) {
      await this.uploadToCloud(dataType, data);
    }

    this.isSyncing = false;
  }

  // Sync all data types
  async syncAll(localData: Record<string, any>): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    for (const [key, value] of Object.entries(localData)) {
      const result = await this.uploadToCloud(key as DataType, value);
      results.push(result);
    }

    return results;
  }

  // Get last sync timestamp
  async getLastSyncTime(): Promise<Date | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const deviceId = getDeviceId();
      
      const { data, error } = await supabase
        .from('sync_metadata')
        .select('last_sync_timestamp')
        .eq('user_id', user.id)
        .eq('device_id', deviceId)
        .maybeSingle();

      if (error || !data?.last_sync_timestamp) return null;

      return new Date(data.last_sync_timestamp);
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  // Initial sync on login - upload all local data
  async initialSync(localData: Record<string, any>): Promise<boolean> {
    try {
      console.log('Starting initial sync...');
      const results = await this.syncAll(localData);
      const allSuccessful = results.every(r => r.success);
      
      if (allSuccessful) {
        console.log('Initial sync completed successfully');
      } else {
        console.warn('Some items failed to sync:', results.filter(r => !r.success));
      }
      
      return allSuccessful;
    } catch (error) {
      console.error('Initial sync failed:', error);
      return false;
    }
  }

  // Download all data from cloud (for new device login)
  async downloadAll(): Promise<Record<string, any>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await supabase
        .from('user_data')
        .select('data_type, data')
        .eq('user_id', user.id);

      if (error) throw error;

      const cloudData: Record<string, any> = {};
      data?.forEach(item => {
        cloudData[item.data_type] = item.data;
      });

      return cloudData;
    } catch (error) {
      console.error('Download all failed:', error);
      return {};
    }
  }
}

export const syncService = new SyncService();

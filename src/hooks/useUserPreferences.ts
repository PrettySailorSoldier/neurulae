import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CustomTheme } from '@/types';
import { toast } from 'sonner';

interface UserPreferences {
  customTheme?: CustomTheme | null;
  theme?: string;
  enableActiveIntentionBanner?: boolean; // Default: true - shows persistent banner for current active task
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  const inFlightRequest = useRef(false);
  const failureCount = useRef(0);
  const lastFailureTime = useRef<number>(0);
  const backoffDelay = useRef(0);

  // Load preferences from database
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Prevent duplicate load requests
    if (inFlightRequest.current) {
      console.warn('Load preferences already in flight, skipping');
      return;
    }

    const loadPreferences = async () => {
      inFlightRequest.current = true;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data?.preferences) {
          setPreferences(data.preferences as UserPreferences);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
        inFlightRequest.current = false;
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences with deduplication and exponential backoff
  const savePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;

    // Prevent duplicate save requests
    if (inFlightRequest.current) {
      console.warn('Save preferences already in flight, skipping');
      return;
    }

    // Check if we're in backoff period
    const now = Date.now();
    if (backoffDelay.current > 0 && now - lastFailureTime.current < backoffDelay.current) {
      console.warn('In backoff period, skipping save');
      return;
    }

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    inFlightRequest.current = true;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences as any })
        .eq('id', user.id);

      if (error) throw error;

      // Reset failure tracking on success
      failureCount.current = 0;
      backoffDelay.current = 0;
    } catch (error) {
      console.error('Error saving preferences:', error);
      
      // Increment failure count and calculate backoff
      failureCount.current += 1;
      lastFailureTime.current = now;

      if (failureCount.current === 1) {
        backoffDelay.current = 5000; // 5 seconds
        toast.error('Sync paused (Server busy). Retrying in 5s...');
      } else if (failureCount.current === 2) {
        backoffDelay.current = 15000; // 15 seconds
        toast.error('Sync paused (Server busy). Retrying in 15s...');
      } else {
        // After 3 failures, stop retrying
        backoffDelay.current = Infinity;
        toast.error('Sync paused (Server overloaded). Please try again later.');
      }
    } finally {
      inFlightRequest.current = false;
    }
  }, [user, preferences]);

  return {
    preferences,
    savePreferences,
    loading,
  };
}

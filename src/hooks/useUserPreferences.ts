import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CustomTheme } from '@/types';

interface UserPreferences {
  customTheme?: CustomTheme | null;
  theme?: string;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);

  // Load preferences from database
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
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
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences to database
  const savePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences as any })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [user, preferences]);

  return {
    preferences,
    savePreferences,
    loading,
  };
}

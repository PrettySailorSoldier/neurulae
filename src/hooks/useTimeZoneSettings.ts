import { useLocalStorage } from './useLocalStorage';
import { TimeZoneSettings } from '@/types';

const DEFAULT_SETTINGS: TimeZoneSettings = {
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '07:00',
  },
  businessHours: {
    enabled: true,
    startTime: '08:00',
    endTime: '17:00',
    weekdaysOnly: true,
  },
  customZones: [],
};

export function useTimeZoneSettings() {
  const [settings, setSettings] = useLocalStorage<TimeZoneSettings>(
    'timeZoneSettings',
    DEFAULT_SETTINGS
  );

  const updateQuietHours = (updates: Partial<TimeZoneSettings['quietHours']>) => {
    setSettings({
      ...settings,
      quietHours: {
        ...settings.quietHours,
        ...updates,
      },
    });
  };

  const updateBusinessHours = (updates: Partial<TimeZoneSettings['businessHours']>) => {
    setSettings({
      ...settings,
      businessHours: {
        ...settings.businessHours,
        ...updates,
      },
    });
  };

  const addCustomZone = (zone: TimeZoneSettings['customZones'][0]) => {
    setSettings({
      ...settings,
      customZones: [...settings.customZones, zone],
    });
  };

  const updateCustomZone = (id: string, updates: Partial<TimeZoneSettings['customZones'][0]>) => {
    setSettings({
      ...settings,
      customZones: settings.customZones.map((zone) =>
        zone.id === id ? { ...zone, ...updates } : zone
      ),
    });
  };

  const deleteCustomZone = (id: string) => {
    setSettings({
      ...settings,
      customZones: settings.customZones.filter((zone) => zone.id !== id),
    });
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    setSettings,
    updateQuietHours,
    updateBusinessHours,
    addCustomZone,
    updateCustomZone,
    deleteCustomZone,
    resetToDefaults,
  };
}

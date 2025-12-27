import { Bell, Clock, Volume2, Vibrate, Timer, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RoutineSettings, ROUTINE_STORAGE_KEYS } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const DEFAULT_SETTINGS: RoutineSettings = {
  enableNotifications: true,
  reminderMinutesBefore: 15,
  showOverdueReminders: true,
  autoStartOnTime: false,
  defaultBufferMinutes: 5,
  soundEnabled: true,
  vibrationEnabled: true,
};

export function RoutineSettingsPanel() {
  const [settings, setSettings] = useLocalStorage<RoutineSettings>(
    ROUTINE_STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );

  const updateSetting = <K extends keyof RoutineSettings>(
    key: K,
    value: RoutineSettings[K]
  ) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Routine Settings
        </CardTitle>
        <CardDescription>
          Configure how routines behave and notify you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notifications Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </h4>

          <div className="space-y-4 pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-notifications">Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get reminded when routines are about to start
                </p>
              </div>
              <Switch
                id="enable-notifications"
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
              />
            </div>

            {settings.enableNotifications && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Reminder Time</Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.reminderMinutesBefore} min before
                    </span>
                  </div>
                  <Slider
                    value={[settings.reminderMinutesBefore]}
                    onValueChange={([value]) => updateSetting('reminderMinutesBefore', value)}
                    min={5}
                    max={60}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    How early to remind you before a scheduled routine
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="overdue-reminders">Overdue Reminders</Label>
                    <p className="text-xs text-muted-foreground">
                      Notify when you miss a scheduled routine
                    </p>
                  </div>
                  <Switch
                    id="overdue-reminders"
                    checked={settings.showOverdueReminders}
                    onCheckedChange={(checked) => updateSetting('showOverdueReminders', checked)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sound & Haptics Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Sound & Haptics
          </h4>

          <div className="space-y-4 pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-enabled">Sound Effects</Label>
                <p className="text-xs text-muted-foreground">
                  Play sounds for step completion and alerts
                </p>
              </div>
              <Switch
                id="sound-enabled"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="vibration-enabled" className="flex items-center gap-2">
                  <Vibrate className="h-3 w-3" />
                  Vibration
                </Label>
                <p className="text-xs text-muted-foreground">
                  Vibrate on step completion (mobile only)
                </p>
              </div>
              <Switch
                id="vibration-enabled"
                checked={settings.vibrationEnabled}
                onCheckedChange={(checked) => updateSetting('vibrationEnabled', checked)}
              />
            </div>
          </div>
        </div>

        {/* Timing Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timing
          </h4>

          <div className="space-y-4 pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-start">Auto-Start Routines</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically start routines at their scheduled time
                </p>
              </div>
              <Switch
                id="auto-start"
                checked={settings.autoStartOnTime}
                onCheckedChange={(checked) => updateSetting('autoStartOnTime', checked)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Default Buffer Time</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.defaultBufferMinutes} min
                </span>
              </div>
              <Slider
                value={[settings.defaultBufferMinutes]}
                onValueChange={([value]) => updateSetting('defaultBufferMinutes', value)}
                min={0}
                max={30}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Extra buffer time added to estimated durations (for ADHD-friendly scheduling)
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Tip: If you have ADHD, we recommend keeping buffer times enabled and set to 5-10 minutes.
            This helps account for transition time between activities.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export { DEFAULT_SETTINGS as DEFAULT_ROUTINE_SETTINGS };

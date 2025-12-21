import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Moon, Briefcase, Plus, Trash2, Clock } from 'lucide-react';
import { TimeZoneSettings, TimeZone } from '@/types';
import { formatTimeDisplay } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';

interface TimeZoneSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: TimeZoneSettings;
  onSave: (settings: TimeZoneSettings) => void;
}

export function TimeZoneSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: TimeZoneSettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<TimeZoneSettings>(settings);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneStart, setNewZoneStart] = useState('12:00');
  const [newZoneEnd, setNewZoneEnd] = useState('14:00');

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  const updateQuietHours = (updates: Partial<TimeZoneSettings['quietHours']>) => {
    setLocalSettings({
      ...localSettings,
      quietHours: { ...localSettings.quietHours, ...updates },
    });
  };

  const updateBusinessHours = (updates: Partial<TimeZoneSettings['businessHours']>) => {
    setLocalSettings({
      ...localSettings,
      businessHours: { ...localSettings.businessHours, ...updates },
    });
  };

  const addCustomZone = () => {
    if (!newZoneName.trim()) return;

    const newZone: TimeZone = {
      id: crypto.randomUUID(),
      name: newZoneName,
      startTime: newZoneStart,
      endTime: newZoneEnd,
      color: 'hsl(var(--accent) / 0.2)',
    };

    setLocalSettings({
      ...localSettings,
      customZones: [...localSettings.customZones, newZone],
    });

    setNewZoneName('');
    setNewZoneStart('12:00');
    setNewZoneEnd('14:00');
  };

  const deleteCustomZone = (id: string) => {
    setLocalSettings({
      ...localSettings,
      customZones: localSettings.customZones.filter(z => z.id !== id),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Zone Settings
          </DialogTitle>
          <DialogDescription>
            Configure time zones to help organize your tasks based on when they can be done.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quiet Hours */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="font-semibold text-sm">Quiet Hours</h4>
                  <p className="text-xs text-muted-foreground">
                    Noisy tasks won't be suggested during this time
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.quietHours.enabled}
                onCheckedChange={(enabled) => updateQuietHours({ enabled })}
              />
            </div>

            {localSettings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-1">
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={localSettings.quietHours.startTime}
                    onChange={(e) => updateQuietHours({ startTime: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Time</Label>
                  <Input
                    type="time"
                    value={localSettings.quietHours.endTime}
                    onChange={(e) => updateQuietHours({ endTime: e.target.value })}
                    className="h-8"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Business Hours */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="font-semibold text-sm">Business Hours</h4>
                  <p className="text-xs text-muted-foreground">
                    Phone calls and appointments are best during this time
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.businessHours.enabled}
                onCheckedChange={(enabled) => updateBusinessHours({ enabled })}
              />
            </div>

            {localSettings.businessHours.enabled && (
              <div className="space-y-3 pl-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={localSettings.businessHours.startTime}
                      onChange={(e) => updateBusinessHours({ startTime: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Time</Label>
                    <Input
                      type="time"
                      value={localSettings.businessHours.endTime}
                      onChange={(e) => updateBusinessHours({ endTime: e.target.value })}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="weekdays-only"
                    checked={localSettings.businessHours.weekdaysOnly}
                    onCheckedChange={(weekdaysOnly) => updateBusinessHours({ weekdaysOnly })}
                  />
                  <Label htmlFor="weekdays-only" className="text-xs">
                    Weekdays only (Mon-Fri)
                  </Label>
                </div>
              </div>
            )}
          </Card>

          {/* Custom Zones */}
          <Card className="p-4 space-y-4">
            <div>
              <h4 className="font-semibold text-sm">Custom Time Zones</h4>
              <p className="text-xs text-muted-foreground">
                Create your own time zones for specific activities
              </p>
            </div>

            {/* Existing custom zones */}
            {localSettings.customZones.length > 0 && (
              <div className="space-y-2">
                {localSettings.customZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-sm font-medium">{zone.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {formatTimeDisplay(zone.startTime)} - {formatTimeDisplay(zone.endTime)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => deleteCustomZone(zone.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new zone */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs">Add New Zone</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Zone name..."
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="h-8 flex-1"
                />
                <Input
                  type="time"
                  value={newZoneStart}
                  onChange={(e) => setNewZoneStart(e.target.value)}
                  className="h-8 w-24"
                />
                <span className="flex items-center text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={newZoneEnd}
                  onChange={(e) => setNewZoneEnd(e.target.value)}
                  className="h-8 w-24"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={addCustomZone}
                  disabled={!newZoneName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

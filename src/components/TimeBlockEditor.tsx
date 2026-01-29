import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeBlock } from '@/types';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface TimeBlockEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block?: TimeBlock;
  onSave: (block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onDelete?: () => void;
}

export function TimeBlockEditor({ open, onOpenChange, block, onSave, onDelete }: TimeBlockEditorProps) {
  const [title, setTitle] = useState(block?.title || '');
  const [startTime, setStartTime] = useState(block?.startTime || '09:00');
  const [endTime, setEndTime] = useState(block?.endTime || '17:00');
  const [type, setType] = useState<'main' | 'dedicated'>(block?.type || 'main');
  const [scheduleType, setScheduleType] = useState<'weekday' | 'weekend' | 'everyday' | 'today'>(block?.scheduleType || 'everyday');
  const [color, setColor] = useState(block?.color || '');

  // Sync state when block prop changes (fixes edit bug where wrong block data was shown)
  useEffect(() => {
    if (open) {
      if (block) {
        setTitle(block.title || '');
        setStartTime(block.startTime || '09:00');
        setEndTime(block.endTime || '17:00');
        setType(block.type || 'main');
        setScheduleType(block.scheduleType || 'everyday');
        setColor(block.color || '');
      } else {
        // Reset to defaults for new block
        setTitle('');
        setStartTime('09:00');
        setEndTime('17:00');
        setType('main');
        setScheduleType('everyday');
        setColor('');
      }
    }
  }, [block, open]);

  const handleSave = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    onSave({
      title,
      startTime,
      endTime,
      type,
      scheduleType,
      // Include scheduledDate for 'today' type blocks
      scheduledDate: scheduleType === 'today' ? today : undefined,
      color: color || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{block ? 'Edit Time Block' : 'Create Time Block'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Block Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep Work, Morning Routine"
              className="bg-input border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-input border-border"
              />
            </div>
          </div>
          
          {/* Duration display */}
          {startTime && endTime && (() => {
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
            if (diffMins < 0) diffMins += 24 * 60; // Handle overnight
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            const durationText = hours > 0 
              ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`)
              : `${mins}m`;
            return (
              <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-md py-1.5">
                Duration: <span className="font-medium text-foreground">{durationText}</span>
              </div>
            );
          })()}

          <div>
            <Label htmlFor="type">Block Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'main' | 'dedicated')}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main (Left Side)</SelectItem>
                <SelectItem value="dedicated">Dedicated (Right Side)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scheduleType">When to Show</Label>
            <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as any)}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today Only (One-time)</SelectItem>
                <SelectItem value="everyday">Daily (Every Day)</SelectItem>
                <SelectItem value="weekday">Weekdays Only</SelectItem>
                <SelectItem value="weekend">Weekends Only</SelectItem>
              </SelectContent>
            </Select>
            {scheduleType === 'today' && (
              <p className="text-xs text-muted-foreground mt-1">
                This block will only appear today and won't repeat.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="color">Custom Color (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color || '#ec4899'}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10 bg-input border-border"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Hex color"
                className="flex-1 bg-input border-border"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">
              Save Block
            </Button>
            {block && onDelete && (
              <Button onClick={onDelete} variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimePicker } from '@/components/ui/time-picker';
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

  // Sync state when block prop changes
  // CRITICAL: Using block?.id as dependency ensures React detects when a DIFFERENT block is clicked
  // Previously used [block, open] but object reference comparison failed to trigger re-sync
  useEffect(() => {
    if (open) {
      if (block) {
        // Editing existing block - load its data
        console.log('[TimeBlockEditor] Loading block for edit:', block.id, block.title);
        setTitle(block.title || '');
        setStartTime(block.startTime || '09:00');
        setEndTime(block.endTime || '17:00');
        setType(block.type || 'main');
        setScheduleType(block.scheduleType || 'everyday');
        setColor(block.color || '');
      } else {
        // Smart defaults for new block
        console.log('[TimeBlockEditor] Creating new block with smart defaults');
        const now = new Date();
        // Round to next 15-minute interval
        const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15;
        const smartStart = new Date(now);
        smartStart.setMinutes(roundedMinutes, 0, 0);
        if (roundedMinutes >= 60) {
          smartStart.setHours(smartStart.getHours() + 1);
          smartStart.setMinutes(0);
        }
        
        // End time is 1 hour after start
        const smartEnd = new Date(smartStart.getTime() + 60 * 60 * 1000);
        
        // Format as HH:mm
        const formatTimeValue = (date: Date) => {
          const h = date.getHours().toString().padStart(2, '0');
          const m = date.getMinutes().toString().padStart(2, '0');
          return `${h}:${m}`;
        };
        
        setTitle('');
        setStartTime(formatTimeValue(smartStart));
        setEndTime(formatTimeValue(smartEnd));
        
        // Remember last-used type and color from localStorage
        const lastType = localStorage.getItem('neurulae_last_block_type');
        const lastColor = localStorage.getItem('neurulae_last_block_color');
        setType((lastType as 'main' | 'dedicated') || 'main');
        setColor(lastColor || '');
        setScheduleType('today'); // Default to today for quick one-off blocks
      }
    }
  }, [block?.id, open]);

  const handleSave = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Remember preferences for next time
    localStorage.setItem('neurulae_last_block_type', type);
    if (color) {
      localStorage.setItem('neurulae_last_block_color', color);
    }
    
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
            <TimePicker
              label="Start Time"
              value={startTime}
              onChange={(time) => {
                setStartTime(time);
                // Auto-adjust end time if it would be before start
                const parseToMinutes = (t: string) => {
                  const [h, m] = t.split(':').map(Number);
                  return h * 60 + m;
                };
                if (endTime && parseToMinutes(time) >= parseToMinutes(endTime)) {
                  // Set end time to 1 hour after new start
                  const [h, m] = time.split(':').map(Number);
                  const endH = (h + 1) % 24;
                  setEndTime(`${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                }
              }}
            />
            <TimePicker
              label="End Time"
              value={endTime}
              onChange={setEndTime}
            />
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
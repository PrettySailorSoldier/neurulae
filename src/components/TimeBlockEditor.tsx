import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeBlock } from '@/types';
import { Trash2 } from 'lucide-react';

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
  const [scheduleType, setScheduleType] = useState<'weekday' | 'weekend' | 'everyday'>(block?.scheduleType || 'everyday');
  const [color, setColor] = useState(block?.color || '');

  const handleSave = () => {
    onSave({
      title,
      startTime,
      endTime,
      type,
      scheduleType,
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
                <SelectItem value="everyday">Every Day</SelectItem>
                <SelectItem value="weekday">Weekdays Only</SelectItem>
                <SelectItem value="weekend">Weekends Only</SelectItem>
              </SelectContent>
            </Select>
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
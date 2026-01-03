import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnchorPoint } from '@/types';
import { Clock, Calendar, Sun, Sunset, Moon, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnchorPointEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor?: AnchorPoint | null;
  onSave: (anchor: Omit<AnchorPoint, 'id' | 'createdAt'>) => void;
}

const CATEGORIES = [
  { id: 'morning', label: 'Morning', icon: Sun, description: 'Early day activities' },
  { id: 'midday', label: 'Midday', icon: Zap, description: 'Afternoon activities' },
  { id: 'evening', label: 'Evening', icon: Sunset, description: 'End of day activities' },
  { id: 'flex', label: 'Flexible', icon: Moon, description: 'Varies by day' },
] as const;

const RELIABILITIES = [
  { id: 'rock-solid', label: 'Rock solid', description: 'Happens almost every day without fail' },
  { id: 'usually', label: 'Usually', description: 'Most days, but sometimes skipped' },
  { id: 'sometimes', label: 'Sometimes', description: 'Happens when I remember or have time' },
] as const;

export function AnchorPointEditor({
  open,
  onOpenChange,
  anchor,
  onSave,
}: AnchorPointEditorProps) {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<'time' | 'event'>('time');
  const [triggerTime, setTriggerTime] = useState('08:00');
  const [triggerEvent, setTriggerEvent] = useState('');
  const [reliability, setReliability] = useState<AnchorPoint['reliability']>('usually');
  const [category, setCategory] = useState<AnchorPoint['category']>('morning');
  const [attachmentPosition, setAttachmentPosition] = useState<'before' | 'after'>('after');

  // Reset form when anchor changes or dialog opens
  useEffect(() => {
    if (anchor) {
      setName(anchor.name);
      setTriggerType(anchor.triggerType);
      setTriggerTime(anchor.triggerTime || '08:00');
      setTriggerEvent(anchor.triggerEvent || '');
      setReliability(anchor.reliability);
      setCategory(anchor.category);
      setAttachmentPosition(anchor.attachmentPosition);
    } else {
      // Reset to defaults for new anchor
      setName('');
      setTriggerType('time');
      setTriggerTime('08:00');
      setTriggerEvent('');
      setReliability('usually');
      setCategory('morning');
      setAttachmentPosition('after');
    }
  }, [anchor, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (triggerType === 'time' && !triggerTime) return;
    if (triggerType === 'event' && !triggerEvent.trim()) return;

    onSave({
      name: name.trim(),
      triggerType,
      triggerTime: triggerType === 'time' ? triggerTime : undefined,
      triggerEvent: triggerType === 'event' ? triggerEvent.trim() : undefined,
      reliability,
      category,
      attachmentPosition,
      linkedRoutineIds: anchor?.linkedRoutineIds || [],
      isActive: anchor?.isActive ?? true,
    });

    onOpenChange(false);
  };

  const isEditing = !!anchor;
  const canSave = name.trim() && (triggerType === 'time' ? triggerTime : triggerEvent.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Anchor Point' : 'Create Anchor Point'}</DialogTitle>
          <DialogDescription>
            Anchor points are reliable moments in your day that routines can attach to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="anchor-name">Name</Label>
            <Input
              id="anchor-name"
              placeholder="e.g., Morning coffee, After lunch, When kids leave"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Trigger Type */}
          <div className="space-y-3">
            <Label>Trigger Type</Label>
            <RadioGroup
              value={triggerType}
              onValueChange={(v) => setTriggerType(v as 'time' | 'event')}
              className="grid grid-cols-2 gap-3"
            >
              <div
                className={cn(
                  'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                  triggerType === 'time' ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                )}
                onClick={() => setTriggerType('time')}
              >
                <RadioGroupItem value="time" id="time" />
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="time" className="cursor-pointer font-normal">
                    At a specific time
                  </Label>
                </div>
              </div>
              <div
                className={cn(
                  'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                  triggerType === 'event' ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                )}
                onClick={() => setTriggerType('event')}
              >
                <RadioGroupItem value="event" id="event" />
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="event" className="cursor-pointer font-normal">
                    After an event
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {/* Trigger Value */}
            {triggerType === 'time' ? (
              <Input
                type="time"
                value={triggerTime}
                onChange={(e) => setTriggerTime(e.target.value)}
                className="w-full"
              />
            ) : (
              <Input
                placeholder="e.g., After morning coffee, When partner leaves"
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
              />
            )}
          </div>

          {/* Reliability */}
          <div className="space-y-3">
            <Label>How reliable is this?</Label>
            <RadioGroup
              value={reliability}
              onValueChange={(v) => setReliability(v as AnchorPoint['reliability'])}
              className="space-y-2"
            >
              {RELIABILITIES.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                    reliability === r.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                  )}
                  onClick={() => setReliability(r.id)}
                >
                  <RadioGroupItem value={r.id} id={r.id} className="mt-0.5" />
                  <div>
                    <Label htmlFor={r.id} className="cursor-pointer font-medium">
                      {r.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as AnchorPoint['category'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{c.label}</span>
                        <span className="text-muted-foreground">- {c.description}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Attachment Position */}
          <div className="space-y-3">
            <Label>When should routines run?</Label>
            <RadioGroup
              value={attachmentPosition}
              onValueChange={(v) => setAttachmentPosition(v as 'before' | 'after')}
              className="grid grid-cols-2 gap-3"
            >
              <div
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-colors text-center',
                  attachmentPosition === 'before' ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                )}
                onClick={() => setAttachmentPosition('before')}
              >
                <RadioGroupItem value="before" id="before" className="sr-only" />
                <Label htmlFor="before" className="cursor-pointer">
                  <span className="font-medium">Before</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Routine runs leading up to this anchor
                  </p>
                </Label>
              </div>
              <div
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-colors text-center',
                  attachmentPosition === 'after' ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                )}
                onClick={() => setAttachmentPosition('after')}
              >
                <RadioGroupItem value="after" id="after" className="sr-only" />
                <Label htmlFor="after" className="cursor-pointer">
                  <span className="font-medium">After</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Routine starts after this anchor happens
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEditing ? 'Save Changes' : 'Create Anchor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { TimeBlock } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface QuickAddBlockProps {
  onAddBlock: (block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
}

// Parse natural language time inputs like:
// "work 2-5pm" → Work block from 2pm to 5pm
// "meeting at 3pm for 1 hour" → Meeting from 3pm to 4pm
// "focus 10:30am to 12pm" → Focus from 10:30am to 12pm
// "lunch 12-1" → Lunch from 12pm to 1pm (assumes pm for midday)
// "deep work" → Block starting now for 1 hour

function parseNaturalLanguage(input: string): Partial<TimeBlock> | null {
  const text = input.trim();
  if (!text) return null;

  const lower = text.toLowerCase();

  // Pattern: "title X-Ypm" or "title X-Y pm" (e.g., "work 2-5pm")
  const rangePattern = /^(.+?)\s+(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;
  let match = lower.match(rangePattern);
  if (match) {
    const title = capitalizeWords(match[1].trim());
    let startHour = parseInt(match[2]);
    const startMin = match[3] ? parseInt(match[3]) : 0;
    let endHour = parseInt(match[4]);
    const endMin = match[5] ? parseInt(match[5]) : 0;
    const period = (match[6] || 'pm').toLowerCase();

    // Convert to 24-hour format
    if (period === 'pm') {
      if (startHour < 12) startHour += 12;
      if (endHour < 12) endHour += 12;
    } else if (period === 'am') {
      if (startHour === 12) startHour = 0;
      if (endHour === 12) endHour = 0;
    }

    return {
      title,
      startTime: formatTime24(startHour, startMin),
      endTime: formatTime24(endHour, endMin),
      type: 'dedicated',
      scheduleType: 'today',
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    };
  }

  // Pattern: "title at Xpm for Y hours/minutes" (e.g., "meeting at 3pm for 1 hour")
  const atForPattern = /^(.+?)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s+for\s+(\d+)\s*(hour|hr|h|minute|min|m)s?$/i;
  match = lower.match(atForPattern);
  if (match) {
    const title = capitalizeWords(match[1].trim());
    let startHour = parseInt(match[2]);
    const startMin = match[3] ? parseInt(match[3]) : 0;
    const period = match[4].toLowerCase();
    const duration = parseInt(match[5]);
    const unit = match[6].toLowerCase();

    if (period === 'pm' && startHour < 12) startHour += 12;
    if (period === 'am' && startHour === 12) startHour = 0;

    let durationMins = duration;
    if (unit.startsWith('h')) durationMins = duration * 60;

    const startDate = new Date();
    startDate.setHours(startHour, startMin, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);

    return {
      title,
      startTime: formatTime24(startHour, startMin),
      endTime: formatTime24(endDate.getHours(), endDate.getMinutes()),
      type: 'dedicated',
      scheduleType: 'today',
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    };
  }

  // Pattern: "title Xam/pm to Yam/pm" (e.g., "focus 10:30am to 12pm")
  const toPattern = /^(.+?)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s+to\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i;
  match = lower.match(toPattern);
  if (match) {
    const title = capitalizeWords(match[1].trim());
    let startHour = parseInt(match[2]);
    const startMin = match[3] ? parseInt(match[3]) : 0;
    const startPeriod = match[4].toLowerCase();
    let endHour = parseInt(match[5]);
    const endMin = match[6] ? parseInt(match[6]) : 0;
    const endPeriod = match[7].toLowerCase();

    if (startPeriod === 'pm' && startHour < 12) startHour += 12;
    if (startPeriod === 'am' && startHour === 12) startHour = 0;
    if (endPeriod === 'pm' && endHour < 12) endHour += 12;
    if (endPeriod === 'am' && endHour === 12) endHour = 0;

    return {
      title,
      startTime: formatTime24(startHour, startMin),
      endTime: formatTime24(endHour, endMin),
      type: 'dedicated',
      scheduleType: 'today',
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    };
  }

  // Fallback: just a title - use current time + 1 hour
  if (text.length > 0) {
    const now = new Date();
    const roundedMins = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(roundedMins, 0, 0);
    if (roundedMins >= 60) {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
    }
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);

    return {
      title: capitalizeWords(text),
      startTime: formatTime24(now.getHours(), now.getMinutes()),
      endTime: formatTime24(endTime.getHours(), endTime.getMinutes()),
      type: 'dedicated',
      scheduleType: 'today',
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    };
  }

  return null;
}

function formatTime24(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return m > 0 ? `${hour12}:${m.toString().padStart(2, '0')} ${period}` : `${hour12} ${period}`;
}

export function QuickAddBlock({ onAddBlock }: QuickAddBlockProps) {
  const [input, setInput] = useState('');
  const { toast } = useToast();

  const parsedBlock = useMemo(() => parseNaturalLanguage(input), [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBlock && parsedBlock.title && parsedBlock.startTime && parsedBlock.endTime) {
      onAddBlock(parsedBlock as Omit<TimeBlock, 'id' | 'createdAt'>);
      setInput('');
      toast({
        title: 'Block created',
        description: `Added "${parsedBlock.title}" (${formatTimeDisplay(parsedBlock.startTime)} - ${formatTimeDisplay(parsedBlock.endTime)})`,
      });
    }
  };

  const isValid = parsedBlock && parsedBlock.title && parsedBlock.startTime && parsedBlock.endTime;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Quick add: "work 2-5pm" or "meeting at 3pm for 1hr"'
            className="pl-10 bg-muted/50 border-border focus:border-purple-500"
          />
        </div>
        <Button 
          type="submit" 
          disabled={!isValid}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Preview */}
      {isValid && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-purple-500/10 border border-purple-500/20 animate-in fade-in-50 slide-in-from-top-1">
          <span className="text-xs text-muted-foreground">Will create:</span>
          <span className="text-sm font-medium text-purple-400">{parsedBlock.title}</span>
          <span className="text-xs text-muted-foreground">
            {formatTimeDisplay(parsedBlock.startTime!)} - {formatTimeDisplay(parsedBlock.endTime!)}
          </span>
        </div>
      )}
    </form>
  );
}

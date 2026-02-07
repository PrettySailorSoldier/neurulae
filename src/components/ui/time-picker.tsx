import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string; // Format: "HH:mm" (24-hour)
  onChange: (time: string) => void;
  label?: string;
  className?: string;
}

// Convert 24h format to display parts
const parseTime = (timeStr: string): { hour: number; minute: number } => {
  if (!timeStr) return { hour: 12, minute: 0 };
  const [hourStr, minuteStr] = timeStr.split(':');
  return {
    hour: parseInt(hourStr) || 0,
    minute: parseInt(minuteStr) || 0
  };
};

// Format 24h time
const formatTime24 = (hour: number, minute: number): string => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Format for display (12-hour)
const formatDisplay = (timeStr: string): string => {
  if (!timeStr) return '--:--';
  const { hour, minute } = parseTime(timeStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { hour, minute } = parseTime(value);

  // Close picker when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const updateTime = (newHour: number, newMinute: number) => {
    // Wrap hour (0-23)
    if (newHour > 23) newHour = 0;
    if (newHour < 0) newHour = 23;
    // Wrap minute (0-59)
    if (newMinute >= 60) newMinute = 0;
    if (newMinute < 0) newMinute = 45;
    onChange(formatTime24(newHour, newMinute));
  };

  const adjustHour = (delta: number) => {
    updateTime(hour + delta, minute);
  };

  const adjustMinute = (delta: number) => {
    updateTime(hour, minute + delta);
  };

  // Quick time selections (in 24h format)
  const quickTimes = [
    { label: '9 AM', hour: 9, minute: 0 },
    { label: '12 PM', hour: 12, minute: 0 },
    { label: '3 PM', hour: 15, minute: 0 },
    { label: '6 PM', hour: 18, minute: 0 },
    { label: '9 PM', hour: 21, minute: 0 },
  ];

  const setQuickTime = (h: number, m: number) => {
    onChange(formatTime24(h, m));
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={pickerRef}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}
      
      <button
        type="button"
        className={cn(
          "w-full flex items-center justify-between gap-2",
          "px-3 py-2.5 rounded-lg",
          "bg-input border border-border",
          "text-sm text-foreground",
          "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20",
          "transition-all duration-200",
          isOpen && "border-primary ring-2 ring-primary/20"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Select time, current time is ${formatDisplay(value)}`}
      >
        <span className="font-medium tabular-nums">{formatDisplay(value)}</span>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div 
          className={cn(
            "absolute top-full left-0 right-0 mt-1.5 z-50",
            "bg-popover border border-border rounded-lg shadow-lg",
            "p-4 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )}
        >
          {/* Hour/Minute Controls */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* Hour Segment */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                onClick={() => adjustHour(1)}
                aria-label="Increase hour"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
              <div className="text-3xl font-bold tabular-nums text-foreground min-w-[50px] text-center py-1">
                {(hour % 12 || 12).toString().padStart(2, '0')}
              </div>
              <button
                type="button"
                className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                onClick={() => adjustHour(-1)}
                aria-label="Decrease hour"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            <span className="text-3xl font-bold text-muted-foreground">:</span>

            {/* Minute Segment */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                onClick={() => adjustMinute(15)}
                aria-label="Increase minutes by 15"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
              <div className="text-3xl font-bold tabular-nums text-foreground min-w-[50px] text-center py-1">
                {minute.toString().padStart(2, '0')}
              </div>
              <button
                type="button"
                className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                onClick={() => adjustMinute(-15)}
                aria-label="Decrease minutes by 15"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            {/* AM/PM Toggle */}
            <button
              type="button"
              className={cn(
                "ml-2 px-4 py-3 rounded-lg font-semibold text-lg",
                "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
                "transition-colors duration-200"
              )}
              onClick={() => updateTime(hour >= 12 ? hour - 12 : hour + 12, minute)}
              aria-label={`Toggle AM/PM, currently ${hour >= 12 ? 'PM' : 'AM'}`}
            >
              {hour >= 12 ? 'PM' : 'AM'}
            </button>
          </div>

          {/* Quick Time Selections */}
          <div className="grid grid-cols-5 gap-2 pt-3 border-t border-border">
            {quickTimes.map(({ label, hour: h, minute: m }) => (
              <button
                key={label}
                type="button"
                className={cn(
                  "px-2 py-2 rounded-md text-sm font-medium",
                  "bg-muted/50 hover:bg-primary hover:text-primary-foreground",
                  "transition-colors duration-150"
                )}
                onClick={() => setQuickTime(h, m)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

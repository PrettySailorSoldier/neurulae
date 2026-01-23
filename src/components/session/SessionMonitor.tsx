import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionMonitorProps {
  /** Minimum minutes before showing the monitor */
  showAfterMinutes?: number;
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function SessionMonitor({
  showAfterMinutes = 30,
  position = 'bottom-right',
}: SessionMonitorProps) {
  const [sessionStart] = useState(() => new Date());
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      const minutes = Math.floor(
        (Date.now() - sessionStart.getTime()) / 60000
      );
      setDuration(minutes);
    }, 60000);

    // Also update immediately
    const minutes = Math.floor((Date.now() - sessionStart.getTime()) / 60000);
    setDuration(minutes);

    return () => clearInterval(interval);
  }, [sessionStart]);

  // Don't show until threshold reached
  if (duration < showAfterMinutes) return null;

  const isLongSession = duration >= 90;
  const isVeryLongSession = duration >= 120;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  // Compact view
  if (!isExpanded) {
    return (
      <div
        className={cn(
          'fixed z-50 cursor-pointer transition-all duration-300 hover:scale-105',
          positionClasses[position]
        )}
        onClick={() => setIsExpanded(true)}
      >
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm',
            isVeryLongSession
              ? 'bg-red-500/90 text-white animate-pulse'
              : isLongSession
                ? 'bg-amber-500/90 text-white'
                : 'bg-slate-800/90 text-slate-200'
          )}
        >
          <Monitor className="h-4 w-4" />
          <span className="text-sm font-medium">
            {hours > 0 && `${hours}h `}
            {minutes}m
          </span>
          {isLongSession && <AlertTriangle className="h-3.5 w-3.5" />}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <Card
      className={cn(
        'fixed z-50 w-64 shadow-lg cursor-pointer transition-all duration-300',
        positionClasses[position],
        isVeryLongSession && 'border-red-500 border-2 animate-pulse',
        isLongSession && !isVeryLongSession && 'border-amber-500 border-2'
      )}
      onClick={() => setIsExpanded(false)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-full',
              isVeryLongSession
                ? 'bg-red-500/20'
                : isLongSession
                  ? 'bg-amber-500/20'
                  : 'bg-slate-500/20'
            )}
          >
            <Monitor
              className={cn(
                'h-5 w-5',
                isVeryLongSession
                  ? 'text-red-500'
                  : isLongSession
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
              )}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Computer session</p>
            <p className="text-lg font-bold">
              {hours > 0 && `${hours}h `}
              {minutes}m
            </p>
          </div>
          {isLongSession && (
            <Clock
              className={cn(
                'h-5 w-5 animate-pulse',
                isVeryLongSession ? 'text-red-500' : 'text-amber-500'
              )}
            />
          )}
        </div>

        {isVeryLongSession && (
          <div className="mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <p className="text-xs text-red-400 font-medium">
              🚨 You've been at your computer for over 2 hours
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Take a 10-minute break to walk outside
            </p>
          </div>
        )}

        {isLongSession && !isVeryLongSession && (
          <div className="mt-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <p className="text-xs text-amber-400">
              Consider taking a longer break soon
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Click to minimize
        </p>
      </CardContent>
    </Card>
  );
}

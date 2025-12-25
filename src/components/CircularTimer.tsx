import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CircularTimerProps {
  timeRemaining: number; // in seconds
  totalTime: number; // in seconds
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTime?: boolean;
  className?: string;
  isPaused?: boolean;
}

const SIZE_CONFIG = {
  sm: { diameter: 80, strokeWidth: 6, fontSize: 'text-lg' },
  md: { diameter: 120, strokeWidth: 8, fontSize: 'text-2xl' },
  lg: { diameter: 160, strokeWidth: 10, fontSize: 'text-4xl' },
  xl: { diameter: 200, strokeWidth: 12, fontSize: 'text-5xl' },
};

export function CircularTimer({
  timeRemaining,
  totalTime,
  size = 'lg',
  showTime = true,
  className,
  isPaused = false,
}: CircularTimerProps) {
  const config = SIZE_CONFIG[size];
  const radius = (config.diameter - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress (0 to 1, where 1 is full/complete)
  const progress = totalTime > 0 ? timeRemaining / totalTime : 1;
  const strokeDashoffset = circumference * (1 - progress);

  // Determine color based on remaining time percentage
  const colorClass = useMemo(() => {
    if (progress > 0.5) return 'text-green-500';
    if (progress > 0.25) return 'text-yellow-500';
    return 'text-primary'; // Pink/accent for urgent
  }, [progress]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        className
      )}
      style={{ width: config.diameter, height: config.diameter }}
    >
      {/* Background circle */}
      <svg
        className="absolute transform -rotate-90"
        width={config.diameter}
        height={config.diameter}
      >
        {/* Track (background) */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-muted/30"
        />

        {/* Progress arc */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            'transition-all duration-1000 ease-linear',
            colorClass,
            isPaused && 'opacity-60'
          )}
        />
      </svg>

      {/* Center content */}
      {showTime && (
        <div className="z-10 flex flex-col items-center">
          <span
            className={cn(
              'font-mono font-bold tabular-nums',
              config.fontSize,
              isPaused && 'opacity-60'
            )}
          >
            {formatTime(timeRemaining)}
          </span>
          {isPaused && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Paused
            </span>
          )}
        </div>
      )}

      {/* Urgency glow effect when low time */}
      {progress <= 0.25 && progress > 0 && !isPaused && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
}

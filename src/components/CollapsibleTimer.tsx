import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Play, Pause, RotateCcw, Timer, Clock, Zap } from 'lucide-react';
import { Task, Playbook, TimerSession } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CircularTimer } from './CircularTimer';
import { useGlobalTimer } from '@/hooks/useGlobalTimer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: '25m', minutes: 25 },
  { label: '15m', minutes: 15 },
  { label: '5m', minutes: 5 },
];

interface CollapsibleTimerProps {
  tasks: Task[];
  playbooks?: Playbook[];
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onOpenTimerHub?: () => void;
  defaultExpanded?: boolean;
}

export function CollapsibleTimer({
  tasks,
  playbooks = [],
  onUpdateTask,
  onOpenTimerHub,
  defaultExpanded = false,
}: CollapsibleTimerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('none');
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const isMobile = useIsMobile();

  const {
    isRunning,
    isPaused,
    timeRemaining,
    totalTime,
    taskId: activeTaskId,
    taskTitle: activeTaskTitle,
    hasActiveTimer,
    sessions,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useGlobalTimer({
    onComplete: (taskId, actualMinutes) => {
      if (taskId && onUpdateTask) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          onUpdateTask(taskId, {
            focusTimeMinutes: (task.focusTimeMinutes || 0) + actualMinutes,
          });
        }
      }
    },
  });

  // Auto-collapse after 2 minutes of idle (no interaction)
  useEffect(() => {
    if (!hasActiveTimer && isExpanded) {
      const checkIdle = setInterval(() => {
        const idleTime = Date.now() - lastActivityTime;
        if (idleTime > 2 * 60 * 1000) { // 2 minutes
          setIsExpanded(false);
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(checkIdle);
    }
  }, [hasActiveTimer, isExpanded, lastActivityTime]);

  // Reset activity timer on user interaction
  const handleInteraction = () => {
    setLastActivityTime(Date.now());
  };

  // Calculate today's focus time from sessions
  const todaysFocusTime = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sessions
      .filter((s: TimerSession) => s.date === today)
      .reduce((total: number, s: TimerSession) => total + s.actualMinutes, 0);
  }, [sessions]);

  // Format minutes to readable time
  const formatTotalTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get incomplete tasks for selection
  const availableTasks = useMemo(() => {
    return tasks.filter(t => !t.completed).slice(0, 20);
  }, [tasks]);

  const handleStartTimer = () => {
    handleInteraction();
    const task = selectedTaskId !== 'none'
      ? tasks.find(t => t.id === selectedTaskId)
      : null;
    startTimer(
      selectedDuration * 60,
      'focus',
      task ? { id: task.id, title: task.title } : null
    );
  };

  const handlePauseResume = () => {
    handleInteraction();
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  const handleStop = () => {
    handleInteraction();
    stopTimer();
  };

  // Mini progress ring for collapsed state
  const MiniProgressRing = ({ progress }: { progress: number }) => {
    const size = 24;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress * circumference);

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  // Shared timer content for both desktop collapsible and mobile sheet
  const TimerContent = () => (
    <div className="space-y-4">
      {/* Circular Timer Display */}
      <div className="flex justify-center py-4">
        <CircularTimer
          timeRemaining={hasActiveTimer ? timeRemaining : selectedDuration * 60}
          totalTime={hasActiveTimer ? totalTime : selectedDuration * 60}
          size={isMobile ? 'lg' : 'lg'}
          isPaused={isPaused}
        />
      </div>

      {/* Task Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Working on:</label>
        <Select
          value={hasActiveTimer ? (activeTaskId || 'none') : selectedTaskId}
          onValueChange={setSelectedTaskId}
          disabled={hasActiveTimer}
        >
          <SelectTrigger className="w-full text-sm h-10">
            <SelectValue placeholder="Select a task (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No task selected</SelectItem>
            {availableTasks.map(task => (
              <SelectItem key={task.id} value={task.id}>
                <span className="truncate">{task.title}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration Presets */}
      {!hasActiveTimer && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Duration:</span>
          <div className="flex gap-2 flex-1">
            {PRESETS.map(preset => (
              <Button
                key={preset.minutes}
                variant={selectedDuration === preset.minutes ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-10 text-sm"
                onClick={() => {
                  setSelectedDuration(preset.minutes);
                  handleInteraction();
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        {!hasActiveTimer ? (
          <Button
            className="flex-1 gap-2 h-12 text-base"
            onClick={handleStartTimer}
          >
            <Play className="h-5 w-5" />
            Start Focus
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              className="flex-1 gap-2 h-12 text-base"
              onClick={handlePauseResume}
            >
              {isPaused ? (
                <>
                  <Play className="h-5 w-5" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5" />
                  Pause
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={handleStop}
              title="Reset timer"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Advanced Timers Link */}
      {onOpenTimerHub && (
        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground hover:text-foreground gap-2"
          onClick={() => {
            onOpenTimerHub();
            handleInteraction();
            setIsExpanded(false);
          }}
        >
          <Clock className="h-4 w-4" />
          Advanced Timers (Pomodoro, Intervals, etc.)
        </Button>
      )}
    </div>
  );

  // Collapsed header bar - shown on both mobile and desktop
  const CollapsedHeader = ({ onClick }: { onClick?: () => void }) => (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors",
        hasActiveTimer && "bg-primary/5"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Timer icon or mini progress ring */}
        {hasActiveTimer ? (
          <div className="relative">
            <MiniProgressRing progress={totalTime > 0 ? timeRemaining / totalTime : 0} />
            {isRunning && !isPaused && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
        ) : (
          <div className="w-6 h-6 flex items-center justify-center text-primary">
            <Timer className="h-5 w-5" />
          </div>
        )}

        {/* Timer status / Today's total */}
        <div className="flex flex-col">
          {hasActiveTimer ? (
            <>
              <span className="text-sm font-semibold text-foreground">
                {formatTime(timeRemaining)}
                {isPaused && <span className="text-xs text-muted-foreground ml-1">(Paused)</span>}
              </span>
              {activeTaskTitle && (
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {activeTaskTitle}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-foreground">Focus Timer</span>
              <span className="text-xs text-muted-foreground">
                {todaysFocusTime > 0
                  ? `${formatTotalTime(todaysFocusTime)} focused today`
                  : 'Ready to focus'
                }
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Today's total badge (when not running) */}
        {!hasActiveTimer && todaysFocusTime > 0 && (
          <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
            <Zap className="h-3 w-3 mr-1" />
            {formatTotalTime(todaysFocusTime)}
          </Badge>
        )}

        {/* Expand/Collapse indicator */}
        <div className="h-8 w-8 flex items-center justify-center text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </div>
    </div>
  );

  // Mobile: Use bottom sheet pattern
  if (isMobile) {
    return (
      <>
        {/* Sticky collapsed bar at bottom for mobile */}
        <Card className="border border-border/50 bg-card/95 backdrop-blur-sm overflow-hidden shadow-lg">
          <CollapsedHeader onClick={() => {
            setIsExpanded(true);
            handleInteraction();
          }} />
        </Card>

        {/* Bottom sheet for expanded state */}
        <Sheet open={isExpanded} onOpenChange={(open) => {
          setIsExpanded(open);
          handleInteraction();
        }}>
          <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8 pt-4">
            {/* Drag handle indicator */}
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <Timer className="h-5 w-5 text-primary" />
                Focus Timer
                {hasActiveTimer && activeTaskTitle && (
                  <span className="text-sm font-normal text-muted-foreground truncate">
                    - {activeTaskTitle}
                  </span>
                )}
              </SheetTitle>
            </SheetHeader>

            <TimerContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Use collapsible pattern
  return (
    <Collapsible open={isExpanded} onOpenChange={(open) => {
      setIsExpanded(open);
      handleInteraction();
    }}>
      <Card className="border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        {/* Collapsed Header - Always Visible */}
        <CollapsibleTrigger asChild>
          <CollapsedHeader />
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <CardContent className="pt-2 pb-4 px-4 border-t border-border/30">
            <TimerContent />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

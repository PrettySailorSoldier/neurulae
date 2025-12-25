import { useState, useEffect } from 'react';
import { Target, Check, Pause, Play, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ActiveIntention, Task } from '@/types';

interface ActiveIntentionBannerProps {
  activeIntention: ActiveIntention | null;
  currentTask: Task | null;
  isPaused: boolean;
  onComplete: (markTaskComplete?: boolean) => void;
  onPause: (note?: string) => void;
  onResume: () => void;
  onClear: () => void;
  getElapsedTime: () => number;
  formatElapsedTime: (ms: number) => string;
}

export function ActiveIntentionBanner({
  activeIntention,
  currentTask,
  isPaused,
  onComplete,
  onPause,
  onResume,
  onClear,
  getElapsedTime,
  formatElapsedTime,
}: ActiveIntentionBannerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [pauseNote, setPauseNote] = useState('');

  // Update elapsed time every second
  useEffect(() => {
    if (!activeIntention) return;

    const updateTime = () => {
      setElapsedTime(getElapsedTime());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [activeIntention, getElapsedTime]);

  if (!activeIntention) return null;

  const handlePauseClick = () => {
    setShowPauseDialog(true);
  };

  const handleConfirmPause = () => {
    onPause(pauseNote.trim() || undefined);
    setPauseNote('');
    setShowPauseDialog(false);
  };

  const handleSkipNote = () => {
    onPause();
    setPauseNote('');
    setShowPauseDialog(false);
  };

  const handleComplete = () => {
    onComplete(true);
  };

  return (
    <>
      <div
        className={cn(
          'sticky top-[73px] z-40 w-full transition-all duration-300',
          'bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15',
          'backdrop-blur-md border-b border-primary/20',
          'shadow-[0_4px_12px_-4px_hsl(var(--primary)/0.2)]'
        )}
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Icon + Task Name + Timer */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full shrink-0',
                  'bg-primary/20 text-primary',
                  isPaused && 'animate-pulse'
                )}
              >
                <Target className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {isPaused ? 'Paused' : 'Working on'}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground truncate">
                  {activeIntention.taskName}
                </h3>
              </div>

              {/* Timer */}
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0',
                  'bg-card/50 border border-border/50',
                  isPaused && 'opacity-60'
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isPaused ? 'bg-muted-foreground' : 'bg-green-500 animate-pulse'
                  )}
                />
                <span className="text-sm font-mono font-medium tabular-nums">
                  {formatElapsedTime(elapsedTime)}
                </span>
              </div>
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {isPaused ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onResume}
                    className="gap-1.5"
                  >
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Resume</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleComplete}
                    className="gap-1.5 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">Done</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePauseClick}
                    className="gap-1.5"
                  >
                    <Pause className="h-4 w-4" />
                    <span className="hidden sm:inline">Pause / Switch</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Interruption count indicator */}
          {activeIntention.interruptions.length > 0 && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
              <span>
                {activeIntention.interruptions.length} interruption
                {activeIntention.interruptions.length !== 1 ? 's' : ''} recorded
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pause Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pausing: {activeIntention.taskName}</DialogTitle>
            <DialogDescription>
              What pulled you away? (optional - helps track interruptions)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Phone call, urgent email, break..."
              value={pauseNote}
              onChange={(e) => setPauseNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmPause();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={handleSkipNote}
              className="sm:order-1"
            >
              Skip
            </Button>
            <Button onClick={handleConfirmPause} className="sm:order-2">
              <Pause className="h-4 w-4 mr-2" />
              Pause Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

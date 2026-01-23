import { useState, useEffect, useCallback } from 'react';
import { useHyperfocusDetector, HyperfocusBreak } from '@/hooks/useHyperfocusDetector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Coffee, Timer, Sparkles, TreePine, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HyperfocusBreakModal() {
  const { checkForHyperfocus, startBreak, completeBreak, skipBreak, settings } =
    useHyperfocusDetector();

  const [breakInfo, setBreakInfo] = useState<HyperfocusBreak | null>(null);
  const [showFutureSelf, setShowFutureSelf] = useState(false);
  const [breakTimer, setBreakTimer] = useState(0);
  const [onBreak, setOnBreak] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check for hyperfocus every minute
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (dismissed) return;
      
      const info = checkForHyperfocus();
      if (info && !breakInfo && !onBreak) {
        setBreakInfo(info);

        // Multi-modal alert
        if (settings.multiModal) {
          // Visual: Flash border with animation
          document.body.classList.add('hyperfocus-alert');
          setTimeout(() => {
            document.body.classList.remove('hyperfocus-alert');
          }, 2000);

          // Audio: Simple beep
          try {
            const audioContext = new (window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 440;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
          } catch {
            console.log('Audio context not supported');
          }

          // Haptic: Vibrate if supported
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        }
      }
    }, 60000); // Check every minute

    // Also check immediately on mount
    const info = checkForHyperfocus();
    if (info && !dismissed) {
      setBreakInfo(info);
    }

    return () => clearInterval(checkInterval);
  }, [checkForHyperfocus, settings, breakInfo, onBreak, dismissed]);

  // Handle break start
  const handleStartBreak = useCallback(() => {
    if (!breakInfo) return;

    startBreak();
    setOnBreak(true);
    setBreakTimer(breakInfo.duration * 60); // Convert to seconds

    // Start countdown
    const timer = setInterval(() => {
      setBreakTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleCompleteBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [breakInfo, startBreak]);

  // Handle break completion
  const handleCompleteBreak = useCallback(() => {
    completeBreak();
    setBreakInfo(null);
    setOnBreak(false);
    setShowFutureSelf(false);
    setDismissed(true);
    
    // Reset dismiss after 30 minutes
    setTimeout(() => setDismissed(false), 30 * 60 * 1000);
  }, [completeBreak]);

  // Handle skip (show future-self first if enabled)
  const handleSkip = useCallback(() => {
    if (settings.futureSelfVisualization && !showFutureSelf) {
      setShowFutureSelf(true);
      return;
    }

    skipBreak();
    setBreakInfo(null);
    setShowFutureSelf(false);
    setDismissed(true);
    
    // Reset dismiss after 15 minutes
    setTimeout(() => setDismissed(false), 15 * 60 * 1000);
  }, [settings.futureSelfVisualization, showFutureSelf, skipBreak]);

  if (!breakInfo) return null;

  // Future-self visualization prompt
  if (showFutureSelf) {
    return (
      <AlertDialog open>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Before you skip...
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                <p className="text-sm">Imagine yourself 4 hours from now:</p>
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-sm flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>
                      If you take this {breakInfo.duration}-minute break now,
                      you'll feel refreshed and focused. Your eyes won't hurt,
                      your back won't ache, and you'll finish your work feeling
                      good.
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>
                      If you skip this break, you'll push through now but hit a
                      wall later. You'll be exhausted, scattered, and everything
                      will take longer.
                    </span>
                  </p>
                </div>
                <p className="text-sm font-medium text-center pt-2">
                  Which version of yourself do you want to be?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleSkip}>
              Still skip
            </Button>
            <AlertDialogAction
              onClick={handleStartBreak}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              Take the break
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // On break - show timer
  if (onBreak) {
    const progress =
      ((breakInfo.duration * 60 - breakTimer) / (breakInfo.duration * 60)) *
      100;
    const minutesLeft = Math.ceil(breakTimer / 60);
    const secondsLeft = breakTimer % 60;

    return (
      <AlertDialog open>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-emerald-500" />
              Break in progress
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4" asChild>
              <div>
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg">
                  <Coffee className="h-5 w-5 text-emerald-500" />
                  <p className="text-sm">{breakInfo.activity}</p>
                </div>
                <div className="space-y-2 pt-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-center text-2xl font-bold tracking-tight">
                    {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    remaining
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleCompleteBreak}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              ✓ Break complete!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Initial break suggestion
  const isUrgent = breakInfo.type === 'urgent';

  return (
    <AlertDialog open>
      <AlertDialogContent
        className={cn(
          'max-w-md',
          isUrgent && 'border-red-500 border-2'
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isUrgent ? (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                Break Required
              </>
            ) : (
              <>
                <Timer className="h-5 w-5 text-amber-500" />
                Time for a Break
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3" asChild>
            <div>
              <p className="font-medium text-foreground">{breakInfo.reason}</p>
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-lg">
                <Coffee className="h-5 w-5 text-amber-500" />
                <p className="text-sm">{breakInfo.activity}</p>
              </div>
              {breakInfo.requiresMovement && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  💡 Stand up and move around before dismissing
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {breakInfo.canDismiss && (
            <Button
              variant="outline"
              onClick={handleSkip}
              className="w-full sm:w-auto"
            >
              Skip (not recommended)
            </Button>
          )}
          <AlertDialogAction
            onClick={handleStartBreak}
            className={cn(
              'w-full sm:w-auto',
              isUrgent
                ? 'bg-gradient-to-r from-red-500 to-orange-600'
                : 'bg-gradient-to-r from-amber-500 to-orange-600'
            )}
          >
            Start {breakInfo.duration}-min break
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

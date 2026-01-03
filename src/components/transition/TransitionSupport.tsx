import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Clock,
  Pause,
  Play,
  SkipForward,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransitionSupportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromActivity?: string;
  toActivity?: string;
  transitionTime?: number; // in seconds, default 60
  onComplete?: () => void;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'Take 3 deep breaths',
  'Stand up and stretch',
  'Get a glass of water',
  'Clear your workspace',
  'Write down where you left off',
  'Set an intention for the next activity',
];

const TRANSITION_SOUNDS = {
  chime: '/sounds/chime.mp3',
  bell: '/sounds/bell.mp3',
  none: null,
} as const;

export function TransitionSupport({
  open,
  onOpenChange,
  fromActivity = 'Current Task',
  toActivity = 'Next Task',
  transitionTime = 60,
  onComplete,
  suggestions = DEFAULT_SUGGESTIONS,
}: TransitionSupportProps) {
  const [timeLeft, setTimeLeft] = useState(transitionTime);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setTimeLeft(transitionTime);
      setIsPaused(false);
      setIsComplete(false);
      setCurrentStep(0);
      setCompletedSteps([]);
    }
  }, [open, transitionTime]);

  // Timer countdown
  useEffect(() => {
    if (!open || isPaused || isComplete || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, isPaused, isComplete, timeLeft]);

  // Progress through steps automatically
  useEffect(() => {
    if (!open || isPaused || isComplete) return;

    const stepDuration = transitionTime / Math.min(suggestions.length, 3);
    const elapsed = transitionTime - timeLeft;
    const newStep = Math.min(
      Math.floor(elapsed / stepDuration),
      Math.min(suggestions.length, 3) - 1
    );

    if (newStep !== currentStep && newStep >= 0) {
      setCurrentStep(newStep);
    }
  }, [timeLeft, transitionTime, suggestions.length, currentStep, open, isPaused, isComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((transitionTime - timeLeft) / transitionTime) * 100;

  const handleComplete = () => {
    setIsComplete(true);
    onComplete?.();
    onOpenChange(false);
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(prev => prev.filter(i => i !== index));
    } else {
      setCompletedSteps(prev => [...prev, index]);
    }
  };

  const displayedSuggestions = suggestions.slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Transition Time
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-base">
            <span className="text-muted-foreground">{fromActivity}</span>
            <ArrowRight className="w-4 h-4" />
            <span className="font-medium text-foreground">{toActivity}</span>
          </DialogDescription>
        </DialogHeader>

        {!isComplete ? (
          <div className="space-y-6 py-4">
            {/* Timer */}
            <div className="text-center">
              <div className="text-5xl font-bold tabular-nums mb-2">
                {formatTime(timeLeft)}
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Take a moment to transition mindfully
              </p>
            </div>

            {/* Transition Steps */}
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Transition suggestions:
              </p>
              <div className="space-y-2">
                {displayedSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => toggleStep(index)}
                    className={cn(
                      'w-full p-3 rounded-lg text-left text-sm transition-all',
                      'border flex items-center gap-3',
                      completedSteps.includes(index)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : index === currentStep
                          ? 'bg-accent border-primary/20 animate-pulse'
                          : 'bg-card border-border/50 hover:bg-accent/50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                        completedSteps.includes(index)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {completedSteps.includes(index) ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <span className={completedSteps.includes(index) ? 'line-through opacity-70' : ''}>
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  )}
                </Button>
                <Button size="sm" onClick={handleComplete}>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Done
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Transition Complete!</h3>
            <p className="text-muted-foreground text-sm mb-4">
              You're ready for: <span className="font-medium">{toActivity}</span>
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => onOpenChange(false)}>
                Let's Go!
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TransitionSupport;

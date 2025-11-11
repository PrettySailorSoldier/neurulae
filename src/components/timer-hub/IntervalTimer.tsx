import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw, Clock, Zap } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const PRESETS = {
  pomodoro: { focus: 25, break: 5, rounds: 4, name: 'Classic Pomodoro 🍅' },
  short: { focus: 15, break: 3, rounds: 6, name: 'Short Bursts ⚡' },
  long: { focus: 52, break: 17, rounds: 3, name: '52-17 Method 📚' },
  custom: { focus: 25, break: 5, rounds: 4, name: 'Custom ⚙️' },
};

interface IntervalTimerProps {
  onSaveSession: (taskId: string | undefined, minutes: number) => void;
}

export function IntervalTimer({ onSaveSession }: IntervalTimerProps) {
  const [preset, setPreset] = useLocalStorage<keyof typeof PRESETS>('neurulae-interval-preset', 'pomodoro');
  const [focusMinutes, setFocusMinutes] = useLocalStorage('neurulae-focus-minutes', 25);
  const [breakMinutes, setBreakMinutes] = useLocalStorage('neurulae-break-minutes', 5);
  const [rounds, setRounds] = useLocalStorage('neurulae-rounds', 4);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<'focus' | 'break'>('focus');

  const totalTime = phase === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handlePhaseComplete = () => {
    if (phase === 'focus') {
      onSaveSession(undefined, focusMinutes);
      
      if (currentRound >= rounds) {
        toast.success('🎉 All rounds complete! Excellent work!', {
          description: `You completed ${rounds} focus sessions!`
        });
        setIsRunning(false);
        setPhase('focus');
        setCurrentRound(1);
        setTimeRemaining(focusMinutes * 60);
      } else {
        toast.success('☕ Break time! You earned it!');
        setPhase('break');
        setTimeRemaining(breakMinutes * 60);
      }
    } else {
      toast.success('💪 Break over! Back to focus mode');
      setCurrentRound(prev => prev + 1);
      setPhase('focus');
      setTimeRemaining(focusMinutes * 60);
    }
  };

  const handlePresetChange = (newPreset: keyof typeof PRESETS) => {
    setPreset(newPreset);
    const config = PRESETS[newPreset];
    setFocusMinutes(config.focus);
    setBreakMinutes(config.break);
    setRounds(config.rounds);
    if (!isRunning) {
      setTimeRemaining(config.focus * 60);
      setPhase('focus');
      setCurrentRound(1);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase('focus');
    setCurrentRound(1);
    setTimeRemaining(focusMinutes * 60);
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="space-y-6">
      {/* Preset Selector */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <Label className="text-sm font-medium mb-2 block">Choose a Timer Preset</Label>
        <Select value={preset} onValueChange={handlePresetChange} disabled={isRunning}>
          <SelectTrigger className="bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRESETS).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="focus" className="text-sm">Focus Time</Label>
          <Input
            id="focus"
            type="number"
            value={focusMinutes}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 25);
              setFocusMinutes(val);
              setPreset('custom');
              if (phase === 'focus' && !isRunning) {
                setTimeRemaining(val * 60);
              }
            }}
            className="bg-input border-border mt-1"
            min="1"
            disabled={isRunning}
          />
          <p className="text-xs text-muted-foreground mt-1">minutes</p>
        </div>
        <div>
          <Label htmlFor="break" className="text-sm">Break Time</Label>
          <Input
            id="break"
            type="number"
            value={breakMinutes}
            onChange={(e) => {
              setBreakMinutes(Math.max(1, parseInt(e.target.value) || 5));
              setPreset('custom');
            }}
            className="bg-input border-border mt-1"
            min="1"
            disabled={isRunning}
          />
          <p className="text-xs text-muted-foreground mt-1">minutes</p>
        </div>
        <div>
          <Label htmlFor="rounds" className="text-sm">Rounds</Label>
          <Input
            id="rounds"
            type="number"
            value={rounds}
            onChange={(e) => {
              setRounds(Math.max(1, Math.min(10, parseInt(e.target.value) || 4)));
              setPreset('custom');
            }}
            className="bg-input border-border mt-1"
            min="1"
            max="10"
            disabled={isRunning}
          />
          <p className="text-xs text-muted-foreground mt-1">total</p>
        </div>
      </div>

      {/* Timer Display */}
      <div className={`border-2 rounded-lg p-8 text-center transition-all duration-500 ${
        phase === 'focus' 
          ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary' 
          : 'bg-gradient-to-br from-accent/20 to-accent/5 border-accent'
      }`}>
        <div className="flex items-center justify-center gap-2 mb-3">
          {phase === 'focus' ? (
            <>
              <Zap className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-lg font-semibold text-primary">Focus Time</span>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-accent" />
              <span className="text-lg font-semibold text-accent">Break Time</span>
            </>
          )}
        </div>

        <div className="text-7xl font-bold mb-4 tabular-nums">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-4">
          <Progress value={progress} className="h-3" />
        </div>

        <div className="text-muted-foreground font-medium">
          Round {currentRound} of {rounds}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={() => setIsRunning(!isRunning)}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button onClick={handleReset} variant="outline" size="lg">
          <RotateCcw className="h-5 w-5 mr-2" />
          Reset
        </Button>
      </div>

      {/* Progress Indicators */}
      <div className="flex gap-2 justify-center items-center">
        {Array.from({ length: rounds }).map((_, i) => {
          const isCurrentRound = i === currentRound - 1;
          const isCompleted = i < currentRound - 1;
          
          return (
            <div key={i} className="relative">
              <div
                className={`h-4 w-16 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-primary shadow-md'
                    : isCurrentRound
                    ? phase === 'focus'
                      ? 'bg-primary/60 animate-pulse'
                      : 'bg-accent/60 animate-pulse'
                    : 'bg-muted'
                }`}
              />
              {isCompleted && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Motivational Message */}
      {isRunning && (
        <div className="text-center text-sm text-muted-foreground animate-fade-in">
          {phase === 'focus' ? (
            <p>🎯 Stay focused! You're doing great!</p>
          ) : (
            <p>😌 Relax and recharge. You've earned this break!</p>
          )}
        </div>
      )}
    </div>
  );
}
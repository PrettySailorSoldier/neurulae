import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface IntervalTimerProps {
  onSaveSession: (taskId: string | undefined, minutes: number) => void;
}

export function IntervalTimer({ onSaveSession }: IntervalTimerProps) {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [rounds, setRounds] = useState(4);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<'focus' | 'break'>('focus');

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
        // All rounds complete
        setIsRunning(false);
        setPhase('focus');
        setCurrentRound(1);
        setTimeRemaining(focusMinutes * 60);
      } else {
        // Start break
        setPhase('break');
        setTimeRemaining(breakMinutes * 60);
      }
    } else {
      // Break complete, start next round
      setCurrentRound(prev => prev + 1);
      setPhase('focus');
      setTimeRemaining(focusMinutes * 60);
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
      {/* Settings */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="focus">Focus Time (min)</Label>
          <Input
            id="focus"
            type="number"
            value={focusMinutes}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 25);
              setFocusMinutes(val);
              if (phase === 'focus' && !isRunning) {
                setTimeRemaining(val * 60);
              }
            }}
            className="bg-input border-border"
            min="1"
            disabled={isRunning}
          />
        </div>
        <div>
          <Label htmlFor="break">Break Time (min)</Label>
          <Input
            id="break"
            type="number"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Math.max(1, parseInt(e.target.value) || 5))}
            className="bg-input border-border"
            min="1"
            disabled={isRunning}
          />
        </div>
        <div>
          <Label htmlFor="rounds">Rounds</Label>
          <Input
            id="rounds"
            type="number"
            value={rounds}
            onChange={(e) => setRounds(Math.max(1, Math.min(10, parseInt(e.target.value) || 4)))}
            className="bg-input border-border"
            min="1"
            max="10"
            disabled={isRunning}
          />
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className={`text-sm font-semibold mb-2 ${phase === 'focus' ? 'text-primary' : 'text-accent'}`}>
          {phase === 'focus' ? '🎯 Focus Time' : '☕ Break Time'}
        </div>
        <div className="text-6xl font-bold mb-4">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-muted-foreground">
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

      {/* Progress */}
      <div className="flex gap-2 justify-center">
        {Array.from({ length: rounds }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-12 rounded-full transition-colors ${
              i < currentRound - 1
                ? 'bg-primary'
                : i === currentRound - 1
                ? phase === 'focus'
                  ? 'bg-primary/50'
                  : 'bg-accent'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
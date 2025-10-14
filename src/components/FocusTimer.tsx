import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimerHub } from './TimerHub';
import { TimerState, TimerSession } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const PRESETS = [
  { label: '25 min', minutes: 25 },
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
];

export function FocusTimer() {
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    timeRemaining: 25 * 60,
    totalTime: 25 * 60,
  });
  const [hubOpen, setHubOpen] = useState(false);
  const [sessions, setSessions] = useLocalStorage<TimerSession[]>('neurulae-timer-sessions', []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timer.isRunning && timer.timeRemaining > 0) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1),
        }));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: false,
      timeRemaining: prev.totalTime,
    }));
  };

  const setPreset = (minutes: number) => {
    const seconds = minutes * 60;
    setTimer({
      isRunning: false,
      timeRemaining: seconds,
      totalTime: seconds,
    });
  };

  const handleSaveSession = (session: TimerSession) => {
    setSessions([session, ...sessions]);
  };

  const progress = ((timer.totalTime - timer.timeRemaining) / timer.totalTime) * 100;

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Focus Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <div className="text-5xl font-bold text-center py-6">
            {formatTime(timer.timeRemaining)}
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-muted rounded-full w-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => setPreset(preset.minutes)}
              disabled={timer.isRunning}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            onClick={toggleTimer}
            className="btn-primary"
            size="lg"
          >
            {timer.isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button
            onClick={resetTimer}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={() => setHubOpen(true)}
          variant="outline"
          className="w-full"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          Advanced Timers
        </Button>

        {timer.currentTaskId && (
          <div className="text-sm text-muted-foreground text-center">
            Current Task: Focus Session
          </div>
        )}
      </CardContent>

      <TimerHub
        open={hubOpen}
        onOpenChange={setHubOpen}
        onSaveSession={handleSaveSession}
      />
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, Square } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';

interface Session {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface FlowtimeTrackerProps {
  onSaveSession: (taskId: string | undefined, minutes: number) => void;
}

export function FlowtimeTracker({ onSaveSession }: FlowtimeTrackerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionLabel, setSessionLabel] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [startTime, setStartTime] = useState<string>('');

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => {
    if (!isRunning) {
      setStartTime(new Date().toISOString());
    }
    setIsRunning(true);
  };

  const handleStop = () => {
    if (isRunning && elapsedSeconds > 0) {
      const endTime = new Date().toISOString();
      const minutes = Math.floor(elapsedSeconds / 60);
      
      const newSession: Session = {
        id: crypto.randomUUID(),
        label: sessionLabel || 'Flow Session',
        startTime,
        endTime,
        duration: minutes,
      };

      setSessions([newSession, ...sessions]);
      onSaveSession(undefined, minutes);
      
      setIsRunning(false);
      setElapsedSeconds(0);
      setSessionLabel('');
    }
  };

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <div className="space-y-6">
      {/* Timer Display */}
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="text-sm text-muted-foreground mb-2">Stopwatch</div>
        <div className="text-6xl font-bold mb-4">
          {hours > 0 && `${hours.toString().padStart(2, '0')}:`}
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        <Input
          value={sessionLabel}
          onChange={(e) => setSessionLabel(e.target.value)}
          placeholder="Optional: What are you working on?"
          className="max-w-md mx-auto bg-input border-border"
          disabled={!isRunning}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={isRunning ? () => setIsRunning(false) : handleStart}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button
          onClick={handleStop}
          variant="destructive"
          size="lg"
          disabled={!isRunning && elapsedSeconds === 0}
        >
          <Square className="h-5 w-5 mr-2" />
          Stop & Save
        </Button>
      </div>

      {/* Session Log */}
      <div className="space-y-2">
        <h4 className="font-semibold">Session History</h4>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sessions yet. Start tracking your flow!
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-card border border-border rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{session.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-lg font-semibold">{formatDuration(session.duration)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
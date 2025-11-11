import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Coffee, Zap, Trash2, Edit2, Check } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

interface Session {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  duration: number;
  energyLevel?: number;
}

interface FlowtimeTrackerProps {
  onSaveSession: (taskId: string | undefined, minutes: number) => void;
}

export function FlowtimeTracker({ onSaveSession }: FlowtimeTrackerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionLabel, setSessionLabel] = useState('');
  const [energyLevel, setEnergyLevel] = useState(3);
  const [sessions, setSessions] = useLocalStorage<Session[]>('neurulae-flow-sessions', []);
  const [startTime, setStartTime] = useState<string>('');
  const [showBreakSuggestion, setShowBreakSuggestion] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const newTime = prev + 1;
        
        // Break suggestion logic (every 25, 50, or 90 minutes)
        if ([25 * 60, 50 * 60, 90 * 60].includes(newTime) && !showBreakSuggestion) {
          setShowBreakSuggestion(true);
          toast.info('💡 Break suggestion', {
            description: `You've been focused for ${Math.floor(newTime / 60)} minutes. Consider taking a break!`,
          });
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, showBreakSuggestion]);

  const handleStart = () => {
    if (!isRunning) {
      setStartTime(new Date().toISOString());
      setShowBreakSuggestion(false);
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
        energyLevel,
      };

      setSessions([newSession, ...sessions]);
      onSaveSession(undefined, minutes);
      
      toast.success('✅ Session saved!', {
        description: `${formatDuration(minutes)} of focused work recorded`
      });
      
      setIsRunning(false);
      setElapsedSeconds(0);
      setSessionLabel('');
      setEnergyLevel(3);
      setShowBreakSuggestion(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    toast.success('Session deleted');
  };

  const handleStartEdit = (session: Session) => {
    setEditingId(session.id);
    setEditLabel(session.label);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editLabel.trim()) return;
    setSessions(sessions.map(s => s.id === editingId ? { ...s, label: editLabel } : s));
    setEditingId(null);
    setEditLabel('');
    toast.success('Session updated');
  };

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <div className="space-y-6">
      {/* Timer Display */}
      <div className="bg-gradient-to-br from-primary/10 to-card border-2 border-primary/30 rounded-lg p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-muted-foreground">Flow Tracker</span>
        </div>
        <div className="text-7xl font-bold mb-4 tabular-nums">
          {hours > 0 && `${hours.toString().padStart(2, '0')}:`}
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>

        {/* Break Suggestion Banner */}
        {showBreakSuggestion && isRunning && (
          <div className="bg-accent/20 border border-accent rounded-lg p-3 mb-4 animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Coffee className="h-4 w-4 text-accent" />
              <span className="text-accent font-medium">Consider taking a break soon</span>
            </div>
          </div>
        )}

        {/* Session Label Input */}
        <Input
          value={sessionLabel}
          onChange={(e) => setSessionLabel(e.target.value)}
          placeholder="What are you working on?"
          className="max-w-md mx-auto bg-input border-border mb-4"
          disabled={!isRunning}
        />

        {/* Energy Level Slider */}
        {isRunning && (
          <div className="max-w-md mx-auto animate-fade-in">
            <Label className="text-sm text-muted-foreground mb-2 block flex items-center justify-center gap-2">
              <Zap className="h-3 w-3" />
              Energy Level: {energyLevel}/5
            </Label>
            <Slider
              value={[energyLevel]}
              onValueChange={(v) => setEnergyLevel(v[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Session History</h4>
          {sessions.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-1">No sessions yet</p>
            <p className="text-sm">Start tracking your flow!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="group bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {editingId === session.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="h-8"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="font-medium truncate">{session.label}</div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>→</span>
                      <span>{new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {session.energyLevel && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            <span>{session.energyLevel}/5</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold text-primary whitespace-nowrap">
                      {formatDuration(session.duration)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleStartEdit(session)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-destructive/20"
                        onClick={() => {
                          if (confirm('Delete this session?')) {
                            handleDeleteSession(session.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square } from 'lucide-react';

export function TimeChime() {
  const [chimeInterval, setChimeInterval] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [chimeCount, setChimeCount] = useState(0);
  const [nextChimeIn, setNextChimeIn] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const countdown = setInterval(() => {
      setNextChimeIn(prev => {
        if (prev <= 1) {
          playChime();
          setChimeCount(c => c + 1);
          return chimeInterval * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [isRunning, chimeInterval]);

  const playChime = () => {
    // Create a simple beep sound
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleStart = () => {
    setIsRunning(true);
    setNextChimeIn(chimeInterval * 60);
    setChimeCount(0);
  };

  const handleStop = () => {
    setIsRunning(false);
    setNextChimeIn(0);
  };

  const minutes = Math.floor(nextChimeIn / 60);
  const seconds = nextChimeIn % 60;

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="max-w-xs mx-auto">
        <label className="block text-sm font-medium mb-2">Chime Interval</label>
        <Select
          value={chimeInterval.toString()}
          onValueChange={(v) => setChimeInterval(parseInt(v))}
          disabled={isRunning}
        >
          <SelectTrigger className="bg-input border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">Every 5 minutes</SelectItem>
            <SelectItem value="10">Every 10 minutes</SelectItem>
            <SelectItem value="15">Every 15 minutes</SelectItem>
            <SelectItem value="30">Every 30 minutes</SelectItem>
            <SelectItem value="60">Every 60 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Display */}
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        {isRunning ? (
          <>
            <div className="text-sm text-muted-foreground mb-2">Next chime in</div>
            <div className="text-6xl font-bold mb-4">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-muted-foreground">
              Chimes today: {chimeCount}
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">🔔</div>
            <div className="text-muted-foreground">
              Start the timer to receive periodic chimes every {chimeInterval} minutes
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center">
        {!isRunning ? (
          <Button onClick={handleStart} size="lg" className="bg-primary hover:bg-primary/90">
            <Play className="h-5 w-5 mr-2" />
            Start Chiming
          </Button>
        ) : (
          <Button onClick={handleStop} variant="destructive" size="lg">
            <Square className="h-5 w-5 mr-2" />
            Stop
          </Button>
        )}
      </div>
    </div>
  );
}
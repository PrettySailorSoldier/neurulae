import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Play, Square, Volume2, Upload, Trash2, Music } from 'lucide-react';

interface CustomSound {
  id: string;
  name: string;
  dataUrl: string;
}

export function TimeChime() {
  const { toast } = useToast();
  const [chimeInterval, setChimeInterval] = useLocalStorage('neurulae-chime-interval', 15);
  const [isRunning, setIsRunning] = useLocalStorage('neurulae-chime-running', false);
  const [chimeCount, setChimeCount] = useLocalStorage('neurulae-chime-count', 0);
  const [nextChimeIn, setNextChimeIn] = useLocalStorage('neurulae-chime-countdown', 0);
  const [volume, setVolume] = useLocalStorage('neurulae-chime-volume', 30);
  const [tone, setTone] = useLocalStorage<OscillatorType | 'custom'>('neurulae-chime-tone', 'sine');
  const [frequency, setFrequency] = useLocalStorage('neurulae-chime-frequency', 800);
  const [customSounds, setCustomSounds] = useLocalStorage<CustomSound[]>('neurulae-custom-sounds', []);
  const [selectedCustomSound, setSelectedCustomSound] = useLocalStorage<string | null>('neurulae-selected-custom-sound', null);

  // Refs for debounced preview
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced preview function - plays sound after user stops adjusting
  const schedulePreview = useCallback(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    previewTimeoutRef.current = setTimeout(() => {
      playChime(true); // Play a short preview
    }, 300); // Wait 300ms after last change
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isRunning || nextChimeIn <= 0) return;

    const countdown = setInterval(() => {
      setNextChimeIn(prev => {
        if (prev <= 1) {
          playChime();
          setChimeCount(c => c + 1);
          // Show notification
          toast({
            title: "🔔 Time Chime",
            description: `Chime #${chimeCount + 1} - ${chimeInterval} minutes elapsed`,
          });
          return chimeInterval * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [isRunning, chimeInterval, nextChimeIn]);

  const playChime = (isPreview = false) => {
    // If using custom sound
    if (tone === 'custom' && selectedCustomSound) {
      const customSound = customSounds.find(s => s.id === selectedCustomSound);
      if (customSound) {
        const audio = new Audio(customSound.dataUrl);
        audio.volume = volume / 100;
        audio.play().catch(e => console.warn('Failed to play custom sound:', e));
        return;
      }
    }

    // Create a customizable beep sound using oscillator
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = tone === 'custom' ? 'sine' : tone;
      
      const volumeValue = volume / 100;
      const duration = isPreview ? 0.2 : 0.5; // Shorter duration for previews
      
      gainNode.gain.setValueAtTime(volumeValue, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Failed to play oscillator:', e);
    }
  };

  const handleFrequencyChange = (value: number[]) => {
    setFrequency(value[0]);
    if (!isRunning && tone !== 'custom') {
      schedulePreview();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (!isRunning) {
      schedulePreview();
    }
  };

  const handleToneChange = (value: string) => {
    setTone(value as OscillatorType | 'custom');
    if (!isRunning) {
      schedulePreview();
    }
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

  // Handle custom sound upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, OGG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an audio file smaller than 1MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const newSound: CustomSound = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, ''), // Remove extension
        dataUrl,
      };
      
      setCustomSounds(prev => [...prev, newSound]);
      setSelectedCustomSound(newSound.id);
      setTone('custom');
      
      toast({
        title: "Sound uploaded",
        description: `"${newSound.name}" is now available as a chime sound`,
      });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: "Failed to process the audio file",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteCustomSound = (soundId: string) => {
    setCustomSounds(prev => prev.filter(s => s.id !== soundId));
    if (selectedCustomSound === soundId) {
      setSelectedCustomSound(null);
      setTone('sine');
    }
  };

  const minutes = Math.floor(nextChimeIn / 60);
  const seconds = nextChimeIn % 60;

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="max-w-md mx-auto space-y-6">
        <div>
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

        <div>
          <Label className="block text-sm font-medium mb-2">Chime Tone</Label>
          <Select
            value={tone}
            onValueChange={handleToneChange}
            disabled={isRunning}
          >
            <SelectTrigger className="bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sine">Sine (Smooth)</SelectItem>
              <SelectItem value="square">Square (Sharp)</SelectItem>
              <SelectItem value="triangle">Triangle (Soft)</SelectItem>
              <SelectItem value="sawtooth">Sawtooth (Buzzy)</SelectItem>
              {customSounds.length > 0 && (
                <SelectItem value="custom">🎵 Custom Sound</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Custom sound selector - shown when custom is selected */}
        {tone === 'custom' && customSounds.length > 0 && (
          <div>
            <Label className="block text-sm font-medium mb-2">Custom Sound</Label>
            <Select
              value={selectedCustomSound || ''}
              onValueChange={(v) => {
                setSelectedCustomSound(v);
                if (!isRunning) schedulePreview();
              }}
              disabled={isRunning}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select a custom sound" />
              </SelectTrigger>
              <SelectContent>
                {customSounds.map(sound => (
                  <SelectItem key={sound.id} value={sound.id}>
                    <div className="flex items-center gap-2">
                      <Music className="h-3 w-3" />
                      {sound.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Custom sound upload and management */}
        <div className="space-y-3">
          <Label className="block text-sm font-medium">Custom Sounds</Label>
          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              id="custom-sound-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRunning}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Custom Sound
            </Button>
          </div>
          
          {/* List of custom sounds */}
          {customSounds.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {customSounds.map(sound => (
                <div 
                  key={sound.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Music className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{sound.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        const audio = new Audio(sound.dataUrl);
                        audio.volume = volume / 100;
                        audio.play();
                      }}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCustomSound(sound.id)}
                      disabled={isRunning}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Upload MP3, WAV, or OGG files (max 1MB) to use as notification sounds
          </p>
        </div>

        {/* Frequency slider - only show for oscillator tones */}
        {tone !== 'custom' && (
          <div>
            <Label className="block text-sm font-medium mb-2">
              Frequency: {frequency}Hz
            </Label>
            <Slider
              value={[frequency]}
              onValueChange={handleFrequencyChange}
              min={200}
              max={2000}
              step={50}
              disabled={isRunning}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="h-4 w-4" />
            <Label className="text-sm font-medium">
              Volume: {volume}%
            </Label>
          </div>
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            min={0}
            max={100}
            step={5}
            disabled={isRunning}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Mute</span>
            <span>Max</span>
          </div>
        </div>

        <Button
          onClick={() => playChime()}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={isRunning}
        >
          Test Chime Sound
        </Button>
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

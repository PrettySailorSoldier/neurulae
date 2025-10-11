import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SoundSignatureWidget } from '@/types';
import { Music, Settings, Plus, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SoundSignatureWidgetProps {
  widget: SoundSignatureWidget;
  onLogSession: (soundType: string, duration: number, productivity: number, mood: string, activity: string) => void;
  onEdit: () => void;
}

export function SoundSignatureWidget({ widget, onLogSession, onEdit }: SoundSignatureWidgetProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [soundType, setSoundType] = useState('');
  const [duration, setDuration] = useState('30');
  const [productivity, setProductivity] = useState([7]);
  const [mood, setMood] = useState('focused');
  const [activity, setActivity] = useState(widget.trackedActivities[0] || 'focus');

  const handleLogSession = () => {
    if (soundType && duration) {
      onLogSession(soundType, parseInt(duration), productivity[0], mood, activity);
      setSoundType('');
      setDuration('30');
      setProductivity([7]);
      setDialogOpen(false);
    }
  };

  // Calculate top performing sound types
  const soundStats = widget.soundSessions.reduce((acc, session) => {
    if (!acc[session.soundType]) {
      acc[session.soundType] = { count: 0, avgProductivity: 0, totalProductivity: 0 };
    }
    acc[session.soundType].count++;
    acc[session.soundType].totalProductivity += session.productivity;
    acc[session.soundType].avgProductivity = 
      acc[session.soundType].totalProductivity / acc[session.soundType].count;
    return acc;
  }, {} as Record<string, { count: number; avgProductivity: number; totalProductivity: number }>);

  const topSounds = Object.entries(soundStats)
    .sort((a, b) => b[1].avgProductivity - a[1].avgProductivity)
    .slice(0, 3);

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              {widget.title}
            </CardTitle>
            <CardDescription>Find your productivity soundtrack</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {widget.soundSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Log your first sound session to discover patterns</p>
          </div>
        ) : (
          <>
            {/* Top Sounds */}
            {topSounds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Your Best Sounds
                </h4>
                <div className="space-y-1">
                  {topSounds.map(([sound, stats]) => (
                    <div key={sound} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2">
                      <span className="text-sm font-medium">{sound}</span>
                      <Badge variant="secondary">
                        {stats.avgProductivity.toFixed(1)}/10
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Playlists */}
            {widget.playlists.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommended Playlists</h4>
                <div className="space-y-1">
                  {widget.playlists.slice(0, 3).map(playlist => (
                    <div key={playlist.id} className="bg-primary/5 rounded px-3 py-2">
                      <div className="text-sm font-medium">{playlist.name}</div>
                      <div className="text-xs text-muted-foreground">
                        For {playlist.forActivity} • {Math.round(playlist.confidence * 100)}% match
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Log Sound Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Sound Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What were you listening to?</Label>
                <Input
                  value={soundType}
                  onChange={(e) => setSoundType(e.target.value)}
                  placeholder="e.g., Lo-fi hip hop, Classical, White noise"
                />
              </div>

              <div className="space-y-2">
                <Label>Activity Type</Label>
                <Select value={activity} onValueChange={setActivity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {widget.trackedActivities.map(act => (
                      <SelectItem key={act} value={act} className="capitalize">
                        {act}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2">
                <Label>Productivity: {productivity[0]}/10</Label>
                <Slider
                  value={productivity}
                  onValueChange={setProductivity}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Your Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="focused">Focused</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="stressed">Stressed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleLogSession} className="w-full" disabled={!soundType || !duration}>
                <Music className="h-4 w-4 mr-2" />
                Log Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

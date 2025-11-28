import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MoodGardenWidget, MoodEntry } from '@/types';
import { Sprout, Flower2, Settings, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface MoodGardenWidgetProps {
  widget: MoodGardenWidget;
  onLogMood: (emotion: string, intensity: number, note?: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const emotionEmojis: Record<string, string> = {
  joy: '😊',
  calm: '😌',
  energetic: '⚡',
  anxious: '😰',
  sad: '😢',
  focused: '🎯',
  creative: '🎨',
  tired: '😴',
};

const getPlantEmoji = (stage: string) => {
  switch (stage) {
    case 'seed': return '🌱';
    case 'sprout': return '🌿';
    case 'growing': return '🪴';
    case 'blooming': return '🌸';
    default: return '🌱';
  }
};

export function MoodGardenWidget({ widget, onLogMood, onEdit, onDelete }: MoodGardenWidgetProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emotion, setEmotion] = useState(widget.trackedEmotions[0] || 'joy');
  const [intensity, setIntensity] = useState([5]);
  const [note, setNote] = useState('');

  const handleLogMood = () => {
    onLogMood(emotion, intensity[0], note || undefined);
    setNote('');
    setIntensity([5]);
    setDialogOpen(false);
  };

  const recentMoods = widget.moodEntries.slice(-5).reverse();

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              {widget.title}
            </CardTitle>
            <CardDescription>Grow your emotional garden</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Garden Display */}
        <div className="bg-gradient-to-b from-sky-100 to-green-100 dark:from-sky-950 dark:to-green-950 rounded-lg p-4 min-h-[120px]">
          <div className="flex gap-3 flex-wrap">
            {widget.plants.length === 0 ? (
              <div className="text-center w-full py-4 text-muted-foreground">
                <p className="text-sm">Your garden is empty. Log your first mood to plant a seed! 🌱</p>
              </div>
            ) : (
              widget.plants.map(plant => (
                <div key={plant.id} className="text-center">
                  <div className="text-4xl mb-1">{getPlantEmoji(plant.stage)}</div>
                  <div className="text-xs font-medium">{emotionEmojis[plant.type] || '💚'}</div>
                  <div className="text-xs text-muted-foreground">{plant.health}%</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Moods */}
        {recentMoods.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Moods</h4>
            <div className="space-y-1">
              {recentMoods.map(mood => (
                <div key={mood.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded px-2 py-1">
                  <span className="text-lg">{emotionEmojis[mood.emotion] || '💚'}</span>
                  <span className="flex-1 capitalize">{mood.emotion}</span>
                  <span className="text-muted-foreground">{mood.intensity}/10</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log Mood Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Log Mood
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Your Mood</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Emotion</Label>
                <Select value={emotion} onValueChange={setEmotion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {widget.trackedEmotions.map(e => (
                      <SelectItem key={e} value={e}>
                        <span className="flex items-center gap-2">
                          <span>{emotionEmojis[e] || '💚'}</span>
                          <span className="capitalize">{e}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Intensity: {intensity[0]}/10</Label>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's happening right now?"
                  rows={3}
                />
              </div>

              <Button onClick={handleLogMood} className="w-full">
                <Flower2 className="h-4 w-4 mr-2" />
                Water Your Garden
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

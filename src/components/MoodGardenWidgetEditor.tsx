import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoodGardenWidget } from '@/types';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface MoodGardenWidgetEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget?: MoodGardenWidget;
  onSave: (data: Omit<MoodGardenWidget, 'id'> & { id?: string }) => void;
}

const defaultEmotions = ['joy', 'calm', 'energetic', 'anxious', 'sad', 'focused', 'creative', 'tired'];

export function MoodGardenWidgetEditor({ open, onOpenChange, widget, onSave }: MoodGardenWidgetEditorProps) {
  const [title, setTitle] = useState(widget?.title || 'My Mood Garden');
  const [trackedEmotions, setTrackedEmotions] = useState<string[]>(
    widget?.trackedEmotions || ['joy', 'calm', 'anxious', 'energetic']
  );
  const [newEmotion, setNewEmotion] = useState('');

  const handleSave = () => {
    const data: Omit<MoodGardenWidget, 'id'> & { id?: string } = {
      ...(widget?.id && { id: widget.id }),
      type: 'mood-garden',
      title,
      moodEntries: widget?.moodEntries || [],
      plants: widget?.plants || [],
      trackedEmotions,
    };
    onSave(data);
    onOpenChange(false);
  };

  const addEmotion = (emotion: string) => {
    if (emotion && !trackedEmotions.includes(emotion)) {
      setTrackedEmotions([...trackedEmotions, emotion]);
      setNewEmotion('');
    }
  };

  const removeEmotion = (emotion: string) => {
    setTrackedEmotions(trackedEmotions.filter(e => e !== emotion));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{widget ? 'Edit' : 'Create'} Mood Garden</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Garden Name</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Mood Garden"
            />
          </div>

          <div className="space-y-2">
            <Label>Tracked Emotions</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {trackedEmotions.map(emotion => (
                <Badge key={emotion} variant="secondary" className="capitalize">
                  {emotion}
                  <button
                    onClick={() => removeEmotion(emotion)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newEmotion}
                onChange={(e) => setNewEmotion(e.target.value)}
                placeholder="Add custom emotion..."
                onKeyDown={(e) => e.key === 'Enter' && addEmotion(newEmotion)}
              />
              <Button onClick={() => addEmotion(newEmotion)} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Quick add:
              <div className="flex flex-wrap gap-1 mt-1">
                {defaultEmotions
                  .filter(e => !trackedEmotions.includes(e))
                  .map(emotion => (
                    <Button
                      key={emotion}
                      variant="ghost"
                      size="sm"
                      onClick={() => addEmotion(emotion)}
                      className="h-7 text-xs capitalize"
                    >
                      {emotion}
                    </Button>
                  ))}
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            {widget ? 'Save Changes' : 'Create Garden'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

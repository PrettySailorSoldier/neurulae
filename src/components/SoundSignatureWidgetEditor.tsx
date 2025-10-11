import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SoundSignatureWidget } from '@/types';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface SoundSignatureWidgetEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget?: SoundSignatureWidget;
  onSave: (data: Omit<SoundSignatureWidget, 'id'> & { id?: string }) => void;
}

const defaultActivities = ['focus', 'creative', 'relaxing', 'exercise', 'social', 'study'];

export function SoundSignatureWidgetEditor({ 
  open, 
  onOpenChange, 
  widget, 
  onSave 
}: SoundSignatureWidgetEditorProps) {
  const [title, setTitle] = useState(widget?.title || 'Sound Signature');
  const [trackedActivities, setTrackedActivities] = useState<string[]>(
    widget?.trackedActivities || ['focus', 'creative', 'relaxing']
  );
  const [newActivity, setNewActivity] = useState('');

  const handleSave = () => {
    const data: Omit<SoundSignatureWidget, 'id'> & { id?: string } = {
      ...(widget?.id && { id: widget.id }),
      type: 'sound-signature',
      title,
      soundSessions: widget?.soundSessions || [],
      playlists: widget?.playlists || [],
      trackedActivities,
    };
    onSave(data);
    onOpenChange(false);
  };

  const addActivity = (activity: string) => {
    if (activity && !trackedActivities.includes(activity)) {
      setTrackedActivities([...trackedActivities, activity]);
      setNewActivity('');
    }
  };

  const removeActivity = (activity: string) => {
    if (trackedActivities.length > 1) {
      setTrackedActivities(trackedActivities.filter(a => a !== activity));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{widget ? 'Edit' : 'Create'} Sound Signature Widget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Widget Name</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sound Signature"
            />
          </div>

          <div className="space-y-2">
            <Label>Tracked Activities</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {trackedActivities.map(activity => (
                <Badge key={activity} variant="secondary" className="capitalize">
                  {activity}
                  {trackedActivities.length > 1 && (
                    <button
                      onClick={() => removeActivity(activity)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Add activity type..."
                onKeyDown={(e) => e.key === 'Enter' && addActivity(newActivity)}
              />
              <Button onClick={() => addActivity(newActivity)} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Quick add:
              <div className="flex flex-wrap gap-1 mt-1">
                {defaultActivities
                  .filter(a => !trackedActivities.includes(a))
                  .map(activity => (
                    <Button
                      key={activity}
                      variant="ghost"
                      size="sm"
                      onClick={() => addActivity(activity)}
                      className="h-7 text-xs capitalize"
                    >
                      {activity}
                    </Button>
                  ))}
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            {widget ? 'Save Changes' : 'Create Widget'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ParallelUniverseWidget } from '@/types';

interface ParallelUniverseWidgetEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget?: ParallelUniverseWidget;
  onSave: (data: Omit<ParallelUniverseWidget, 'id'> & { id?: string }) => void;
}

export function ParallelUniverseWidgetEditor({ 
  open, 
  onOpenChange, 
  widget, 
  onSave 
}: ParallelUniverseWidgetEditorProps) {
  const [title, setTitle] = useState(widget?.title || 'Parallel Universe Me');
  const [aiEnabled, setAiEnabled] = useState(widget?.aiEnabled ?? true);

  const handleSave = () => {
    const data: Omit<ParallelUniverseWidget, 'id'> & { id?: string } = {
      ...(widget?.id && { id: widget.id }),
      type: 'parallel-universe',
      title,
      decisions: widget?.decisions || [],
      alternateOutcomes: widget?.alternateOutcomes || [],
      aiEnabled,
    };
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{widget ? 'Edit' : 'Create'} Parallel Universe Widget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Widget Name</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Parallel Universe Me"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI-Generated Outcomes</Label>
              <div className="text-sm text-muted-foreground">
                Use AI to explore what might have happened with different choices
              </div>
            </div>
            <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>

          <Button onClick={handleSave} className="w-full">
            {widget ? 'Save Changes' : 'Create Widget'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

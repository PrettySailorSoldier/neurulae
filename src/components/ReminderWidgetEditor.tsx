import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReminderWidget, ReminderItem } from '@/types';
import { Plus, X, GripVertical } from 'lucide-react';

interface ReminderWidgetEditorProps {
  open: boolean;
  onClose: () => void;
  widget?: ReminderWidget;
  onSave: (widgetData: Omit<ReminderWidget, 'id' | 'createdAt'>) => void;
}

export const ReminderWidgetEditor = ({
  open,
  onClose,
  widget,
  onSave,
}: ReminderWidgetEditorProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resetSchedule, setResetSchedule] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setDescription(widget.description || '');
      setResetSchedule(widget.resetSchedule);
      setItems(widget.items);
    } else {
      setTitle('');
      setDescription('');
      setResetSchedule('none');
      setItems([]);
    }
  }, [widget, open]);

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: ReminderItem = {
        id: crypto.randomUUID(),
        text: newItemText.trim(),
        completed: false,
        order: items.length,
      };
      setItems([...items, newItem]);
      setNewItemText('');
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      resetSchedule,
      items: items.map((item, index) => ({ ...item, order: index })),
      lastResetDate: widget?.lastResetDate,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {widget ? 'Edit Reminder Widget' : 'Create Reminder Widget'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Widget Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Routine, Daily Checklist"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this widget..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-schedule">Reset Schedule</Label>
            <Select value={resetSchedule} onValueChange={(value: any) => setResetSchedule(value)}>
              <SelectTrigger id="reset-schedule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Never reset</SelectItem>
                <SelectItem value="daily">Reset daily</SelectItem>
                <SelectItem value="weekly">Reset weekly</SelectItem>
                <SelectItem value="monthly">Reset monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              When enabled, all items will be unchecked on the schedule
            </p>
          </div>

          <div className="space-y-2">
            <Label>Checklist Items</Label>
            <div className="flex gap-2">
              <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add a new item..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <Button onClick={handleAddItem} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1 mt-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items yet. Add your first item above.
                </p>
              ) : (
                items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 bg-accent/50 rounded-md group"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{item.text}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {widget ? 'Save Changes' : 'Create Widget'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

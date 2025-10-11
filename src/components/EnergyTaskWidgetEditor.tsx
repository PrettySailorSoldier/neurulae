import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EnergyTaskWidget } from "@/types";

interface EnergyTaskWidgetEditorProps {
  open: boolean;
  onClose: () => void;
  widget?: EnergyTaskWidget;
  onSave: (widget: Omit<EnergyTaskWidget, 'id'> & { id?: string }) => void;
}

export const EnergyTaskWidgetEditor = ({ open, onClose, widget, onSave }: EnergyTaskWidgetEditorProps) => {
  const [title, setTitle] = useState("Energy-Task Harmony");
  const [taskSuggestionsEnabled, setTaskSuggestionsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [trackedCategories, setTrackedCategories] = useState<Array<'mental' | 'physical' | 'creative' | 'social'>>(['mental', 'physical']);

  useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setTaskSuggestionsEnabled(widget.taskSuggestionsEnabled);
      setNotificationsEnabled(widget.notificationsEnabled);
      setTrackedCategories(widget.trackedCategories);
    } else {
      setTitle("Energy-Task Harmony");
      setTaskSuggestionsEnabled(true);
      setNotificationsEnabled(false);
      setTrackedCategories(['mental', 'physical']);
    }
  }, [widget, open]);

  const handleSave = () => {
    onSave({
      ...(widget?.id && { id: widget.id }),
      type: 'energy-task-harmony',
      title,
      energyLogs: widget?.energyLogs || [],
      taskSuggestionsEnabled,
      notificationsEnabled,
      trackedCategories,
      linkedTasks: widget?.linkedTasks || [],
    });
    onClose();
  };

  const categories: Array<'mental' | 'physical' | 'creative' | 'social'> = ['mental', 'physical', 'creative', 'social'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{widget ? 'Edit' : 'Create'} Energy-Task Harmony Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Widget Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Energy Tracker"
            />
          </div>

          <div className="space-y-3">
            <Label>Energy Categories to Track</Label>
            {categories.map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={trackedCategories.includes(category)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setTrackedCategories([...trackedCategories, category]);
                    } else {
                      setTrackedCategories(trackedCategories.filter(c => c !== category));
                    }
                  }}
                />
                <label
                  htmlFor={category}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                >
                  {category}
                </label>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="suggestions"
              checked={taskSuggestionsEnabled}
              onCheckedChange={(checked) => setTaskSuggestionsEnabled(checked as boolean)}
            />
            <label
              htmlFor="suggestions"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable AI task suggestions based on energy levels
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={(checked) => setNotificationsEnabled(checked as boolean)}
            />
            <label
              htmlFor="notifications"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable optimal task window notifications
            </label>
          </div>

          <div className="text-xs text-muted-foreground p-3 rounded bg-accent/50">
            💡 Tip: Log your energy 2-3 times daily for a week to get accurate AI recommendations
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || trackedCategories.length === 0}>
            Save Widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Common list icons
const LIST_ICONS = [
  '📋', '📝', '✅', '⭐', '🎯', '📅', '🏠', '💼',
  '📚', '💡', '🔥', '🌟', '💪', '🎨', '🛒', '📞'
];

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, icon?: string, color?: string) => void;
}

export const CreateListDialog = ({
  open,
  onOpenChange,
  onCreate,
}: CreateListDialogProps) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(undefined);

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), selectedIcon);
      setName('');
      setSelectedIcon(undefined);
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create new list</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="list-name">List name</Label>
            <Input
              id="list-name"
              placeholder="e.g., Cleaning, Shopping, Projects..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label>Icon (optional)</Label>
            <div className="flex flex-wrap gap-1">
              {LIST_ICONS.map(icon => (
                <Button
                  key={icon}
                  type="button"
                  variant={selectedIcon === icon ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8 text-base"
                  onClick={() => setSelectedIcon(selectedIcon === icon ? undefined : icon)}
                >
                  {icon}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

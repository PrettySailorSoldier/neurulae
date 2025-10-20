import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const shortcuts = [
    { key: 'Cmd/Ctrl + K', action: 'Toggle AI Assistant' },
    { key: '?', action: 'Show keyboard shortcuts' },
    { key: 'Tab', action: 'Navigate between elements' },
    { key: 'Enter', action: 'Activate focused element' },
    { key: 'Space', action: 'Toggle checkboxes/buttons' },
    { key: 'Esc', action: 'Close dialogs/cancel' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="keyboard-shortcuts-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription id="keyboard-shortcuts-description">
            Use these shortcuts to navigate Neurulae efficiently
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <Card key={index} className="bg-card/50">
              <CardContent className="flex items-center justify-between p-3">
                <span className="text-sm">{shortcut.action}</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border">
                  {shortcut.key}
                </kbd>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

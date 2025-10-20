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
    { key: 'Cmd/Ctrl + K', action: 'Toggle AI Assistant', description: 'Open or close the AI chat' },
    { key: '?', action: 'Show keyboard shortcuts', description: 'View this help dialog' },
    { key: 'Tab', action: 'Navigate between elements', description: 'Move focus to next interactive element' },
    { key: 'Shift + Tab', action: 'Navigate backwards', description: 'Move focus to previous element' },
    { key: 'Enter', action: 'Activate focused element', description: 'Click buttons, submit forms' },
    { key: 'Space', action: 'Toggle checkboxes/buttons', description: 'Check/uncheck, activate buttons' },
    { key: 'Esc', action: 'Close dialogs', description: 'Close open dialogs and modals' },
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
            <Card key={index} className="bg-card/50 transition-shadow hover:shadow-md">
              <CardContent className="flex items-start justify-between p-3 gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{shortcut.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{shortcut.description}</p>
                </div>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border shrink-0">
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

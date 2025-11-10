import { X, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  if (!isOpen) return null;

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 w-[400px] h-[600px]",
      "flex flex-col shadow-elevated z-50",
      "animate-scale-in"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">AI Assistant</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Pin chat"
          >
            <Pin className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            title="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
              AI
            </div>
            <div className="flex-1 bg-muted rounded-lg p-3">
              <p className="text-sm">
                Hello! I'm your AI productivity coach. I'm here to help you prioritize tasks, 
                balance your schedule, and achieve your goals. What would you like to work on today?
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            className="resize-none min-h-[44px]"
            rows={2}
          />
          <Button className="self-end">
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}

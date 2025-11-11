import { useState, useRef, useEffect } from 'react';
import { X, Minus, GripVertical, Send, Loader2, Trash2, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAIChat } from '@/hooks/useAIChat';
import { Task, TimeBlock, Playbook } from '@/types';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  playbooks: Playbook[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onUpdateTimeBlock: (blockId: string, updates: Partial<TimeBlock>) => void;
  onAddTimeBlock: (block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onAddPlaybook: (playbook: Omit<Playbook, 'id' | 'createdAt'>) => void;
  onUpdatePlaybook: (id: string, updates: Partial<Playbook>) => void;
}

export function ChatPanel({ 
  isOpen, 
  onClose,
  tasks,
  timeBlocks,
  playbooks,
  onUpdateTask,
  onUpdateTimeBlock,
  onAddTimeBlock,
  onAddTask,
  onAddPlaybook,
  onUpdatePlaybook,
}: ChatPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem('chatPanelPinned');
    return saved ? JSON.parse(saved) : false;
  });
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('chatPanelPosition');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 420, y: window.innerHeight - 620 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, clearMessages } = useAIChat({
    tasks,
    timeBlocks,
    playbooks,
    onUpdateTask,
    onUpdateTimeBlock,
    onAddTimeBlock,
    onAddTask,
    onAddPlaybook,
    onUpdatePlaybook,
  });

  useEffect(() => {
    localStorage.setItem('chatPanelPosition', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem('chatPanelPinned', JSON.stringify(isPinned));
  }, [isPinned]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPinned && (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - (isMinimized ? 60 : 600), e.clientY - dragOffset.y));
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <Card 
      className={cn(
        "fixed flex flex-col shadow-elevated z-50 transition-all duration-300",
        isPinned 
          ? "bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl rounded-b-none" 
          : "w-[400px]",
        isMinimized ? "h-[60px]" : isPinned ? "h-[70vh]" : "h-[600px]",
        isDragging && "cursor-move"
      )}
      style={isPinned ? {} : { left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-4 border-b bg-muted/30",
        !isPinned && "drag-handle cursor-move"
      )}>
        <div className="flex items-center gap-2">
          {!isPinned && <GripVertical className="h-4 w-4 text-muted-foreground" />}
          <h3 className="font-semibold text-lg">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? "Unpin (floating mode)" : "Pin to bottom"}
          >
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (confirm('Clear chat history?')) {
                clearMessages();
              }
            }}
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            <Minus className="h-4 w-4" />
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

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                    AI
                  </div>
                  <div className="flex-1 bg-muted rounded-lg p-3">
                    <p className="text-sm">
                      Hello! I'm your AI productivity coach. I can help you create tasks, organize playbooks, 
                      manage your schedule, and more. What would you like to work on?
                    </p>
                  </div>
                </div>
              )}
              {messages.map((message, idx) => (
                <div key={idx} className={cn(
                  "flex items-start gap-3",
                  message.role === 'user' && "flex-row-reverse"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                    message.role === 'assistant' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-accent text-accent-foreground"
                  )}>
                    {message.role === 'assistant' ? 'AI' : 'You'}
                  </div>
                  <div className={cn(
                    "flex-1 rounded-lg p-3 prose prose-sm max-w-none",
                    message.role === 'assistant' 
                      ? "bg-muted" 
                      : "bg-accent"
                  )}>
                    {message.role === 'assistant' ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                    AI
                  </div>
                  <div className="flex-1 bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                className="resize-none min-h-[44px]"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button 
                className="self-end" 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

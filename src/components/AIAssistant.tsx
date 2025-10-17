import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Send, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Task, TimeBlock } from '@/types';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  onUpdateTasks?: (tasks: Task[]) => void;
  onUpdateTimeBlocks?: (blocks: TimeBlock[]) => void;
}

export function AIAssistant({
  open,
  onOpenChange,
  tasks,
  timeBlocks,
  onUpdateTasks,
  onUpdateTimeBlocks,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm Neurulae, your expert scheduling assistant. I'm here to help you optimize your time, manage your tasks, and achieve your goals. What would you like to work on today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: messages.concat(userMessage).map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            tasks: tasks.map(t => ({
              id: t.id,
              title: t.title,
              completed: t.completed,
              dueDate: t.dueDate,
              focusTimeMinutes: t.focusTimeMinutes,
              eisenhowerQuadrant: t.eisenhowerQuadrant,
            })),
            timeBlocks: timeBlocks.map(b => ({
              id: b.id,
              title: b.title,
              startTime: b.startTime,
              endTime: b.endTime,
              type: b.type,
            })),
            currentDate: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle any actions the AI suggests
      if (data.actions) {
        handleAIActions(data.actions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAIActions = (actions: any) => {
    // Handle various AI-suggested actions
    if (actions.updateTasks && onUpdateTasks) {
      onUpdateTasks(actions.updateTasks);
      toast({
        title: 'Tasks Updated',
        description: 'Your tasks have been reorganized based on AI suggestions.',
      });
    }
    if (actions.updateTimeBlocks && onUpdateTimeBlocks) {
      onUpdateTimeBlocks(actions.updateTimeBlocks);
      toast({
        title: 'Schedule Updated',
        description: 'Your time blocks have been optimized.',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Neurulae AI Assistant
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </Card>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <Card className="bg-muted p-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your schedule, tasks, or productivity..."
            className="resize-none"
            rows={2}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

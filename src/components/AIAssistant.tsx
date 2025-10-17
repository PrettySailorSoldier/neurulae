import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Task, TimeBlock } from '@/types';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onUpdateTimeBlock: (blockId: string, updates: Partial<TimeBlock>) => void;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  stuckMode?: boolean;
  onStuckModeComplete?: () => void;
}

export function AIAssistant({
  open,
  onOpenChange,
  onUpdateTask,
  onUpdateTimeBlock,
  tasks,
  timeBlocks,
  stuckMode = false,
  onStuckModeComplete,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial message for stuck mode
  useEffect(() => {
    if (open && stuckMode && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "I'm here to help you figure out what needs your attention today. Let's take this step by step. First, do you have work or school today?",
        timestamp: new Date().toISOString(),
      }]);
    } else if (open && !stuckMode && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm your AI productivity coach. I'm here to help you prioritize tasks, balance your schedule, and achieve your goals. What would you like to work on today?",
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [open, stuckMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content })),
          context: {
            tasks,
            timeBlocks,
            currentDate: new Date().toISOString(),
          },
          mode: stuckMode ? 'stuck_interview' : undefined,
        },
      });

      if (functionError) throw functionError;

      const assistantMessage: Message = {
        role: 'assistant',
        content: functionData.message,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle any AI-suggested actions
      if (functionData.actions) {
        handleAIActions(functionData.actions);
      }
    } catch (error) {
      console.error('Error in AI assistant:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIActions = (actions: any) => {
    if (actions.updateTask) {
      onUpdateTask(actions.updateTask.taskId, actions.updateTask.updates);
      toast({
        title: 'Task Updated',
        description: 'Task has been updated based on AI suggestion.',
      });
    }
    if (actions.updateTimeBlock) {
      onUpdateTimeBlock(actions.updateTimeBlock.blockId, actions.updateTimeBlock.updates);
      toast({
        title: 'Time Block Updated',
        description: 'Time block has been updated.',
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
            <Brain className="w-5 h-5" />
            {stuckMode ? "I'm Stuck - Let's Figure This Out" : "AI Productivity Coach"}
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
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </Card>
              </div>
            ))}
            {isLoading && (
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
            placeholder={stuckMode ? "Tell me what's on your mind..." : "Ask me about your tasks, schedule, or productivity..."}
            className="resize-none"
            rows={2}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
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

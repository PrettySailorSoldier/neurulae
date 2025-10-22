import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Task, TimeBlock, Playbook } from '@/types';
import { format, isToday } from 'date-fns';
import ReactMarkdown from 'react-markdown';

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
  onAddTimeBlock: (block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  playbooks: Playbook[];
  onAddPlaybook: (playbook: Omit<Playbook, 'id' | 'createdAt'>) => void;
  onUpdatePlaybook: (id: string, updates: Partial<Playbook>) => void;
  stuckMode?: boolean;
  onStuckModeComplete?: () => void;
  initialMessage?: string;
}

const calculateAvailableWindows = (blocks: TimeBlock[]) => {
  const now = new Date();
  const todayBlocks = blocks
    .filter(block => {
      const blockDate = new Date(block.startTime);
      return isToday(blockDate);
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  const windows = [];
  let lastEnd = now;
  
  for (const block of todayBlocks) {
    const blockStart = new Date(block.startTime);
    if (blockStart > lastEnd) {
      const duration = Math.round((blockStart.getTime() - lastEnd.getTime()) / (1000 * 60));
      if (duration >= 15) {
        windows.push({
          start: format(lastEnd, 'h:mm a'),
          end: format(blockStart, 'h:mm a'),
          duration: `${duration} minutes`
        });
      }
    }
    const blockEnd = new Date(block.endTime);
    lastEnd = blockEnd > lastEnd ? blockEnd : lastEnd;
  }
  
  return windows;
};

export function AIAssistant({
  open,
  onOpenChange,
  onUpdateTask,
  onUpdateTimeBlock,
  onAddTimeBlock,
  onAddTask,
  tasks,
  timeBlocks,
  playbooks,
  onAddPlaybook,
  onUpdatePlaybook,
  stuckMode = false,
  onStuckModeComplete,
  initialMessage,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load or create conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      if (!open) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to get the most recent conversation
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingConversation) {
        setConversationId(existingConversation.id);
        
        // Load message history
        const { data: messageHistory } = await supabase
          .from('chat_messages')
          .select('role, content, created_at')
          .eq('conversation_id', existingConversation.id)
          .order('created_at', { ascending: true });

        if (messageHistory && messageHistory.length > 0) {
          setMessages(messageHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.created_at
          })));
        } else {
          // Set initial message if no history
          setInitialMessage();
        }
      } else {
        // Create new conversation
        const { data: newConversation } = await supabase
          .from('conversations')
          .insert({ user_id: user.id, title: 'New Conversation' })
          .select()
          .single();

        if (newConversation) {
          setConversationId(newConversation.id);
          setInitialMessage();
        }
      }
    };

    const setInitialMessage = () => {
      if (stuckMode) {
        setMessages([{
          role: 'assistant',
          content: "I'm here to help you figure out what needs your attention today. Let's take this step by step. First, do you have work or school today?",
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setMessages([{
          role: 'assistant',
          content: "Hello! I'm your AI productivity coach. I'm here to help you prioritize tasks, balance your schedule, and achieve your goals. What would you like to work on today?",
          timestamp: new Date().toISOString(),
        }]);
      }
    };

    initConversation();
  }, [open, stuckMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle initial message from quick actions
  useEffect(() => {
    if (initialMessage && open) {
      setInput(initialMessage);
    }
  }, [initialMessage, open]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !conversationId) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message to database
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage.content
    });

    try {
      // Fetch user profile
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      let profileData = null;
      let scheduleEntries: any[] = [];
      
      if (currentUser) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        profileData = data;

        // Fetch upcoming schedule entries
        const { data: entries } = await supabase
          .from('schedule_entries')
          .select('*')
          .eq('user_id', currentUser.id)
          .gte('end_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(20);
        
        scheduleEntries = entries || [];
      }

      // Build comprehensive temporal context with accurate local time
      const now = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Format current time accurately
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      
      const temporalContext = {
        timestamp: now.toISOString(),
        localDate: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        localTime: formattedTime,
        dayOfWeek: now.getDay(),
        dayName: dayNames[now.getDay()],
        hour24: hours,
        minute: minutes,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const { data: functionData, error: functionError } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content })),
          context: {
            tasks,
            timeBlocks,
            playbooks,
            currentDate: now.toISOString(),
            currentTime: formattedTime,
            temporal: temporalContext,
            todaySchedule: timeBlocks
              .filter(block => {
                const blockDate = new Date(block.startTime);
                return isToday(blockDate);
              })
              .map(block => ({
                title: block.title,
                startTime: format(new Date(block.startTime), 'h:mm a'),
                endTime: format(new Date(block.endTime), 'h:mm a'),
                duration: `${Math.round((new Date(block.endTime).getTime() - new Date(block.startTime).getTime()) / (1000 * 60))} minutes`
              })),
            availableTimeWindows: calculateAvailableWindows(timeBlocks),
            upcomingSchedule: scheduleEntries.map(entry => ({
              title: entry.title,
              description: entry.description,
              startTime: format(new Date(entry.start_time), 'MMM d, h:mm a'),
              endTime: format(new Date(entry.end_time), 'h:mm a'),
              category: entry.category,
              location: entry.location,
            })),
          },
          userProfile: profileData ? {
            aiStyle: profileData.ai_coaching_style,
            livingAlone: profileData.living_situation === 'alone',
            workSchedule: profileData.work_schedule || [],
          } : null,
          mode: stuckMode ? 'stuck_interview' : undefined,
        },
      });

      if (functionError) {
        // Extract specific error message from backend if available
        const errorMsg = functionData?.error || functionError.message || 'Failed to get AI response';
        throw new Error(errorMsg);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: functionData.message,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage.content
      });

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

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
        title: '✅ Task Updated',
        description: 'Task has been updated based on AI suggestion.',
        className: 'animate-fade-in',
      });
    }
    if (actions.updateTimeBlock) {
      onUpdateTimeBlock(actions.updateTimeBlock.blockId, actions.updateTimeBlock.updates);
      toast({
        title: '⏰ Time Block Updated',
        description: 'Time block has been updated.',
        className: 'animate-fade-in',
      });
    }
    if (actions.createTasks && onAddTask) {
      const tasksToCreate = Array.isArray(actions.createTasks) ? actions.createTasks : [actions.createTasks];
      tasksToCreate.forEach((task: any) => {
        onAddTask({
          title: task.title,
          eisenhowerQuadrant: task.eisenhowerQuadrant || 'not-urgent-important',
          focusTimeMinutes: task.estimatedMinutes || null,
          completed: false,
          notes: task.notes || '',
          subtasks: [],
        });
      });
      toast({
        title: `✅ ${tasksToCreate.length === 1 ? 'Task' : 'Tasks'} Created`,
        description: `Added ${tasksToCreate.length} task${tasksToCreate.length > 1 ? 's' : ''} to your list.`,
        className: 'animate-scale-in border-primary/50',
      });
    }
    if (actions.createPlaybook) {
      onAddPlaybook({
        title: actions.createPlaybook.title,
        description: actions.createPlaybook.description || '',
        category: actions.createPlaybook.category || 'productivity',
        steps: actions.createPlaybook.steps,
        isTemplate: false,
        linkedTaskIds: [],
        resetOnRecurrence: false,
      });
      toast({
        title: '📖 Playbook Created',
        description: `"${actions.createPlaybook.title}" is ready to use.`,
        className: 'animate-scale-in border-primary/50',
      });
    }
    if (actions.updatePlaybook) {
      onUpdatePlaybook(actions.updatePlaybook.id, {
        steps: actions.updatePlaybook.steps,
        title: actions.updatePlaybook.title,
        description: actions.updatePlaybook.description,
      });
      toast({
        title: '📖 Playbook Updated',
        description: 'Playbook has been modified.',
        className: 'animate-fade-in',
      });
    }
    if (actions.createProject && onAddTask && onAddPlaybook) {
      // Create a main project task
      onAddTask({
        title: actions.createProject.title,
        eisenhowerQuadrant: 'not-urgent-important',
        focusTimeMinutes: null,
        completed: false,
        notes: actions.createProject.description || '',
        subtasks: [],
      });
      
      // Create associated playbook if provided
      if (actions.createProject.playbook) {
        onAddPlaybook({
          title: actions.createProject.playbook.title,
          description: actions.createProject.playbook.description || '',
          category: actions.createProject.playbook.category || 'productivity',
          steps: actions.createProject.playbook.steps,
          isTemplate: false,
          linkedTaskIds: [],
          resetOnRecurrence: false,
        });
      }
      
      toast({
        title: '🎯 Project Created',
        description: `"${actions.createProject.title}" project and resources are ready.`,
        className: 'animate-scale-in border-primary/50',
      });
    }
    // Handle both single and multiple time blocks
    if (actions.suggestTimeBlock) {
      const blocks = Array.isArray(actions.suggestTimeBlock) 
        ? actions.suggestTimeBlock 
        : [actions.suggestTimeBlock];
      
      blocks.forEach(block => {
        onAddTimeBlock({
          title: block.title,
          startTime: block.startTime,
          endTime: block.endTime,
          type: 'dedicated',
          scheduleType: 'everyday',
        });
      });
      
      toast({
        title: `⏰ Time Block${blocks.length > 1 ? 's' : ''} Added`,
        description: `Added ${blocks.length} time block${blocks.length > 1 ? 's' : ''} to your calendar.`,
        className: 'animate-scale-in border-primary/50',
      });
    }
    if (actions.createTimeBlock) {
      const blocks = Array.isArray(actions.createTimeBlock) 
        ? actions.createTimeBlock 
        : [actions.createTimeBlock];
      
      blocks.forEach(block => {
        onAddTimeBlock({
          title: block.title,
          startTime: block.startTime,
          endTime: block.endTime,
          type: 'dedicated',
          scheduleType: 'everyday',
        });
      });
      
      toast({
        title: '📅 Schedule Updated',
        description: `Added ${blocks.length} time block${blocks.length > 1 ? 's' : ''} to your calendar.`,
        className: 'animate-scale-in border-primary/50',
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
      <DialogContent className="max-w-2xl h-[600px] flex flex-col" aria-describedby="ai-assistant-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" aria-hidden="true" />
            {stuckMode ? "I'm Stuck - Let's Figure This Out" : "AI Productivity Coach"}
          </DialogTitle>
          <p id="ai-assistant-description" className="sr-only">
            Chat with your AI productivity coach to manage tasks, schedule time, and achieve your goals
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef} role="log" aria-label="Chat messages" aria-live="polite">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <Card
                  className={`max-w-[80%] p-4 break-words ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none break-words overflow-hidden">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-sm">{children}</li>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
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

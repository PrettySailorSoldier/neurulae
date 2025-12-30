import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Send, Loader2, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Task, TimeBlock, Playbook } from '@/types';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { cn } from '@/lib/utils';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isMobile } = useDeviceInfo();

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
          setMessages(prev => prev.length > 0 ? prev : messageHistory.map(msg => ({
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
        setMessages(prev => prev.length > 0 ? prev : [{
          role: 'assistant',
          content: "I'm here to help you figure out what needs your attention today. Let's take this step by step. First, do you have work or school today?",
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setMessages(prev => prev.length > 0 ? prev : [{
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
    console.log('[AIAssistant] sendMessage triggered', { hasInput: !!input.trim(), isLoading, hasConversation: !!conversationId });
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Ensure conversation exists or create one
    let convId = conversationId;
    if (!convId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: newConversation } = await supabase
          .from('conversations')
          .insert({ user_id: user.id, title: 'New Conversation' })
          .select()
          .single();
        if (newConversation) {
          convId = newConversation.id as string;
          setConversationId(newConversation.id);
        }
      }
    }

    // Save user message to database (if we have a conversation id)
    if (convId) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'user',
        content: userMessage.content
      });
    }

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

      // Create hidden system context with current date (not shown to user)
      const systemContext = `System Context: Today's date and time is ${temporalContext.localDate} at ${formattedTime} (${temporalContext.timezone}). You MUST use this exact date and time for all schedule-related analysis, organization, and planning. Do not use any other date or time from your training data.`;

      // Prepare messages for AI: prepend hidden system message
      const messagesForAI = [
        { role: 'system' as const, content: systemContext },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: userMessage.role, content: userMessage.content }
      ];

      // Get the current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to use the AI assistant.');
      }

      // Use fetch with streaming instead of supabase.functions.invoke
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForAI,
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = errorData?.error || `Request failed: ${response.status}`;

        if (errorMsg.includes('Auth session missing')) {
          throw new Error('Please sign in to use the AI assistant.');
        } else if (response.status === 429 || errorMsg.includes('rate limit')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (response.status === 402) {
          throw new Error('AI credits depleted. Please add credits to continue.');
        } else {
          throw new Error(`AI error: ${errorMsg}`);
        }
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      // Create an assistant message placeholder that we'll update as chunks arrive
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      // Add the empty message to the list - it will be updated as chunks arrive
      setMessages(prev => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';
      let extractedActions: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.text) {
                fullContent += parsed.text;
                // Update the assistant message with accumulated content
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
                  }
                  return updated;
                });
              }

              if (parsed.actions) {
                extractedActions = parsed.actions;
              }

              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip malformed SSE data (but throw if it's a real error)
              if (e instanceof Error && !e.message.includes('Unexpected token')) {
                console.debug('SSE parse skip:', e);
              }
            }
          }
        }
      }

      // Save assistant message to database
      if (convId && fullContent) {
        await supabase.from('chat_messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: fullContent
        });
      }

      // Update conversation's updated_at timestamp
      if (convId) {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId);
      }

      // Handle any AI-suggested actions from the stream
      if (extractedActions.length > 0) {
        handleAIActions(extractedActions);
      }

      // Also try to extract actions from the full content (JSON blocks)
      const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
      let match;
      while ((match = jsonBlockRegex.exec(fullContent)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.action && parsed.data) {
            handleAIActions([parsed]);
          } else if (Array.isArray(parsed)) {
            const validActions = parsed.filter((item: any) => item.action && item.data);
            if (validActions.length > 0) {
              handleAIActions(validActions);
            }
          }
        } catch (e) {
          console.debug('Failed to parse JSON block in AI response:', e);
        }
      }
    } catch (error) {
      console.error('Error in AI assistant:', error);
      const msg = error instanceof Error ? error.message : 'Failed to send message';
      toast({
        title: 'Error',
        description: msg.includes('Auth session missing') ? 'Please sign in to use the AI assistant.' : msg,
        variant: 'destructive',
      });

      // Remove the incomplete assistant message on error
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIActions = (actions: any[]) => {
    if (!Array.isArray(actions)) return;

    actions.forEach((actionItem: any) => {
      const { action, data } = actionItem;

      switch (action) {
        case 'update_task':
          onUpdateTask(data.taskId, data.updates);
          toast({
            title: '✅ Task Updated',
            description: 'Task has been updated based on AI suggestion.',
            className: 'animate-fade-in',
          });
          break;

        case 'update_time_block':
          onUpdateTimeBlock(data.blockId, data.updates);
          toast({
            title: '⏰ Time Block Updated',
            description: 'Time block has been updated.',
            className: 'animate-fade-in',
          });
          break;

        case 'create_task':
          if (onAddTask) {
            onAddTask({
              title: data.title,
              eisenhowerQuadrant: data.eisenhowerQuadrant || 'not-urgent-important',
              focusTimeMinutes: data.estimatedMinutes || null,
              completed: false,
              notes: data.notes || data.description || '',
              subtasks: [],
            });
            toast({
              title: '✅ Task Created',
              description: `Added "${data.title}" to your list.`,
              className: 'animate-scale-in border-primary/50',
            });
          }
          break;

        case 'create_playbook':
          onAddPlaybook({
            title: data.title,
            description: data.description || '',
            category: data.category || 'productivity',
            steps: Array.isArray(data.steps) 
              ? data.steps.map((step: any) => typeof step === 'string' 
                ? { id: crypto.randomUUID(), title: step, completed: false, estimatedMinutes: null } 
                : step)
              : [],
            isTemplate: false,
            linkedTaskIds: [],
            resetOnRecurrence: false,
          });
          toast({
            title: '📖 Playbook Created',
            description: `"${data.title}" is ready to use.`,
            className: 'animate-scale-in border-primary/50',
          });
          break;

        case 'update_playbook':
          const existingPlaybook = playbooks.find(p => p.id === data.playbookId || p.title === data.title);
          if (existingPlaybook) {
            onUpdatePlaybook(existingPlaybook.id, {
              steps: data.steps ? Array.isArray(data.steps) 
                ? data.steps.map((step: any) => typeof step === 'string' 
                  ? { id: crypto.randomUUID(), title: step, completed: false, estimatedMinutes: null } 
                  : step)
                : existingPlaybook.steps : existingPlaybook.steps,
              title: data.title || existingPlaybook.title,
              description: data.description || existingPlaybook.description,
            });
            toast({
              title: '📖 Playbook Updated',
              description: `"${existingPlaybook.title}" has been modified.`,
              className: 'animate-fade-in',
            });
          }
          break;

        case 'create_project':
          if (onAddTask && onAddPlaybook) {
            // Create a main project task
            onAddTask({
              title: data.title,
              eisenhowerQuadrant: 'not-urgent-important',
              focusTimeMinutes: null,
              completed: false,
              notes: data.description || '',
              subtasks: [],
            });
            
            // Create associated playbook if provided
            if (data.playbook) {
              onAddPlaybook({
                title: data.playbook.title,
                description: data.playbook.description || '',
                category: data.playbook.category || 'productivity',
                steps: Array.isArray(data.playbook.steps)
                  ? data.playbook.steps.map((step: any) => typeof step === 'string' 
                    ? { id: crypto.randomUUID(), title: step, completed: false, estimatedMinutes: null } 
                    : step)
                  : [],
                isTemplate: false,
                linkedTaskIds: [],
                resetOnRecurrence: false,
              });
            }
            
            toast({
              title: '🎯 Project Created',
              description: `"${data.title}" project and resources are ready.`,
              className: 'animate-scale-in border-primary/50',
            });
          }
          break;

        case 'create_time_block':
        case 'suggest_time_block':
          onAddTimeBlock({
            title: data.title,
            startTime: data.startTime,
            endTime: data.endTime,
            type: 'dedicated',
            scheduleType: 'everyday',
          });
          toast({
            title: '⏰ Time Block Added',
            description: `Added "${data.title}" to your calendar.`,
            className: 'animate-scale-in border-primary/50',
          });
          break;
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to upload schedules.',
          variant: 'destructive',
        });
        return;
      }

      // Call parse-schedule edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-schedule`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to parse schedule');
      }

      const entries = result.entries || [];
      
      if (entries.length === 0) {
        toast({
          title: 'No Schedule Found',
          description: 'Could not find any schedule entries in the file.',
        });
        return;
      }

      // Insert parsed entries into database
      const { error: insertError } = await supabase
        .from('schedule_entries')
        .insert(
          entries.map((entry: any) => ({
            user_id: session.user.id,
            title: entry.title,
            description: entry.description,
            start_time: entry.startTime,
            end_time: entry.endTime,
            category: entry.category,
            location: entry.location,
          }))
        );

      if (insertError) throw insertError;

      toast({
        title: '✅ Schedule Uploaded',
        description: `Added ${entries.length} event${entries.length > 1 ? 's' : ''} to your schedule.`,
        className: 'animate-scale-in border-primary/50',
      });

      // Add a message to the chat about the upload
      const uploadMessage: Message = {
        role: 'assistant',
        content: `I've successfully added ${entries.length} event${entries.length > 1 ? 's' : ''} from your schedule! ${entries.slice(0, 3).map((e: any) => `\n• ${e.title} (${new Date(e.startTime).toLocaleDateString()})`).join('')}${entries.length > 3 ? `\n...and ${entries.length - 3} more` : ''}`,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, uploadMessage]);

      // Save to conversation
      if (conversationId) {
        await supabase.from('chat_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: uploadMessage.content,
        });
      }
    } catch (error) {
      console.error('Error uploading schedule:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload schedule',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = async () => {
    if (!conversationId) return;
    
    try {
      // Delete all messages for this conversation
      await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId);
      
      // Delete the conversation
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      
      // Reset state
      setMessages([]);
      setConversationId(null);
      
      // Create new conversation and set initial message
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: newConversation } = await supabase
          .from('conversations')
          .insert({ user_id: user.id, title: 'New Conversation' })
          .select()
          .single();

        if (newConversation) {
          setConversationId(newConversation.id);
        }
      }
      
      // Set initial message based on mode
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
      
      toast({
        title: 'Conversation Cleared',
        description: 'Started a new conversation.',
      });
    } catch (error) {
      console.error('Error clearing conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear conversation.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(
          "flex flex-col text-left",
          isMobile
            ? "w-full max-w-full h-[100dvh] rounded-none p-4 sm:p-6"
            : "w-[95vw] max-w-6xl lg:max-w-7xl h-[80vh] max-h-[800px]"
        )} aria-describedby="ai-assistant-description">
        <DialogHeader className="pr-10">
          <DialogTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" aria-hidden="true" />
              AI Productivity Coach
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {messages.length}/100
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearConversation}
                disabled={!conversationId || messages.length === 0}
                className="h-8 w-8 p-0"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
          <p id="ai-assistant-description" className="sr-only">
            Chat with your AI productivity coach to manage tasks, schedule time, and achieve your goals
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4 text-left" ref={scrollRef} role="log" aria-label="Chat messages" aria-live="polite">
          <div className="space-y-4 text-left">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <Card
                  className={`max-w-[95%] p-3 text-left ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ring-1 ring-primary/30'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap break-words text-left">{message.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none break-words text-left">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-normal break-words">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-sm break-words">{children}</li>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <p className="text-xs opacity-60 mt-2 text-left font-medium">
                    {isToday(new Date(message.timestamp))
                      ? format(new Date(message.timestamp), 'h:mm a')
                      : format(new Date(message.timestamp), 'MMM d, h:mm a')}
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
        </div>

        <div className="flex gap-2 mt-4 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={stuckMode ? "Tell me what's on your mind..." : "Ask me about your tasks, schedule, or productivity..."}
            className={cn(
              "flex-1 resize-none bg-card text-foreground caret-foreground text-left",
              isMobile ? "text-base text-[16px] min-h-[48px]" : "text-sm"
            )}
            rows={2}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
                // Reset input so same file can be selected again
                e.target.value = '';
              }
            }}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="icon"
            className={cn("shrink-0", isMobile && "min-w-[48px] min-h-[48px]")}
            title="Upload schedule"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className={cn("shrink-0", isMobile && "min-w-[48px] min-h-[48px]")}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

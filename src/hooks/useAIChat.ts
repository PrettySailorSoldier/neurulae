import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Task, TimeBlock, Playbook } from '@/types';
import { format, isToday } from 'date-fns';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  images?: string[];
}

interface UseAIChatProps {
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

export function useAIChat({
  tasks,
  timeBlocks,
  playbooks,
  onUpdateTask,
  onUpdateTimeBlock,
  onAddTimeBlock,
  onAddTask,
  onAddPlaybook,
  onUpdatePlaybook,
}: UseAIChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('neurulae-chat-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('neurulae-chat-conversation-id');
    } catch {
      return null;
    }
  });
  const { toast } = useToast();

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('neurulae-chat-history', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages]);

  // Save conversation ID to localStorage whenever it changes
  useEffect(() => {
    try {
      if (conversationId) {
        localStorage.setItem('neurulae-chat-conversation-id', conversationId);
      } else {
        localStorage.removeItem('neurulae-chat-conversation-id');
      }
    } catch (error) {
      console.error('Failed to save conversation ID:', error);
    }
  }, [conversationId]);

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
            onAddTask({
              title: data.title,
              eisenhowerQuadrant: 'not-urgent-important',
              focusTimeMinutes: null,
              completed: false,
              notes: data.description || '',
              subtasks: [],
            });
            
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

  const sendMessage = async (content: string, images?: string[]) => {
    if ((!content.trim() && !images?.length) || isLoading) return;

    setIsLoading(true);

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      images: images,
    };

    setMessages(prev => [...prev, userMessage]);

    let convId = conversationId;

    if (!convId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: newConversation } = await supabase
          .from('conversations')
          .insert({ user_id: user.id, title: 'Chat Conversation' })
          .select()
          .single();
        if (newConversation) {
          convId = newConversation.id as string;
          setConversationId(newConversation.id);
        }
      }
    }

    if (convId) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'user',
        content: userMessage.content
      });
    }

    try {
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

        const { data: entries } = await supabase
          .from('schedule_entries')
          .select('*')
          .eq('user_id', currentUser.id)
          .gte('end_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(20);
        
        scheduleEntries = entries || [];
      }

      const now = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
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

      const systemContext = `System Context: Today's date and time is ${temporalContext.localDate} at ${formattedTime} (${temporalContext.timezone}). You MUST use this exact date and time for all schedule-related analysis, organization, and planning. Do not use any other date or time from your training data.`;

      const messagesForAI = [
        { role: 'system' as const, content: systemContext },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: userMessage.role, content: userMessage.content }
      ];

      const { data: functionData, error: functionError } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: messagesForAI,
          images: images,
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
        },
      });

      if (functionError) {
        const errorMsg = functionData?.error || functionError.message || 'Failed to get AI response';
        throw new Error(errorMsg);
      }

      // Parse message content for embedded JSON commands
      let cleanedMessage = functionData.message;
      const embeddedActions: any[] = [];

      // Extract JSON objects from the message
      const jsonRegex = /\{[^{}]*"action"[^{}]*\}/g;
      const jsonMatches = functionData.message.match(jsonRegex);
      
      if (jsonMatches) {
        for (const jsonStr of jsonMatches) {
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.action) {
              embeddedActions.push(parsed);
              // Remove the JSON from the displayed message
              cleanedMessage = cleanedMessage.replace(jsonStr, '').trim();
            }
          } catch (e) {
            console.warn('Failed to parse embedded JSON:', e);
          }
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: cleanedMessage,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (convId) {
        await supabase.from('chat_messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: assistantMessage.content
        });
      }

      if (convId) {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId);
      }

      // Execute actions from both the actions array and embedded JSON
      const allActions = [...(functionData.actions || []), ...embeddedActions];
      if (allActions.length > 0) {
        handleAIActions(allActions);
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      const msg = error instanceof Error ? error.message : 'Failed to send message';
      toast({
        title: 'Error',
        description: msg.includes('Auth session missing') ? 'Please sign in to use the AI assistant.' : msg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      const { data: msgs, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedMessages: Message[] = (msgs || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at).toISOString()
      }));

      setMessages(loadedMessages);
      setConversationId(convId);
      localStorage.setItem('neurulae-chat-history', JSON.stringify(loadedMessages));
      localStorage.setItem('neurulae-chat-conversation-id', convId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem('neurulae-chat-history');
    localStorage.removeItem('neurulae-chat-conversation-id');
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    loadConversation,
    conversationId,
  };
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectsTab } from '@/components/ProjectsTab';
import { PlaybooksTab } from '@/components/PlaybooksTab';
import { WidgetPanel } from '@/components/WidgetPanel';
import { CalendarScheduler } from '@/components/CalendarScheduler';
import { ChatPanel } from '@/components/ChatPanel';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { TaskSection } from '@/components/dashboard/TaskSection';
import { ScheduleSection } from '@/components/dashboard/ScheduleSection';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task, Project, Theme, TimeBlock, ScheduledTask, Playbook, ReminderWidget, EnergyTaskWidget, FutureSelfMessengerWidget, FutureSelfMessage, MoodGardenWidget, ParallelUniverseWidget, SoundSignatureWidget, Plant, CustomTheme } from '@/types';
import { Plus, X, Settings2, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { EisenhowerMatrix } from '@/components/EisenhowerMatrix';
import { AIAssistant } from '@/components/AIAssistant';
import { getTodayString, getDateString } from '@/lib/timeUtils';
import { ReminderWidgetEditor } from '@/components/ReminderWidgetEditor';
import { EnergyTaskWidgetEditor } from '@/components/EnergyTaskWidgetEditor';
import { FutureSelfMessengerEditor } from '@/components/FutureSelfMessengerEditor';
import { MoodGardenWidgetEditor } from '@/components/MoodGardenWidgetEditor';
import { ParallelUniverseWidgetEditor } from '@/components/ParallelUniverseWidgetEditor';
import { SoundSignatureWidgetEditor } from '@/components/SoundSignatureWidgetEditor';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { CustomThemeBuilder } from '@/components/CustomThemeBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import { ProfileSetupDialog } from '@/components/ProfileSetupDialog';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import { supabase } from '@/integrations/supabase/client';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const Index = () => {
  const { user } = useAuth();
  const { plan, isPremium, isAdmin } = usePremium();
  const [showSyncBanner, setShowSyncBanner] = useState(true);
  const isMobile = useIsMobile();
  const [theme, setTheme] = useLocalStorage<Theme>('neurulae-theme', 'orchid');
  const [tasks, setTasks] = useLocalStorage<Task[]>('neurulae-tasks', []);
  const [priorities, setPriorities] = useLocalStorage<Task[]>('neurulae-priorities', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('neurulae-projects', []);
  const [timeBlocks, setTimeBlocks] = useLocalStorage<TimeBlock[]>('neurulae-timeblocks', []);
  const [scheduledTasks, setScheduledTasks] = useLocalStorage<ScheduledTask[]>('neurulae-scheduled-tasks', []);
  const [playbooks, setPlaybooks] = useLocalStorage<Playbook[]>('neurulae-playbooks', []);
  const [reminderWidgets, setReminderWidgets] = useLocalStorage<ReminderWidget[]>('neurulae-widgets', []);
  const [editingWidget, setEditingWidget] = useState<ReminderWidget | undefined>();
  const [widgetEditorOpen, setWidgetEditorOpen] = useState(false);
  
  const [energyWidgets, setEnergyWidgets] = useLocalStorage<EnergyTaskWidget[]>('neurulae-energy-widgets', []);
  const [editingEnergyWidget, setEditingEnergyWidget] = useState<EnergyTaskWidget | undefined>();
  const [energyWidgetEditorOpen, setEnergyWidgetEditorOpen] = useState(false);
  
  const [messengerWidgets, setMessengerWidgets] = useLocalStorage<FutureSelfMessengerWidget[]>('neurulae-messenger-widgets', []);
  const [editingMessengerWidget, setEditingMessengerWidget] = useState<FutureSelfMessengerWidget | undefined>();
  const [messengerWidgetEditorOpen, setMessengerWidgetEditorOpen] = useState(false);
  const [messengerEditorMode, setMessengerEditorMode] = useState<'settings' | 'message'>('settings');
  
  const [moodGardenWidgets, setMoodGardenWidgets] = useLocalStorage<MoodGardenWidget[]>('neurulae-mood-garden-widgets', []);
  const [editingMoodGardenWidget, setEditingMoodGardenWidget] = useState<MoodGardenWidget | undefined>();
  const [moodGardenWidgetEditorOpen, setMoodGardenWidgetEditorOpen] = useState(false);
  
  const [parallelUniverseWidgets, setParallelUniverseWidgets] = useLocalStorage<ParallelUniverseWidget[]>('neurulae-parallel-universe-widgets', []);
  const [editingParallelUniverseWidget, setEditingParallelUniverseWidget] = useState<ParallelUniverseWidget | undefined>();
  const [parallelUniverseWidgetEditorOpen, setParallelUniverseWidgetEditorOpen] = useState(false);
  
  const [soundSignatureWidgets, setSoundSignatureWidgets] = useLocalStorage<SoundSignatureWidget[]>('neurulae-sound-signature-widgets', []);
  const [editingSoundSignatureWidget, setEditingSoundSignatureWidget] = useState<SoundSignatureWidget | undefined>();
  const [soundSignatureWidgetEditorOpen, setSoundSignatureWidgetEditorOpen] = useState(false);
  
  const [customTheme, setCustomTheme] = useLocalStorage<CustomTheme | null>('neurulae-custom-theme', null);
  const [customThemeBuilderOpen, setCustomThemeBuilderOpen] = useState(false);
  const [templateTheme, setTemplateTheme] = useState<'orchid' | 'jellyfish' | 'sunset' | 'bluebonnet' | 'ocean' | 'forest' | 'midnight' | 'candy' | undefined>(undefined);
  
  // Custom Tabs
  const [customTabs, setCustomTabs] = useLocalStorage<{ id: string; name: string }[]>('neurulae-custom-tabs', []);
  const [newTabDialogOpen, setNewTabDialogOpen] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editTabsDialogOpen, setEditTabsDialogOpen] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  
  // Onboarding Tutorial
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage<boolean>('neurulae-tutorial-seen', false);
  
  // Profile Setup
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
  const [hasProfile, setHasProfile] = useLocalStorage<boolean>('neurulae-has-profile', false);
  
  // Calendar Scheduler
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  
  // Eisenhower Matrix
  const [eisenhowerOpen, setEisenhowerOpen] = useState(false);
  
  // AI Assistant
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [initialAIMessage, setInitialAIMessage] = useState<string | undefined>();
  const [profileSetupDialogOpen, setProfileSetupDialogOpen] = useState(false);
  
  // AI Preferences
  const [showAI, setShowAI] = useLocalStorage('neurulae-ai-enabled', true);
  const [aiFirstMode] = useLocalStorage('neurulae-ai-first-mode', false);
  const [showQuickActions] = useLocalStorage('neurulae-ai-quick-actions', true);
  
  const { toast } = useToast();

  // Show tutorial on first visit
  useEffect(() => {
    if (!hasSeenTutorial) {
      setTutorialOpen(true);
      setHasSeenTutorial(true);
    }
  }, [hasSeenTutorial, setHasSeenTutorial]);

  // Daily refresh logic - load today's schedule on mount or date change
  useEffect(() => {
    const checkDailyRefresh = async () => {
      if (!user) return;

      const lastVisitDate = localStorage.getItem('neurulae-last-visit-date');
      const today = getTodayString();

      if (lastVisitDate !== today) {
        console.log('New day detected, refreshing schedule...');
        
        // Load today's schedule entries from database
        const { data, error } = await supabase
          .from('schedule_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_time', new Date().setHours(0, 0, 0, 0))
          .lte('start_time', new Date().setHours(23, 59, 59, 999))
          .order('start_time');

        if (!error && data) {
          console.log(`Loaded ${data.length} schedule entries for today`);
          
          // Show morning brief if there are activities today
          if (data.length > 0) {
            const homeworkCount = data.filter(e => e.category === 'homework').length;
            const classCount = data.filter(e => e.category === 'class').length;
            const workCount = data.filter(e => e.category === 'work').length;
            
            let description = 'Your schedule for today: ';
            const parts = [];
            if (workCount > 0) parts.push(`${workCount} work shift${workCount > 1 ? 's' : ''}`);
            if (classCount > 0) parts.push(`${classCount} class${classCount > 1 ? 'es' : ''}`);
            if (homeworkCount > 0) parts.push(`${homeworkCount} homework assignment${homeworkCount > 1 ? 's' : ''}`);
            description += parts.join(', ');
            
            toast({
              title: "☀️ Good morning!",
              description,
              duration: 5000,
            });
          }
        }

        localStorage.setItem('neurulae-last-visit-date', today);
      }
    };

    checkDailyRefresh();
  }, [user, toast]);

  // Check for profile and show setup if needed
  useEffect(() => {
    const checkProfile = async () => {
      if (!user || hasProfile) return;
      
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!data) {
        setProfileSetupOpen(true);
      } else {
        setHasProfile(true);
      }
    };
    
    checkProfile();
  }, [user, hasProfile, setHasProfile]);

  // One-time migration from neuroflow/neupath to neurulae localStorage keys
  useEffect(() => {
    const migrationKey = 'neurulae-migration-completed';
    if (localStorage.getItem(migrationKey)) return;

    const oldPrefixes = ['neuroflow-', 'neupath-'];
    const keySuffixes = [
      'theme', 'tasks', 'priorities', 'projects', 'timeblocks', 'scheduled-tasks', 
      'playbooks', 'widgets', 'energy-widgets', 'messenger-widgets',
      'mood-garden-widgets', 'parallel-universe-widgets', 'sound-signature-widgets', 
      'custom-theme', 'custom-tabs', 'timer-sessions', 'active-timer', 
      'chime-interval', 'chime-running', 'chime-count', 'chime-countdown'
    ];

    let migrated = 0;
    keySuffixes.forEach(suffix => {
      const newKey = `neurulae-${suffix}`;
      
      // Check if new key already has data
      if (localStorage.getItem(newKey)) return;
      
      // Try to find data from old prefixes (neupath first, then neuroflow)
      for (const prefix of oldPrefixes) {
        const oldKey = `${prefix}${suffix}`;
        const value = localStorage.getItem(oldKey);
        if (value) {
          localStorage.setItem(newKey, value);
          migrated++;
          break; // Stop after finding the first match
        }
      }
    });

    localStorage.setItem(migrationKey, 'true');
    if (migrated > 0) {
      toast({
        title: "✨ Welcome to Neurulae!",
        description: `Your data has been migrated successfully. All ${migrated} items preserved.`,
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const body = document.body;
    const root = document.documentElement;
    
    // Apply custom theme if selected
    if (theme === 'custom' && customTheme) {
      Object.entries(customTheme.colors).forEach(([key, value]) => {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value);
      });

      // Apply background image directly to body
      if (customTheme.backgroundImage && customTheme.backgroundImage.url) {
        const bg = customTheme.backgroundImage;
        
        // Apply background styles
        body.style.backgroundImage = `url(${bg.url})`;
        body.style.backgroundSize = bg.size === 'stretch' ? '100% 100%' : bg.size;
        body.style.backgroundPosition = bg.position.replace('-', ' ');
        body.style.backgroundRepeat = bg.repeat;
        body.style.backgroundAttachment = bg.attachment;
        
        // Set CSS variables for overlay and background filters (applied via body::before)
        root.style.setProperty('--bg-blur', `${bg.blur}px`);
        root.style.setProperty('--bg-opacity', `${bg.opacity / 100}`);
        root.style.setProperty('--overlay-color', bg.overlayColor);
        root.style.setProperty('--overlay-opacity', `${bg.overlayOpacity}%`);
        root.style.setProperty('--bg-filter-grayscale', `${bg.filter.grayscale}%`);
        root.style.setProperty('--bg-filter-sepia', `${bg.filter.sepia}%`);
        root.style.setProperty('--bg-filter-brightness', `${bg.filter.brightness}%`);
        root.style.setProperty('--bg-filter-contrast', `${bg.filter.contrast}%`);
        root.style.setProperty('--bg-filter-saturate', `${bg.filter.saturate}%`);
      }
    } else if (theme !== 'custom') {
      // Remove custom theme variables when switching to preset theme
      const colorKeys = ['background', 'foreground', 'card', 'cardForeground', 'primary', 'primaryForeground', 'secondary', 'secondaryForeground', 'accent', 'accentForeground', 'muted', 'mutedForeground', 'border', 'input'];
      colorKeys.forEach((key) => {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.removeProperty(cssVar);
      });

      // Remove background styles from body
      body.style.backgroundImage = '';
      body.style.backgroundSize = '';
      body.style.backgroundPosition = '';
      body.style.backgroundRepeat = '';
      body.style.backgroundAttachment = '';
      
      root.style.removeProperty('--bg-blur');
      root.style.removeProperty('--bg-opacity');
      root.style.removeProperty('--overlay-color');
      root.style.removeProperty('--overlay-opacity');
      root.style.removeProperty('--bg-filter-grayscale');
      root.style.removeProperty('--bg-filter-sepia');
      root.style.removeProperty('--bg-filter-brightness');
      root.style.removeProperty('--bg-filter-contrast');
      root.style.removeProperty('--bg-filter-saturate');
    }
  }, [theme, customTheme]);

  const handleAddTask = (taskOrTitle: string | Omit<Task, 'id' | 'createdAt'>, estimatedMinutes?: number, taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other') => {
    const newTask: Task = typeof taskOrTitle === 'string'
      ? {
          id: crypto.randomUUID(),
          title: taskOrTitle,
          completed: false,
          recurring: 'none',
          createdAt: new Date().toISOString(),
          ...(estimatedMinutes && { estimatedMinutes }),
          ...(taskType && { taskType }),
        }
      : {
          id: crypto.randomUUID(),
          ...taskOrTitle,
          createdAt: new Date().toISOString(),
        };
    setTasks(prev => [...prev, newTask]);
  };

  const handleToggleComplete = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    setPriorities(priorities.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    setPriorities(priorities.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    ));
  };
  
  const handleUpdateTaskById = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
    setPriorities(priorities.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    setPriorities(priorities.filter(task => task.id !== id));
  };

  const handlePrioritizeTasks = (taskIds: string[]) => {
    // Move top priority tasks to priorities list
    const topTasks = taskIds.slice(0, 5).map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[];
    setPriorities(topTasks);
  };

  const handleScheduleTasks = (schedule: Array<{
    taskId: string;
    blockId: string;
    estimatedMinutes?: number;
    order?: number;
  }>) => {
    const today = getTodayString();
    const newScheduledTasks = schedule.map(item => ({
      id: crypto.randomUUID(),
      taskId: item.taskId,
      blockId: item.blockId,
      date: today,
      estimatedMinutes: item.estimatedMinutes,
    }));
    setScheduledTasks([...scheduledTasks, ...newScheduledTasks]);
  };

  const handleAddPriority = () => {
    // In a full implementation, this would open a dialog to select/create a task
    const newPriority: Task = {
      id: crypto.randomUUID(),
      title: 'New Priority',
      completed: false,
      recurring: 'none',
      createdAt: new Date().toISOString(),
    };
    setPriorities([...priorities, newPriority]);
  };

  const handleAddProject = () => {
    // In a full implementation, this would open a dialog
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: 'New Project',
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    setProjects([...projects, newProject]);
  };

  const handleAddTimeBlock = (blockData: Omit<TimeBlock, 'id' | 'createdAt'>) => {
    const newBlock: TimeBlock = {
      ...blockData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTimeBlocks([...timeBlocks, newBlock]);
  };

  const handleUpdateTimeBlock = (id: string, blockData: Omit<TimeBlock, 'id' | 'createdAt'>) => {
    setTimeBlocks(timeBlocks.map(block => 
      block.id === id ? { ...block, ...blockData } : block
    ));
  };

  const handleDeleteTimeBlock = (id: string) => {
    setTimeBlocks(timeBlocks.filter(block => block.id !== id));
    setScheduledTasks(scheduledTasks.filter(task => task.blockId !== id));
  };

  const handleScheduleTask = (taskId: string, blockId: string, date: string, estimatedMinutes?: number) => {
    const newScheduledTask: ScheduledTask = {
      id: crypto.randomUUID(),
      taskId,
      blockId,
      date,
      estimatedMinutes,
    };
    setScheduledTasks([...scheduledTasks, newScheduledTask]);
    toast({
      title: "Task Scheduled",
      description: "Your task has been added to the schedule.",
    });
  };

  const handleAddPlaybook = (playbookData: Omit<Playbook, 'id' | 'createdAt'>) => {
    const newPlaybook: Playbook = {
      ...playbookData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      order: playbooks.length,
    };
    setPlaybooks([...playbooks, newPlaybook]);
  };

  const handleUpdatePlaybook = (id: string, playbookData: Omit<Playbook, 'id' | 'createdAt'>) => {
    setPlaybooks(playbooks.map(p => p.id === id ? { ...p, ...playbookData } : p));
  };

  const handleDeletePlaybook = (id: string) => {
    setPlaybooks(playbooks.filter(p => p.id !== id));
  };

  const handleReorderPlaybooks = (reorderedPlaybooks: Playbook[]) => {
    setPlaybooks(reorderedPlaybooks);
  };

  const handleAddWidget = () => {
    setEditingWidget(undefined);
    setWidgetEditorOpen(true);
  };

  const handleEditWidget = (id: string) => {
    const widget = reminderWidgets.find(w => w.id === id);
    setEditingWidget(widget);
    setWidgetEditorOpen(true);
  };

  const handleSaveWidget = (widgetData: Omit<ReminderWidget, 'id' | 'createdAt'>) => {
    if (editingWidget) {
      setReminderWidgets(reminderWidgets.map(w =>
        w.id === editingWidget.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: ReminderWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setReminderWidgets([...reminderWidgets, newWidget]);
    }
  };

  const handleToggleWidgetItem = (widgetId: string, itemId: string) => {
    setReminderWidgets(reminderWidgets.map(widget => {
      if (widget.id === widgetId) {
        return {
          ...widget,
          items: widget.items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return widget;
    }));
  };

  const handleResetWidget = (widgetId: string) => {
    setReminderWidgets(reminderWidgets.map(widget => {
      if (widget.id === widgetId) {
        return {
          ...widget,
          items: widget.items.map(item => ({ ...item, completed: false })),
          lastResetDate: new Date().toISOString(),
        };
      }
      return widget;
    }));
  };

  const handleDeleteWidget = (widgetId: string) => {
    setReminderWidgets(reminderWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your reminder widget has been removed." });
  };

  const handleDeleteEnergyWidget = (widgetId: string) => {
    setEnergyWidgets(energyWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your energy widget has been removed." });
  };

  const handleDeleteMessengerWidget = (widgetId: string) => {
    setMessengerWidgets(messengerWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your messenger widget has been removed." });
  };

  const handleDeleteMoodGardenWidget = (widgetId: string) => {
    setMoodGardenWidgets(moodGardenWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your mood garden widget has been removed." });
  };

  const handleDeleteParallelUniverseWidget = (widgetId: string) => {
    setParallelUniverseWidgets(parallelUniverseWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your parallel universe widget has been removed." });
  };

  const handleDeleteSoundSignatureWidget = (widgetId: string) => {
    setSoundSignatureWidgets(soundSignatureWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your sound signature widget has been removed." });
  };

  // Auto-reset widgets based on schedule
  useEffect(() => {
    const checkResets = () => {
      const now = new Date();
      const today = getTodayString();

      setReminderWidgets(prevWidgets => {
        let hasChanges = false;
        const updatedWidgets = prevWidgets.map(widget => {
          if (widget.resetSchedule === 'none') return widget;

          const lastReset = widget.lastResetDate ? new Date(widget.lastResetDate) : null;
          let shouldReset = false;

          if (!lastReset) {
            shouldReset = true;
          } else if (widget.resetSchedule === 'daily') {
            shouldReset = getDateString(lastReset) !== today;
          } else if (widget.resetSchedule === 'weekly') {
            const daysSince = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
            shouldReset = daysSince >= 7;
          } else if (widget.resetSchedule === 'monthly') {
            shouldReset = lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
          }

          if (shouldReset) {
            hasChanges = true;
            return {
              ...widget,
              items: widget.items.map(item => ({ ...item, completed: false })),
              lastResetDate: new Date().toISOString(),
            };
          }

          return widget;
        });

        return hasChanges ? updatedWidgets : prevWidgets;
      });
    };

    checkResets();
    const interval = setInterval(checkResets, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Energy Widget handlers
  const handleAddEnergyWidget = () => {
    setEditingEnergyWidget(undefined);
    setEnergyWidgetEditorOpen(true);
  };

  const handleEditEnergyWidget = (widgetId: string) => {
    const widget = energyWidgets.find(w => w.id === widgetId);
    setEditingEnergyWidget(widget);
    setEnergyWidgetEditorOpen(true);
  };

  const handleSaveEnergyWidget = (widgetData: Omit<EnergyTaskWidget, 'id'> & { id?: string }) => {
    if (widgetData.id) {
      setEnergyWidgets(energyWidgets.map(w =>
        w.id === widgetData.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: EnergyTaskWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
      };
      setEnergyWidgets([...energyWidgets, newWidget]);
    }
    toast({ title: "Energy widget saved", description: "Your energy tracking widget has been updated." });
  };

  const handleLogEnergy = (widgetId: string, category: string, level: number) => {
    setEnergyWidgets(energyWidgets.map(widget => {
      if (widget.id === widgetId) {
        return {
          ...widget,
          energyLogs: [
            ...widget.energyLogs,
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              level,
              category: category as any,
            }
          ].slice(-100), // Keep last 100 logs
        };
      }
      return widget;
    }));
    toast({ 
      title: "Energy logged", 
      description: `${category.charAt(0).toUpperCase() + category.slice(1)} energy: ${level}/10` 
    });
  };

  // Future Self Messenger handlers
  const handleAddMessengerWidget = () => {
    setEditingMessengerWidget(undefined);
    setMessengerEditorMode('settings');
    setMessengerWidgetEditorOpen(true);
  };

  const handleEditMessengerWidget = (widgetId: string) => {
    const widget = messengerWidgets.find(w => w.id === widgetId);
    setEditingMessengerWidget(widget);
    setMessengerEditorMode('settings');
    setMessengerWidgetEditorOpen(true);
  };

  const handleCreateMessage = (widgetId: string) => {
    const widget = messengerWidgets.find(w => w.id === widgetId);
    setEditingMessengerWidget(widget);
    setMessengerEditorMode('message');
    setMessengerWidgetEditorOpen(true);
  };

  const handleSaveMessengerWidget = (widgetData: Omit<FutureSelfMessengerWidget, 'id'> & { id?: string }) => {
    if (widgetData.id) {
      setMessengerWidgets(messengerWidgets.map(w =>
        w.id === widgetData.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: FutureSelfMessengerWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
      };
      setMessengerWidgets([...messengerWidgets, newWidget]);
    }
    toast({ title: "Messenger widget saved" });
  };

  const handleSaveMessage = (message: Omit<FutureSelfMessage, 'id'>) => {
    if (!editingMessengerWidget) return;
    
    const newMessage: FutureSelfMessage = {
      ...message,
      id: crypto.randomUUID(),
    };

    setMessengerWidgets(messengerWidgets.map(widget => {
      if (widget.id === editingMessengerWidget.id) {
        return {
          ...widget,
          messages: [...widget.messages, newMessage],
        };
      }
      return widget;
    }));
    
    toast({ 
      title: "Message scheduled", 
      description: "Your future self will receive this message at the right time." 
    });
  };

  const handleViewMessage = (widgetId: string, messageId: string) => {
    setMessengerWidgets(messengerWidgets.map(widget => {
      if (widget.id === widgetId) {
        return {
          ...widget,
          messages: widget.messages.map(msg => 
            msg.id === messageId ? { ...msg, delivered: true, deliveredAt: new Date().toISOString() } : msg
          ),
        };
      }
      return widget;
    }));
  };

  // Mood Garden handlers
  const handleAddMoodGardenWidget = () => {
    setEditingMoodGardenWidget(undefined);
    setMoodGardenWidgetEditorOpen(true);
  };

  const handleEditMoodGardenWidget = (widgetId: string) => {
    const widget = moodGardenWidgets.find(w => w.id === widgetId);
    setEditingMoodGardenWidget(widget);
    setMoodGardenWidgetEditorOpen(true);
  };

  const handleSaveMoodGardenWidget = (widgetData: Omit<MoodGardenWidget, 'id'> & { id?: string }) => {
    if (widgetData.id) {
      setMoodGardenWidgets(moodGardenWidgets.map(w =>
        w.id === widgetData.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: MoodGardenWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
      };
      setMoodGardenWidgets([...moodGardenWidgets, newWidget]);
    }
    toast({ title: "Mood garden saved" });
  };

  const handleLogMood = (widgetId: string, emotion: string, intensity: number, note?: string) => {
    setMoodGardenWidgets(moodGardenWidgets.map(widget => {
      if (widget.id === widgetId) {
        const newEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          emotion,
          intensity,
          note,
        };

        // Update or create plant for this emotion
        let updatedPlants = [...widget.plants];
        const existingPlantIndex = updatedPlants.findIndex(p => p.type === emotion);
        
        if (existingPlantIndex >= 0) {
          // Update existing plant
          const plant = updatedPlants[existingPlantIndex];
          const newHealth = Math.min(100, plant.health + intensity);
          const newStage: Plant['stage'] = 
            newHealth < 25 ? 'seed' :
            newHealth < 50 ? 'sprout' :
            newHealth < 75 ? 'growing' : 'blooming';
          
          updatedPlants[existingPlantIndex] = {
            ...plant,
            health: newHealth,
            lastWatered: new Date().toISOString(),
            stage: newStage,
          };
        } else {
          // Create new plant
          updatedPlants.push({
            id: crypto.randomUUID(),
            type: emotion,
            health: intensity * 10,
            lastWatered: new Date().toISOString(),
            stage: intensity < 3 ? 'seed' : 'sprout',
          });
        }

        return {
          ...widget,
          moodEntries: [...widget.moodEntries, newEntry].slice(-50),
          plants: updatedPlants,
        };
      }
      return widget;
    }));
    toast({ title: "Mood logged", description: `${emotion} - ${intensity}/10` });
  };

  // Parallel Universe handlers
  const handleAddParallelUniverseWidget = () => {
    setEditingParallelUniverseWidget(undefined);
    setParallelUniverseWidgetEditorOpen(true);
  };

  const handleEditParallelUniverseWidget = (widgetId: string) => {
    const widget = parallelUniverseWidgets.find(w => w.id === widgetId);
    setEditingParallelUniverseWidget(widget);
    setParallelUniverseWidgetEditorOpen(true);
  };

  const handleSaveParallelUniverseWidget = (widgetData: Omit<ParallelUniverseWidget, 'id'> & { id?: string }) => {
    if (widgetData.id) {
      setParallelUniverseWidgets(parallelUniverseWidgets.map(w =>
        w.id === widgetData.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: ParallelUniverseWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
      };
      setParallelUniverseWidgets([...parallelUniverseWidgets, newWidget]);
    }
    toast({ title: "Parallel universe widget saved" });
  };

  const handleLogDecision = (widgetId: string, question: string, chosen: string, alternatives: string[], context?: string) => {
    setParallelUniverseWidgets(parallelUniverseWidgets.map(widget => {
      if (widget.id === widgetId) {
        const newDecision = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          question,
          chosenOption: chosen,
          alternatives,
          context,
        };
        return {
          ...widget,
          decisions: [...widget.decisions, newDecision].slice(-20),
        };
      }
      return widget;
    }));
    toast({ title: "Decision logged" });
  };

  const handleGenerateOutcome = (widgetId: string, decisionId: string) => {
    toast({ 
      title: "AI feature coming soon", 
      description: "AI-generated alternate outcomes will be available in a future update" 
    });
  };

  // Sound Signature handlers
  const handleAddSoundSignatureWidget = () => {
    setEditingSoundSignatureWidget(undefined);
    setSoundSignatureWidgetEditorOpen(true);
  };

  const handleEditSoundSignatureWidget = (widgetId: string) => {
    const widget = soundSignatureWidgets.find(w => w.id === widgetId);
    setEditingSoundSignatureWidget(widget);
    setSoundSignatureWidgetEditorOpen(true);
  };

  const handleSaveSoundSignatureWidget = (widgetData: Omit<SoundSignatureWidget, 'id'> & { id?: string }) => {
    if (widgetData.id) {
      setSoundSignatureWidgets(soundSignatureWidgets.map(w =>
        w.id === widgetData.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: SoundSignatureWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
      };
      setSoundSignatureWidgets([...soundSignatureWidgets, newWidget]);
    }
    toast({ title: "Sound signature widget saved" });
  };

  const handleLogSoundSession = (
    widgetId: string, 
    soundType: string, 
    duration: number, 
    productivity: number, 
    mood: string, 
    activity: string
  ) => {
    setSoundSignatureWidgets(soundSignatureWidgets.map(widget => {
      if (widget.id === widgetId) {
        const newSession = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          soundType,
          duration,
          productivity,
          mood,
          activityType: activity,
        };
        return {
          ...widget,
          soundSessions: [...widget.soundSessions, newSession].slice(-100),
        };
      }
      return widget;
    }));
    toast({ title: "Sound session logged", description: `${soundType} - ${productivity}/10` });
  };

  // Custom Theme handlers
  const handleOpenCustomThemeBuilder = () => {
    setTemplateTheme(undefined);
    setCustomThemeBuilderOpen(true);
  };

  const handleEditCustomTheme = () => {
    setTemplateTheme(undefined);
    setCustomThemeBuilderOpen(true);
  };

  const handleUseThemeAsTemplate = (preset: 'orchid' | 'jellyfish' | 'sunset' | 'bluebonnet' | 'ocean' | 'forest' | 'midnight' | 'candy') => {
    setTemplateTheme(preset);
    setCustomThemeBuilderOpen(true);
  };

  const handleSaveCustomTheme = (newTheme: CustomTheme) => {
    setCustomTheme(newTheme);
    setTheme('custom');
    setTemplateTheme(undefined);
    toast({ 
      title: "Custom theme saved", 
      description: `${newTheme.name} has been applied` 
    });
  };

  const handleDeleteCustomTheme = () => {
    setCustomTheme(null);
    setTheme('orchid');
    toast({ 
      title: "Custom theme deleted", 
      description: "Switched to Orchid Velvet theme" 
    });
  };

  const handleAddCustomTab = () => {
    if (newTabName.trim()) {
      const newTab = {
        id: crypto.randomUUID(),
        name: newTabName.trim(),
      };
      setCustomTabs([...customTabs, newTab]);
      setNewTabName('');
      setNewTabDialogOpen(false);
      toast({ title: "Tab created", description: `${newTab.name} has been added` });
    }
  };

  const handleDeleteCustomTab = (tabId: string) => {
    setCustomTabs(customTabs.filter(tab => tab.id !== tabId));
    toast({ title: "Tab removed" });
  };

  const handleRenameCustomTab = (tabId: string, newName: string) => {
    if (!newName.trim()) return;
    setCustomTabs(customTabs.map(tab => 
      tab.id === tabId ? { ...tab, name: newName.trim() } : tab
    ));
    toast({ title: "Tab renamed" });
  };

  const handleMoveTabUp = (index: number) => {
    if (index === 0) return;
    const newTabs = [...customTabs];
    [newTabs[index - 1], newTabs[index]] = [newTabs[index], newTabs[index - 1]];
    setCustomTabs(newTabs);
  };

  const handleMoveTabDown = (index: number) => {
    if (index === customTabs.length - 1) return;
    const newTabs = [...customTabs];
    [newTabs[index], newTabs[index + 1]] = [newTabs[index + 1], newTabs[index]];
    setCustomTabs(newTabs);
  };

  const handleAskAI = (message: string) => {
    setInitialAIMessage(message);
    setIsAIAssistantOpen(true);
  };

  const handleGenerateSchedule = () => {
    setInitialAIMessage("I've uploaded my work/class schedule and added my tasks. Please generate an optimized schedule for me.");
    setIsAIAssistantOpen(true);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      const isInputField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      
      // Cmd/Ctrl + K for AI Assistant
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isInputField) {
        e.preventDefault();
        setIsAIAssistantOpen(prev => !prev);
      }
      
      // Cmd/Ctrl + / for keyboard shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/' && !isInputField) {
        e.preventDefault();
        setKeyboardShortcutsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Remove AI-First Mode effect since we can't control AICommandBar externally

  return (
    <div className={cn("min-h-screen", isMobile && "pb-16")}>
      <DashboardHeader
        user={user}
        isPremium={isPremium}
        isAdmin={isAdmin}
        plan={plan}
        theme={theme}
        showSyncBanner={showSyncBanner}
        onSetSyncBanner={setShowSyncBanner}
        onSetEisenhowerOpen={setEisenhowerOpen}
        onSetChatPanelOpen={setIsChatPanelOpen}
        onSetTutorialOpen={setTutorialOpen}
        onThemeChange={setTheme}
        onCustomThemeClick={handleOpenCustomThemeBuilder}
        onEditCustomTheme={handleEditCustomTheme}
        onDeleteCustomTheme={handleDeleteCustomTheme}
        onUseAsTemplate={handleUseThemeAsTemplate}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6" role="main">
        <StatsOverview onOpenScheduler={() => setSchedulerOpen(true)} />

        {/* Tabbed Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          {/* Widget Panel */}
          <WidgetPanel
            reminderWidgets={reminderWidgets}
            energyWidgets={energyWidgets}
            messengerWidgets={messengerWidgets}
            moodGardenWidgets={moodGardenWidgets}
            parallelUniverseWidgets={parallelUniverseWidgets}
            soundSignatureWidgets={soundSignatureWidgets}
            onAddWidget={handleAddWidget}
            onEditWidget={handleEditWidget}
            onDeleteWidget={handleDeleteWidget}
            onToggleWidgetItem={handleToggleWidgetItem}
            onResetWidget={handleResetWidget}
            onAddEnergyWidget={handleAddEnergyWidget}
            onEditEnergyWidget={handleEditEnergyWidget}
            onDeleteEnergyWidget={handleDeleteEnergyWidget}
            onLogEnergy={handleLogEnergy}
            onAddMessengerWidget={handleAddMessengerWidget}
            onEditMessengerWidget={handleEditMessengerWidget}
            onDeleteMessengerWidget={handleDeleteMessengerWidget}
            onCreateMessage={handleCreateMessage}
            onViewMessage={handleViewMessage}
            onAddMoodGardenWidget={handleAddMoodGardenWidget}
            onEditMoodGardenWidget={handleEditMoodGardenWidget}
            onDeleteMoodGardenWidget={handleDeleteMoodGardenWidget}
            onLogMood={handleLogMood}
            onAddParallelUniverseWidget={handleAddParallelUniverseWidget}
            onEditParallelUniverseWidget={handleEditParallelUniverseWidget}
            onDeleteParallelUniverseWidget={handleDeleteParallelUniverseWidget}
            onLogDecision={handleLogDecision}
            onGenerateOutcome={handleGenerateOutcome}
            onAddSoundSignatureWidget={handleAddSoundSignatureWidget}
            onEditSoundSignatureWidget={handleEditSoundSignatureWidget}
            onDeleteSoundSignatureWidget={handleDeleteSoundSignatureWidget}
            onLogSoundSession={handleLogSoundSession}
          />
          <div className="flex items-center gap-2">
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:auto-cols-auto" style={{ gridTemplateColumns: `repeat(${4 + customTabs.length}, minmax(0, 1fr))` }}>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
              <TabsTrigger value="care">Care</TabsTrigger>
              {customTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              onClick={() => setNewTabDialogOpen(true)}
              size="icon"
              variant="outline"
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {customTabs.length > 0 && (
              <Button
                onClick={() => setEditTabsDialogOpen(true)}
                size="icon"
                variant="outline"
                className="shrink-0"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Main Workflow - Visual Timeline & Unified To-Do List */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <ScheduleSection
                timeBlocks={timeBlocks}
                scheduledTasks={scheduledTasks}
                tasks={tasks}
                onAddTimeBlock={handleAddTimeBlock}
                onUpdateTimeBlock={handleUpdateTimeBlock}
                onDeleteTimeBlock={handleDeleteTimeBlock}
                onAddTask={handleAddTask}
              />
              <TaskSection
                tasks={tasks}
                timeBlocks={timeBlocks}
                onAddTask={handleAddTask}
                onToggleComplete={handleToggleComplete}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onPrioritize={handlePrioritizeTasks}
                onScheduleTasks={handleScheduleTasks}
                onAskAI={handleAskAI}
                showQuickActions={showQuickActions}
              />
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsTab projects={projects} onAddProject={handleAddProject} />
          </TabsContent>

          <TabsContent value="playbooks" data-tutorial="playbooks">
            <PlaybooksTab
              playbooks={playbooks}
              onAddPlaybook={handleAddPlaybook}
              onUpdatePlaybook={handleUpdatePlaybook}
              onDeletePlaybook={handleDeletePlaybook}
              onReorderPlaybooks={handleReorderPlaybooks}
            />
          </TabsContent>

          <TabsContent value="care">
            <div className="text-center py-12 bg-card rounded-lg border-2 border-border">
              <h3 className="text-xl font-semibold mb-2">Care Checklist</h3>
              <p className="text-muted-foreground">Daily care routines coming soon</p>
            </div>
          </TabsContent>

          {customTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id}>
              <div className="text-center py-12 bg-card rounded-lg border-2 border-border">
                <h3 className="text-xl font-semibold mb-2">{tab.name}</h3>
                <p className="text-muted-foreground">Custom content for this tab</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Onboarding Tutorial */}
      <OnboardingTutorial 
        open={tutorialOpen} 
        onOpenChange={setTutorialOpen}
      />

      {/* Widget Panel */}
      <WidgetPanel
        reminderWidgets={reminderWidgets}
        energyWidgets={energyWidgets}
        messengerWidgets={messengerWidgets}
        moodGardenWidgets={moodGardenWidgets}
        parallelUniverseWidgets={parallelUniverseWidgets}
        soundSignatureWidgets={soundSignatureWidgets}
        onAddWidget={handleAddWidget}
        onEditWidget={handleEditWidget}
        onDeleteWidget={handleDeleteWidget}
        onToggleWidgetItem={handleToggleWidgetItem}
        onResetWidget={handleResetWidget}
        onAddEnergyWidget={handleAddEnergyWidget}
        onEditEnergyWidget={handleEditEnergyWidget}
        onDeleteEnergyWidget={handleDeleteEnergyWidget}
        onLogEnergy={handleLogEnergy}
        onAddMessengerWidget={handleAddMessengerWidget}
        onEditMessengerWidget={handleEditMessengerWidget}
        onDeleteMessengerWidget={handleDeleteMessengerWidget}
        onCreateMessage={handleCreateMessage}
        onViewMessage={handleViewMessage}
        onAddMoodGardenWidget={handleAddMoodGardenWidget}
        onEditMoodGardenWidget={handleEditMoodGardenWidget}
        onDeleteMoodGardenWidget={handleDeleteMoodGardenWidget}
        onLogMood={handleLogMood}
        onAddParallelUniverseWidget={handleAddParallelUniverseWidget}
        onEditParallelUniverseWidget={handleEditParallelUniverseWidget}
        onDeleteParallelUniverseWidget={handleDeleteParallelUniverseWidget}
        onLogDecision={handleLogDecision}
        onGenerateOutcome={handleGenerateOutcome}
        onAddSoundSignatureWidget={handleAddSoundSignatureWidget}
        onEditSoundSignatureWidget={handleEditSoundSignatureWidget}
        onDeleteSoundSignatureWidget={handleDeleteSoundSignatureWidget}
        onLogSoundSession={handleLogSoundSession}
      />

      {/* New Tab Dialog */}
      <Dialog open={newTabDialogOpen} onOpenChange={setNewTabDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tab</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tab-name">Tab Name</Label>
              <Input
                id="tab-name"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="My Custom Tab"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomTab();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTabDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomTab}>Create Tab</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tabs Dialog */}
      <Dialog open={editTabsDialogOpen} onOpenChange={setEditTabsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Custom Tabs</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {customTabs.map((tab, index) => (
              <div key={tab.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                {editingTabId === tab.id ? (
                  <Input
                    value={editingTabName}
                    onChange={(e) => setEditingTabName(e.target.value)}
                    onBlur={() => {
                      if (editingTabName.trim()) {
                        handleRenameCustomTab(tab.id, editingTabName);
                      }
                      setEditingTabId(null);
                      setEditingTabName('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editingTabName.trim()) {
                          handleRenameCustomTab(tab.id, editingTabName);
                        }
                        setEditingTabId(null);
                        setEditingTabName('');
                      } else if (e.key === 'Escape') {
                        setEditingTabId(null);
                        setEditingTabName('');
                      }
                    }}
                    autoFocus
                    className="flex-1"
                  />
                ) : (
                  <>
                    <span className="flex-1 font-medium">{tab.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingTabId(tab.id);
                        setEditingTabName(tab.name);
                      }}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </>
                )}
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleMoveTabUp(index)}
                    disabled={index === 0}
                    className="h-8 w-8"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleMoveTabDown(index)}
                    disabled={index === customTabs.length - 1}
                    className="h-8 w-8"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteCustomTab(tab.id)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setEditTabsDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Widget Editor Dialogs */}
      <ReminderWidgetEditor
        open={widgetEditorOpen}
        onClose={() => setWidgetEditorOpen(false)}
        widget={editingWidget}
        onSave={handleSaveWidget}
      />
      
      <EnergyTaskWidgetEditor
        open={energyWidgetEditorOpen}
        onClose={() => setEnergyWidgetEditorOpen(false)}
        widget={editingEnergyWidget}
        onSave={handleSaveEnergyWidget}
      />
      
      <FutureSelfMessengerEditor
        open={messengerWidgetEditorOpen}
        onClose={() => setMessengerWidgetEditorOpen(false)}
        widget={editingMessengerWidget}
        mode={messengerEditorMode}
        onSave={handleSaveMessengerWidget}
        onSaveMessage={handleSaveMessage}
      />
      
      <MoodGardenWidgetEditor
        open={moodGardenWidgetEditorOpen}
        onOpenChange={setMoodGardenWidgetEditorOpen}
        widget={editingMoodGardenWidget}
        onSave={handleSaveMoodGardenWidget}
      />
      
      <ParallelUniverseWidgetEditor
        open={parallelUniverseWidgetEditorOpen}
        onOpenChange={setParallelUniverseWidgetEditorOpen}
        widget={editingParallelUniverseWidget}
        onSave={handleSaveParallelUniverseWidget}
      />
      
      <SoundSignatureWidgetEditor
        open={soundSignatureWidgetEditorOpen}
        onOpenChange={setSoundSignatureWidgetEditorOpen}
        widget={editingSoundSignatureWidget}
        onSave={handleSaveSoundSignatureWidget}
      />
      
      <CustomThemeBuilder
        open={customThemeBuilderOpen}
        onOpenChange={setCustomThemeBuilderOpen}
        onSave={handleSaveCustomTheme}
        existingTheme={theme === 'custom' && !templateTheme ? (customTheme || undefined) : undefined}
        templateTheme={templateTheme}
      />
      
      <CalendarScheduler
        open={schedulerOpen}
        onOpenChange={setSchedulerOpen}
        tasks={tasks}
        scheduledTasks={scheduledTasks}
        timeBlocks={timeBlocks}
        onScheduleTask={handleScheduleTask}
      />
      
      <EisenhowerMatrix
        open={eisenhowerOpen}
        onOpenChange={setEisenhowerOpen}
        tasks={[...tasks, ...priorities]}
        onUpdateTask={handleUpdateTaskById}
      />
      
      {showAI && (
        <AIAssistant
          open={isAIAssistantOpen}
          onOpenChange={setIsAIAssistantOpen}
          onUpdateTask={handleUpdateTaskById}
          onUpdateTimeBlock={handleUpdateTimeBlock}
          onAddTimeBlock={handleAddTimeBlock}
          onAddTask={handleAddTask}
          tasks={[...tasks, ...priorities]}
          timeBlocks={timeBlocks}
          playbooks={playbooks}
          onAddPlaybook={handleAddPlaybook}
          onUpdatePlaybook={handleUpdatePlaybook}
          initialMessage={initialAIMessage}
        />
      )}

      <KeyboardShortcutsDialog
        open={keyboardShortcutsOpen}
        onOpenChange={setKeyboardShortcutsOpen}
      />
      
      <ProfileSetupDialog
        open={profileSetupOpen}
        onOpenChange={(open) => {
          setProfileSetupOpen(open);
          if (!open) setHasProfile(true);
        }}
      />
      
      <ChatPanel 
        isOpen={isChatPanelOpen} 
        onClose={() => setIsChatPanelOpen(false)}
        tasks={tasks}
        timeBlocks={timeBlocks}
        playbooks={playbooks}
        onUpdateTask={handleUpdateTaskById}
        onUpdateTimeBlock={handleUpdateTimeBlock}
        onAddTimeBlock={handleAddTimeBlock}
        onAddTask={handleAddTask}
        onAddPlaybook={handleAddPlaybook}
        onUpdatePlaybook={handleUpdatePlaybook}
      />
      
      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default Index;

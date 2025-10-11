import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { FocusTimer } from '@/components/FocusTimer';
import { TodaysPriorities } from '@/components/TodaysPriorities';
import { ProjectsTab } from '@/components/ProjectsTab';
import { PlaybooksTab } from '@/components/PlaybooksTab';
import { DailyFlowTimeline } from '@/components/DailyFlowTimeline';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task, Project, Theme, TimeBlock, ScheduledTask, Playbook, ReminderWidget, EnergyTaskWidget, FutureSelfMessengerWidget, FutureSelfMessage, MoodGardenWidget, ParallelUniverseWidget, SoundSignatureWidget, Plant, CustomTheme } from '@/types';
import { Brain, Plus } from 'lucide-react';
import { getTodayString, getDateString } from '@/lib/timeUtils';
import { ReminderWidgetDisplay } from '@/components/ReminderWidgetDisplay';
import { ReminderWidgetEditor } from '@/components/ReminderWidgetEditor';
import { EnergyTaskWidget as EnergyTaskWidgetDisplay } from '@/components/EnergyTaskWidget';
import { EnergyTaskWidgetEditor } from '@/components/EnergyTaskWidgetEditor';
import { FutureSelfMessengerWidget as FutureSelfMessengerWidgetDisplay } from '@/components/FutureSelfMessengerWidget';
import { FutureSelfMessengerEditor } from '@/components/FutureSelfMessengerEditor';
import { MoodGardenWidget as MoodGardenWidgetDisplay } from '@/components/MoodGardenWidget';
import { MoodGardenWidgetEditor } from '@/components/MoodGardenWidgetEditor';
import { ParallelUniverseWidget as ParallelUniverseWidgetDisplay } from '@/components/ParallelUniverseWidget';
import { ParallelUniverseWidgetEditor } from '@/components/ParallelUniverseWidgetEditor';
import { SoundSignatureWidget as SoundSignatureWidgetDisplay } from '@/components/SoundSignatureWidget';
import { SoundSignatureWidgetEditor } from '@/components/SoundSignatureWidgetEditor';
import { CustomThemeBuilder } from '@/components/CustomThemeBuilder';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

const Index = () => {
  const [theme, setTheme] = useLocalStorage<Theme>('neuroflow-theme', 'orchid');
  const [tasks, setTasks] = useLocalStorage<Task[]>('neuroflow-tasks', []);
  const [priorities, setPriorities] = useLocalStorage<Task[]>('neuroflow-priorities', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('neuroflow-projects', []);
  const [timeBlocks, setTimeBlocks] = useLocalStorage<TimeBlock[]>('neuroflow-timeblocks', []);
  const [scheduledTasks, setScheduledTasks] = useLocalStorage<ScheduledTask[]>('neuroflow-scheduled-tasks', []);
  const [playbooks, setPlaybooks] = useLocalStorage<Playbook[]>('neuroflow-playbooks', []);
  const [reminderWidgets, setReminderWidgets] = useLocalStorage<ReminderWidget[]>('neuroflow-widgets', []);
  const [editingWidget, setEditingWidget] = useState<ReminderWidget | undefined>();
  const [widgetEditorOpen, setWidgetEditorOpen] = useState(false);
  
  const [energyWidgets, setEnergyWidgets] = useLocalStorage<EnergyTaskWidget[]>('neuroflow-energy-widgets', []);
  const [editingEnergyWidget, setEditingEnergyWidget] = useState<EnergyTaskWidget | undefined>();
  const [energyWidgetEditorOpen, setEnergyWidgetEditorOpen] = useState(false);
  
  const [messengerWidgets, setMessengerWidgets] = useLocalStorage<FutureSelfMessengerWidget[]>('neuroflow-messenger-widgets', []);
  const [editingMessengerWidget, setEditingMessengerWidget] = useState<FutureSelfMessengerWidget | undefined>();
  const [messengerWidgetEditorOpen, setMessengerWidgetEditorOpen] = useState(false);
  const [messengerEditorMode, setMessengerEditorMode] = useState<'settings' | 'message'>('settings');
  
  const [moodGardenWidgets, setMoodGardenWidgets] = useLocalStorage<MoodGardenWidget[]>('neuroflow-mood-garden-widgets', []);
  const [editingMoodGardenWidget, setEditingMoodGardenWidget] = useState<MoodGardenWidget | undefined>();
  const [moodGardenWidgetEditorOpen, setMoodGardenWidgetEditorOpen] = useState(false);
  
  const [parallelUniverseWidgets, setParallelUniverseWidgets] = useLocalStorage<ParallelUniverseWidget[]>('neuroflow-parallel-universe-widgets', []);
  const [editingParallelUniverseWidget, setEditingParallelUniverseWidget] = useState<ParallelUniverseWidget | undefined>();
  const [parallelUniverseWidgetEditorOpen, setParallelUniverseWidgetEditorOpen] = useState(false);
  
  const [soundSignatureWidgets, setSoundSignatureWidgets] = useLocalStorage<SoundSignatureWidget[]>('neuroflow-sound-signature-widgets', []);
  const [editingSoundSignatureWidget, setEditingSoundSignatureWidget] = useState<SoundSignatureWidget | undefined>();
  const [soundSignatureWidgetEditorOpen, setSoundSignatureWidgetEditorOpen] = useState(false);
  
  const [customTheme, setCustomTheme] = useLocalStorage<CustomTheme | null>('neuroflow-custom-theme', null);
  const [customThemeBuilderOpen, setCustomThemeBuilderOpen] = useState(false);
  const [templateTheme, setTemplateTheme] = useState<'orchid' | 'jellyfish' | 'sunset' | 'bluebonnet' | 'ocean' | 'forest' | 'midnight' | 'candy' | undefined>(undefined);
  
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply custom theme if selected
    if (theme === 'custom' && customTheme) {
      const root = document.documentElement;
      Object.entries(customTheme.colors).forEach(([key, value]) => {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value);
      });

      // Apply background image settings using a dedicated background layer
      if (customTheme.backgroundImage && customTheme.backgroundImage.url) {
        const bg = customTheme.backgroundImage;
        
        // Create or update background layer
        const bgLayerId = 'custom-theme-bg-layer';
        let bgLayer = document.getElementById(bgLayerId) as HTMLDivElement;
        
        if (!bgLayer) {
          bgLayer = document.createElement('div');
          bgLayer.id = bgLayerId;
          bgLayer.style.position = 'fixed';
          bgLayer.style.top = '0';
          bgLayer.style.left = '0';
          bgLayer.style.width = '100%';
          bgLayer.style.height = '100%';
          bgLayer.style.pointerEvents = 'none';
          bgLayer.style.zIndex = '-2';
          document.body.appendChild(bgLayer);
        }
        
        // Create filter string
        const filterValue = `
          grayscale(${bg.filter.grayscale}%)
          sepia(${bg.filter.sepia}%)
          brightness(${bg.filter.brightness}%)
          contrast(${bg.filter.contrast}%)
          saturate(${bg.filter.saturate}%)
          blur(${bg.blur}px)
        `.trim();

        // Apply background styles to the layer
        bgLayer.style.backgroundImage = `url(${bg.url})`;
        bgLayer.style.backgroundSize = bg.size === 'stretch' ? '100% 100%' : bg.size;
        bgLayer.style.backgroundPosition = bg.position.replace('-', ' ');
        bgLayer.style.backgroundRepeat = bg.repeat;
        bgLayer.style.backgroundAttachment = bg.attachment;
        bgLayer.style.opacity = (bg.opacity / 100).toString();
        bgLayer.style.filter = filterValue;
        
        // Create overlay
        const overlayId = 'custom-theme-overlay';
        let overlay = document.getElementById(overlayId);
        
        if (bg.overlayOpacity > 0) {
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = overlayId;
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '-1';
            document.body.appendChild(overlay);
          }
          overlay.style.backgroundColor = `hsl(${bg.overlayColor} / ${bg.overlayOpacity}%)`;
        } else if (overlay) {
          overlay.remove();
        }
      }
    } else if (theme !== 'custom') {
      // Remove custom theme variables when switching to preset theme
      const root = document.documentElement;
      const colorKeys = ['background', 'foreground', 'card', 'cardForeground', 'primary', 'primaryForeground', 'secondary', 'secondaryForeground', 'accent', 'accentForeground', 'muted', 'mutedForeground', 'border', 'input'];
      colorKeys.forEach((key) => {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.removeProperty(cssVar);
      });

      // Remove background layer
      const bgLayer = document.getElementById('custom-theme-bg-layer');
      if (bgLayer) bgLayer.remove();

      // Remove overlay
      const overlay = document.getElementById('custom-theme-overlay');
      if (overlay) overlay.remove();
    }
  }, [theme, customTheme]);

  const handleAddTask = (title: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      recurring: 'none',
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
  };

  const handleToggleComplete = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    setPriorities(priorities.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
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

  const handleAddPlaybook = (playbookData: Omit<Playbook, 'id' | 'createdAt'>) => {
    const newPlaybook: Playbook = {
      ...playbookData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setPlaybooks([...playbooks, newPlaybook]);
  };

  const handleUpdatePlaybook = (id: string, playbookData: Omit<Playbook, 'id' | 'createdAt'>) => {
    setPlaybooks(playbooks.map(p => p.id === id ? { ...p, ...playbookData } : p));
  };

  const handleDeletePlaybook = (id: string) => {
    setPlaybooks(playbooks.filter(p => p.id !== id));
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">NeuroFlow</h1>
                <p className="text-sm text-muted-foreground">Your AuDHD Life Management Hub</p>
              </div>
            </div>
            <ThemeSwitcher 
              currentTheme={theme} 
              onThemeChange={setTheme}
              onCustomThemeClick={handleOpenCustomThemeBuilder}
              onEditCustomTheme={handleEditCustomTheme}
              onUseAsTemplate={handleUseThemeAsTemplate}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Top Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FocusTimer />
          <TodaysPriorities
            priorities={priorities}
            onToggleComplete={handleToggleComplete}
            onAddPriority={handleAddPriority}
          />
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
            <TabsTrigger value="care">Care</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Productivity Enhancement Widgets */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">🎯 Productivity Enhancements</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Widget
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Productivity Widgets</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleAddEnergyWidget}>
                      ⚡ Energy-Task Harmony
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddMessengerWidget}>
                      ✉️ Future Self Messenger
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddMoodGardenWidget}>
                      🌱 Mood Garden
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddParallelUniverseWidget}>
                      🌌 Parallel Universe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddSoundSignatureWidget}>
                      🎵 Sound Signature
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Custom</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleAddWidget}>
                      ➕ Custom Reminder Widget
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {energyWidgets.length === 0 && messengerWidgets.length === 0 && 
               moodGardenWidgets.length === 0 && parallelUniverseWidgets.length === 0 && 
               soundSignatureWidgets.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Transform your productivity with intelligent widgets that adapt to your energy levels and help you stay motivated
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleAddEnergyWidget} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Energy-Task Harmony
                    </Button>
                    <Button onClick={handleAddMessengerWidget} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Future Self Messenger
                    </Button>
                    <Button onClick={handleAddMoodGardenWidget} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Mood Garden
                    </Button>
                    <Button onClick={handleAddParallelUniverseWidget} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Parallel Universe
                    </Button>
                    <Button onClick={handleAddSoundSignatureWidget} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Sound Signature
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {energyWidgets.map(widget => (
                    <EnergyTaskWidgetDisplay
                      key={widget.id}
                      widget={widget}
                      onLogEnergy={(category, level) => handleLogEnergy(widget.id, category, level)}
                      onEdit={() => handleEditEnergyWidget(widget.id)}
                    />
                  ))}
                  {messengerWidgets.map(widget => (
                    <FutureSelfMessengerWidgetDisplay
                      key={widget.id}
                      widget={widget}
                      onCreateMessage={() => handleCreateMessage(widget.id)}
                      onViewMessage={(msgId) => handleViewMessage(widget.id, msgId)}
                      onEdit={() => handleEditMessengerWidget(widget.id)}
                    />
                  ))}
                  {moodGardenWidgets.map(widget => (
                    <MoodGardenWidgetDisplay
                      key={widget.id}
                      widget={widget}
                      onLogMood={(emotion, intensity, note) => handleLogMood(widget.id, emotion, intensity, note)}
                      onEdit={() => handleEditMoodGardenWidget(widget.id)}
                    />
                  ))}
                  {parallelUniverseWidgets.map(widget => (
                    <ParallelUniverseWidgetDisplay
                      key={widget.id}
                      widget={widget}
                      onLogDecision={(q, c, a, ctx) => handleLogDecision(widget.id, q, c, a, ctx)}
                      onGenerateOutcome={(decId) => handleGenerateOutcome(widget.id, decId)}
                      onEdit={() => handleEditParallelUniverseWidget(widget.id)}
                    />
                  ))}
                  {soundSignatureWidgets.map(widget => (
                    <SoundSignatureWidgetDisplay
                      key={widget.id}
                      widget={widget}
                      onLogSession={(s, d, p, m, a) => handleLogSoundSession(widget.id, s, d, p, m, a)}
                      onEdit={() => handleEditSoundSignatureWidget(widget.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Reminder Widgets */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Custom Reminders</h2>
                <Button onClick={handleAddWidget} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </div>
              
              {reminderWidgets.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Create custom reminder widgets to track daily routines, care checklists, or any recurring tasks
                  </p>
                  <Button onClick={handleAddWidget}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Widget
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reminderWidgets.map(widget => (
                    <ReminderWidgetDisplay
                      key={widget.id}
                      widget={widget}
                      onToggleItem={handleToggleWidgetItem}
                      onEdit={handleEditWidget}
                      onReset={handleResetWidget}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Flow Timeline - Left 40% */}
              <div className="lg:col-span-1">
                <DailyFlowTimeline
                  timeBlocks={timeBlocks}
                  scheduledTasks={scheduledTasks}
                  tasks={tasks}
                  onAddBlock={handleAddTimeBlock}
                  onUpdateBlock={handleUpdateTimeBlock}
                  onDeleteBlock={handleDeleteTimeBlock}
                  onToggleComplete={handleToggleComplete}
                />
              </div>

              {/* Today's Schedule & Unscheduled Tasks - Right 60% */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
                  <p className="text-sm text-muted-foreground">
                    Scheduled tasks will appear here
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Unscheduled Tasks</h3>
                  <div className="space-y-2">
                    {tasks
                      .filter(task => !scheduledTasks.some(st => st.taskId === task.id))
                      .map(task => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 p-2 bg-card/50 border border-border rounded-md hover:bg-card transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleComplete(task.id)}
                            className="rounded border-border"
                          />
                          <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsTab projects={projects} onAddProject={handleAddProject} />
          </TabsContent>

          <TabsContent value="playbooks">
            <PlaybooksTab
              playbooks={playbooks}
              onAddPlaybook={handleAddPlaybook}
              onUpdatePlaybook={handleUpdatePlaybook}
              onDeletePlaybook={handleDeletePlaybook}
            />
          </TabsContent>

          <TabsContent value="care">
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-2">Care Checklist</h3>
              <p className="text-muted-foreground">Daily care routines coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

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
    </div>
  );
};

export default Index;

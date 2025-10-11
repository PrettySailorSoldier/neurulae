import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { FocusTimer } from '@/components/FocusTimer';
import { TodaysPriorities } from '@/components/TodaysPriorities';
import { ProjectsTab } from '@/components/ProjectsTab';
import { PlaybooksTab } from '@/components/PlaybooksTab';
import { DailyFlowTimeline } from '@/components/DailyFlowTimeline';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task, Project, Theme, TimeBlock, ScheduledTask, Playbook, ReminderWidget } from '@/types';
import { Brain, Plus } from 'lucide-react';
import { getTodayString, getDateString } from '@/lib/timeUtils';
import { ReminderWidgetDisplay } from '@/components/ReminderWidgetDisplay';
import { ReminderWidgetEditor } from '@/components/ReminderWidgetEditor';
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

      reminderWidgets.forEach(widget => {
        if (widget.resetSchedule === 'none') return;

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
          handleResetWidget(widget.id);
        }
      });
    };

    checkResets();
    const interval = setInterval(checkResets, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [reminderWidgets]);

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
            <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} />
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

      {/* Widget Editor Dialog */}
      <ReminderWidgetEditor
        open={widgetEditorOpen}
        onClose={() => setWidgetEditorOpen(false)}
        widget={editingWidget}
        onSave={handleSaveWidget}
      />
    </div>
  );
};

export default Index;

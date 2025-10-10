import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { FocusTimer } from '@/components/FocusTimer';
import { TodaysPriorities } from '@/components/TodaysPriorities';
import { TaskList } from '@/components/TaskList';
import { ProjectsTab } from '@/components/ProjectsTab';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task, Project, Theme } from '@/types';
import { Brain } from 'lucide-react';

const Index = () => {
  const [theme, setTheme] = useLocalStorage<Theme>('neuroflow-theme', 'orchid');
  const [tasks, setTasks] = useLocalStorage<Task[]>('neuroflow-tasks', []);
  const [priorities, setPriorities] = useLocalStorage<Task[]>('neuroflow-priorities', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('neuroflow-projects', []);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FocusTimer />
          <TodaysPriorities
            priorities={priorities}
            onToggleComplete={handleToggleComplete}
            onAddPriority={handleAddPriority}
          />
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onAddTask={handleAddTask}
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
            <div className="grid gap-6">
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-2">Daily Flow Timeline</h3>
                <p className="text-muted-foreground">Coming soon: Visualize your day with draggable time blocks</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsTab projects={projects} onAddProject={handleAddProject} />
          </TabsContent>

          <TabsContent value="playbooks">
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-2">Playbooks</h3>
              <p className="text-muted-foreground">Pre-written guides for complex goals coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="care">
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-2">Care Checklist</h3>
              <p className="text-muted-foreground">Daily care routines coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

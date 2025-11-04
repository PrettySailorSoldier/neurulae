import { useState } from 'react';
import { Plus, Search, Filter, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Task, TimeBlock } from '@/types';
import { UnscheduledTaskItem } from './UnscheduledTaskItem';
import { AIOrganizeDialog } from './AIOrganizeDialog';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import { UpgradeModal } from './premium/UpgradeModal';

interface TaskListProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  onToggleComplete: (id: string) => void;
  onAddTask: (title: string, estimatedMinutes?: number) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onPrioritize: (taskIds: string[]) => void;
  onScheduleTasks: (schedule: Array<{
    taskId: string;
    blockId: string;
    estimatedMinutes?: number;
    order?: number;
  }>) => void;
  onAskAI?: (message: string) => void;
  showQuickActions?: boolean;
}

export function TaskList({ 
  tasks, 
  timeBlocks,
  onToggleComplete, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask,
  onPrioritize,
  onScheduleTasks,
  onAskAI,
  showQuickActions = true,
}: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const { canUseAIFeatures, showUpgradeModal, upgradeModalOpen, setUpgradeModalOpen } = useFeatureLimit();

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompleted = showCompleted || !task.completed;
    return matchesSearch && matchesCompleted;
  });

  const handleOpenTaskDialog = () => {
    setNewTaskTitle('');
    setNewTaskMinutes('');
    setTaskDialogOpen(true);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const minutes = newTaskMinutes ? parseInt(newTaskMinutes) : undefined;
      onAddTask(newTaskTitle, minutes);
      setNewTaskTitle('');
      setNewTaskMinutes('');
      setTaskDialogOpen(false);
    }
  };

  const handleBulkAdd = () => {
    if (!bulkText.trim()) return;
    
    // Parse and clean input
    const lines = bulkText
      .split('\n')
      .map(line => line.trim())
      .map(line => {
        // Strip common prefixes: -, *, •, [ ], [x], 1), 1., etc.
        return line.replace(/^[\-\*•]\s*|^\[\s*[x ]?\s*\]\s*|^\d+[\.\)]\s*/i, '').trim();
      })
      .filter(line => line.length > 0);
    
    // Remove duplicates
    const uniqueLines = Array.from(new Set(lines));
    
    // Add all tasks
    uniqueLines.forEach(line => {
      // Parse estimate if exists: "Task title 30m" or "Task title 1h"
      const estimateMatch = line.match(/(.+?)\s+(\d+)\s*(m|min|h|hr|hour)s?$/i);
      if (estimateMatch) {
        const title = estimateMatch[1].trim();
        const value = parseInt(estimateMatch[2]);
        const unit = estimateMatch[3].toLowerCase();
        const minutes = unit.startsWith('h') ? value * 60 : value;
        onAddTask(title);
        // Note: To preserve estimates, we'd need to modify onAddTask to accept options
      } else {
        onAddTask(line);
      }
    });
    
    setBulkText('');
    setBulkMode(false);
  };

  const handleAIOrganize = () => {
    if (!canUseAIFeatures()) {
      showUpgradeModal('AI Task Organization');
      return;
    }
    setAiDialogOpen(true);
  };

  const handleApplyAIResult = (result: any) => {
    // Apply priorities - reorder top tasks
    onPrioritize(result.priorities);
    
    // Apply schedule
    onScheduleTasks(result.schedule);
  };

  return (
    <>
      <Card className="card-elevated h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>✓ To-Do List</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                All your tasks - add details, subtasks, and notes
              </p>
            </div>
            <Button
              onClick={handleAIOrganize}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Organize with AI
            </Button>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <Filter className={`h-4 w-4 ${showCompleted ? 'text-primary' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 flex-1 flex flex-col overflow-hidden">
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Button
                variant={bulkMode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setBulkMode(!bulkMode)}
                className="text-xs"
              >
                {bulkMode ? 'Single' : 'Bulk'} Add
              </Button>
            </div>
            
            {bulkMode ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste your task list here... (one task per line)"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <div className="flex gap-2">
                  <Button onClick={handleBulkAdd} className="btn-primary flex-1">
                    Add All Tasks
                  </Button>
                  <Button onClick={() => { setBulkText(''); setBulkMode(false); }} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleOpenTaskDialog} className="btn-primary w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add New Task
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks yet. Add one above!</p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <UnscheduledTaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onAskAI={onAskAI}
                    showQuickActions={showQuickActions}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          <div className="text-sm text-muted-foreground pt-2 border-t border-border">
            {filteredTasks.filter(t => !t.completed).length} active •{' '}
            {filteredTasks.filter(t => t.completed).length} completed
          </div>
        </CardContent>
      </Card>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="e.g., Chapter 4 Quiz"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated-minutes">Estimated Minutes (optional)</Label>
              <Input
                id="estimated-minutes"
                type="number"
                placeholder="e.g., 30"
                value={newTaskMinutes}
                onChange={(e) => setNewTaskMinutes(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AIOrganizeDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        tasks={tasks}
        timeBlocks={timeBlocks}
        onApply={handleApplyAIResult}
      />

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        feature="AI Task Organization"
      />
    </>
  );
}

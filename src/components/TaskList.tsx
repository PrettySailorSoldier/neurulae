import { useState, useMemo, memo } from 'react';
import { Plus, Search, Filter, Sparkles, Clock, MoreVertical, Trash2, CheckCircle2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface BulkTaskInput {
  title: string;
  estimatedMinutes?: number;
}

interface TaskListProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  userId?: string;
  onToggleComplete: (id: string) => void;
  onAddTask: (title: string, estimatedMinutes?: number, taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other') => void;
  onBulkAddTasks?: (tasks: BulkTaskInput[]) => Promise<void>;
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
  onBreakdownTask?: (task: Task) => void;
  onOpenAIChat?: (context: string) => void;
  onStartIntention?: (task: Task) => void;
  activeIntentionId?: string | null;
  showQuickActions?: boolean;
  onToggleTimeConstraintView?: () => void;
  showTimeConstraintView?: boolean;
  onClearCompleted?: () => void;
  onClearAll?: () => void;
}

// Category labels with emojis
const categoryLabels: Record<string, string> = {
  school: 'School',
  work: 'Work',
  home: 'Home',
  appointment: 'Appointment',
  call: 'Call',
  other: 'Other',
};

// Date labels
const dateLabels: Record<string, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  later: 'Later',
  noDueDate: 'No Due Date',
};

// Group by task type (category)
const groupByCategory = (tasksToGroup: Task[]) => {
  const order = ['school', 'work', 'home', 'appointment', 'call', 'other'];
  const groups: Record<string, Task[]> = {};

  tasksToGroup.forEach(task => {
    const type = task.taskType || 'other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(task);
  });

  return order
    .filter(type => groups[type]?.length > 0)
    .map(type => ({ type, tasks: groups[type] }));
};

// Group by due date proximity
const groupByDate = (tasksToGroup: Task[]) => {
  const now = new Date();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const thisWeekEnd = new Date(todayEnd);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

  const groups: Record<string, Task[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    noDueDate: [],
  };

  tasksToGroup.forEach(task => {
    if (!task.dueDate) {
      groups.noDueDate.push(task);
    } else {
      const due = new Date(task.dueDate);
      if (due < now) groups.overdue.push(task);
      else if (due <= todayEnd) groups.today.push(task);
      else if (due <= tomorrowEnd) groups.tomorrow.push(task);
      else if (due <= thisWeekEnd) groups.thisWeek.push(task);
      else groups.later.push(task);
    }
  });

  return Object.entries(groups)
    .filter(([_, taskList]) => taskList.length > 0)
    .map(([label, taskList]) => ({ type: label, tasks: taskList }));
};

const TaskListComponent = ({
  tasks,
  timeBlocks,
  userId,
  onToggleComplete,
  onAddTask,
  onBulkAddTasks,
  onUpdateTask,
  onDeleteTask,
  onPrioritize,
  onScheduleTasks,
  onAskAI,
  onBreakdownTask,
  onOpenAIChat,
  onStartIntention,
  activeIntentionId,
  showQuickActions = true,
  onToggleTimeConstraintView,
  showTimeConstraintView = false,
  onClearCompleted,
  onClearAll,
}: TaskListProps) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('');
  const [newTaskType, setNewTaskType] = useState<'school' | 'work' | 'home' | 'appointment' | 'call' | 'other'>('school');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'date'>('none');
  const { canUseAIFeatures, showUpgradeModal, upgradeModalOpen, setUpgradeModalOpen } = useFeatureLimit();

  // MEMOIZE: Filter calculations to prevent unnecessary re-renders
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const hasValidTitle = task.title && task.title.trim().length > 0;
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCompleted = showCompleted || !task.completed;
      return hasValidTitle && matchesSearch && matchesCompleted;
    });
  }, [tasks, searchQuery, showCompleted]);

  // MEMOIZE: Daily/ongoing task separation
  const { dailyTasks, ongoingTasks } = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const daily = filteredTasks.filter(task => {
      if (task.type === 'daily') return true;
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        return dueDate <= tomorrow;
      }
      return false;
    });

    const ongoing = filteredTasks.filter(task => {
      if (task.type === 'ongoing') return true;
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        return dueDate > tomorrow;
      }
      return !task.dueDate;
    });

    return { dailyTasks: daily, ongoingTasks: ongoing };
  }, [filteredTasks]);

  const handleOpenTaskDialog = () => {
    setNewTaskTitle('');
    setNewTaskMinutes('');
    setNewTaskType('school');
    setTaskDialogOpen(true);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const minutes = newTaskMinutes ? parseInt(newTaskMinutes) : undefined;
      onAddTask(newTaskTitle, minutes, newTaskType);
      setNewTaskTitle('');
      setNewTaskMinutes('');
      setNewTaskType('school');
      setTaskDialogOpen(false);
    }
  };

  const [bulkAddLoading, setBulkAddLoading] = useState(false);

  const handleBulkAdd = async () => {
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
    
    // Parse all tasks with their estimates
    const tasksToAdd: BulkTaskInput[] = uniqueLines.map((line: string) => {
      // Parse estimate if exists: "Task title 30m" or "Task title 1h"
      const estimateMatch = line.match(/(.+?)\s+(\d+)\s*(m|min|h|hr|hour)s?$/i) as RegExpMatchArray | null;
      if (estimateMatch) {
        const title = estimateMatch[1].trim();
        const value = parseInt(estimateMatch[2]);
        const unit = estimateMatch[3].toLowerCase();
        const minutes = unit.startsWith('h') ? value * 60 : value;
        return { title, estimatedMinutes: minutes };
      } else {
        return { title: line };
      }
    });
    
    // Use bulk handler if available (waits for DB confirmation)
    if (onBulkAddTasks) {
      setBulkAddLoading(true);
      try {
        await onBulkAddTasks(tasksToAdd);
        setBulkText('');
        setBulkMode(false);
      } catch (err) {
        console.error('Failed to bulk add tasks:', err);
      } finally {
        setBulkAddLoading(false);
      }
    } else {
      // Fallback: add one by one (no DB wait)
      tasksToAdd.forEach(task => {
        onAddTask(task.title, task.estimatedMinutes);
      });
      setBulkText('');
      setBulkMode(false);
    }
  };

  const handleAIOrganize = async () => {
    if (!canUseAIFeatures()) {
      showUpgradeModal('AI Task Organization');
      return;
    }
    
    // Immediately start organizing - fetch data and call AI
    setAiDialogOpen(true);
    // The dialog will handle the automatic fetching and processing
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
            <div className="flex gap-2">
              {onToggleTimeConstraintView && (
                <Button
                  onClick={onToggleTimeConstraintView}
                  variant={showTimeConstraintView ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  title="Toggle time-based task view"
                >
                  <Clock className="h-4 w-4" />
                  {showTimeConstraintView ? 'List View' : 'Time View'}
                </Button>
              )}
              <Button
                onClick={handleAIOrganize}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Organize with AI
              </Button>
              {(onClearCompleted || onClearAll) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onClearCompleted && (
                      <DropdownMenuItem onClick={onClearCompleted}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Clear completed
                      </DropdownMenuItem>
                    )}
                    {onClearAll && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onClearAll} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear all tasks
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'none' | 'category' | 'date')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No grouping</SelectItem>
                <SelectItem value="category">By Category</SelectItem>
                <SelectItem value="date">By Due Date</SelectItem>
              </SelectContent>
            </Select>
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
                  <Button onClick={handleBulkAdd} className="btn-primary flex-1" disabled={bulkAddLoading}>
                    {bulkAddLoading ? 'Saving...' : 'Add All Tasks'}
                  </Button>
                  <Button onClick={() => { setBulkText(''); setBulkMode(false); }} variant="outline" disabled={bulkAddLoading}>
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
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks yet. Add one above!</p>
                </div>
              ) : (
                <>
                  {/* Daily/Urgent Section */}
                  {dailyTasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 py-2 px-3 bg-primary/5 rounded-lg border border-primary/20">
                        <span className="text-sm font-semibold text-primary">
                          Today's Focus ({dailyTasks.length})
                        </span>
                      </div>
                      {groupBy === 'none' ? (
                        <div className="space-y-2">
                          {dailyTasks.map((task) => (
                            <UnscheduledTaskItem
                              key={task.id}
                              task={task}
                              onToggleComplete={onToggleComplete}
                              onUpdateTask={onUpdateTask}
                              onDeleteTask={onDeleteTask}
                              onAskAI={onAskAI}
                              onBreakdownTask={onBreakdownTask}
                              onStartIntention={onStartIntention}
                              isActiveIntention={activeIntentionId === task.id}
                              showQuickActions={showQuickActions}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(groupBy === 'category' ? groupByCategory(dailyTasks) : groupByDate(dailyTasks)).map(({ type, tasks: groupTasks }) => (
                            <div key={type} className="space-y-1">
                              <div className="flex items-center gap-2 py-1 px-2 bg-muted/50 rounded text-xs font-medium text-muted-foreground">
                                {(groupBy === 'category' ? categoryLabels : dateLabels)[type] || type} ({groupTasks.length})
                              </div>
                              <div className="space-y-1 pl-2 border-l-2 border-primary/30">
                                {groupTasks.map((task) => (
                                  <UnscheduledTaskItem
                                    key={task.id}
                                    task={task}
                                    onToggleComplete={onToggleComplete}
                                    onUpdateTask={onUpdateTask}
                                    onDeleteTask={onDeleteTask}
                                    onAskAI={onAskAI}
                                    onBreakdownTask={onBreakdownTask}
                                    onStartIntention={onStartIntention}
                                    isActiveIntention={activeIntentionId === task.id}
                                    showQuickActions={showQuickActions}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ongoing/Future Section */}
                  {ongoingTasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 py-2 px-3 bg-muted/30 rounded-lg border border-border">
                        <span className="text-sm font-semibold text-muted-foreground">
                          Ongoing & Future ({ongoingTasks.length})
                        </span>
                      </div>
                      {groupBy === 'none' ? (
                        <div className="space-y-2">
                          {ongoingTasks.map((task) => (
                            <UnscheduledTaskItem
                              key={task.id}
                              task={task}
                              onToggleComplete={onToggleComplete}
                              onUpdateTask={onUpdateTask}
                              onDeleteTask={onDeleteTask}
                              onAskAI={onAskAI}
                              onBreakdownTask={onBreakdownTask}
                              onStartIntention={onStartIntention}
                              isActiveIntention={activeIntentionId === task.id}
                              showQuickActions={showQuickActions}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(groupBy === 'category' ? groupByCategory(ongoingTasks) : groupByDate(ongoingTasks)).map(({ type, tasks: groupTasks }) => (
                            <div key={type} className="space-y-1">
                              <div className="flex items-center gap-2 py-1 px-2 bg-muted/50 rounded text-xs font-medium text-muted-foreground">
                                {(groupBy === 'category' ? categoryLabels : dateLabels)[type] || type} ({groupTasks.length})
                              </div>
                              <div className="space-y-1 pl-2 border-l-2 border-border">
                                {groupTasks.map((task) => (
                                  <UnscheduledTaskItem
                                    key={task.id}
                                    task={task}
                                    onToggleComplete={onToggleComplete}
                                    onUpdateTask={onUpdateTask}
                                    onDeleteTask={onDeleteTask}
                                    onAskAI={onAskAI}
                                    onBreakdownTask={onBreakdownTask}
                                    onStartIntention={onStartIntention}
                                    isActiveIntention={activeIntentionId === task.id}
                                    showQuickActions={showQuickActions}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          <div className="text-sm text-muted-foreground pt-2 border-t border-border">
            {dailyTasks.filter(t => !t.completed).length} today •{' '}
            {ongoingTasks.filter(t => !t.completed).length} ongoing •{' '}
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
              <Label htmlFor="task-type">Task Type</Label>
              <Select value={newTaskType} onValueChange={(value: any) => setNewTaskType(value)}>
                <SelectTrigger id="task-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">📚 School</SelectItem>
                  <SelectItem value="work">💼 Work</SelectItem>
                  <SelectItem value="home">🏠 Home</SelectItem>
                  <SelectItem value="appointment">📅 Appointment</SelectItem>
                  <SelectItem value="call">📞 Call</SelectItem>
                  <SelectItem value="other">📋 Other</SelectItem>
                </SelectContent>
              </Select>
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
        onOpenChat={onOpenAIChat}
      />

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        feature="AI Task Organization"
      />
    </>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export const TaskList = memo(TaskListComponent);

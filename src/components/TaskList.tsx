import { useState, useMemo, memo } from 'react';
import { Plus, Search, Filter, Sparkles, Clock, MoreVertical, Trash2, CheckCircle2, Target, Sun, Moon, Calendar, Zap, Battery } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Task, TimeBlock } from '@/types';
import { UnscheduledTaskItem } from './UnscheduledTaskItem';
import { AIOrganizeDialog } from './AIOrganizeDialog';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import { UpgradeModal } from './premium/UpgradeModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  onOpenDailyPlanning?: () => void;
  // When true, tasks are draggable and can be dropped on time blocks
  enableDragDrop?: boolean;
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

// Time-based category for the Time view mode
interface TimeCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tasks: Task[];
  isAvailableNow: boolean;
}

// Group tasks by time constraints (for Time view mode)
const groupByTimeConstraint = (tasksToGroup: Task[], currentHour: number): { available: TimeCategory[]; unavailable: TimeCategory[] } => {
  const isBusinessHours = currentHour >= 8 && currentHour < 17;
  const isMorning = currentHour >= 5 && currentHour < 12;
  const isEvening = currentHour >= 17 && currentHour < 23;

  const categories: TimeCategory[] = [];

  // Business Hours Tasks (8am-5pm only)
  const businessHoursTasks = tasksToGroup.filter(task => {
    if (task.completed) return false;
    if (task.timeConstraint === 'business-hours') return true;
    if (task.taskType === 'call' || task.taskType === 'appointment') return true;
    if (task.timeConstraint === 'custom' && task.customTimeWindow) {
      const startHour = parseInt(task.customTimeWindow.startTime.split(':')[0]);
      const endHour = parseInt(task.customTimeWindow.endTime.split(':')[0]);
      return startHour >= 8 && endHour <= 17;
    }
    return false;
  });

  if (businessHoursTasks.length > 0) {
    categories.push({
      id: 'business-hours',
      title: 'Business Hours Only',
      description: '8am - 5pm',
      icon: <Calendar className="h-4 w-4" />,
      color: isBusinessHours ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
      tasks: businessHoursTasks,
      isAvailableNow: isBusinessHours,
    });
  }

  // Morning Tasks
  const morningTasks = tasksToGroup.filter(task => {
    if (task.completed) return false;
    if (task.timeConstraint === 'morning') return true;
    if (task.timeConstraint === 'custom' && task.customTimeWindow) {
      const startHour = parseInt(task.customTimeWindow.startTime.split(':')[0]);
      return startHour >= 5 && startHour < 12;
    }
    return false;
  });

  if (morningTasks.length > 0) {
    categories.push({
      id: 'morning',
      title: 'Morning Tasks',
      description: '5am - 12pm',
      icon: <Sun className="h-4 w-4" />,
      color: isMorning ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground',
      tasks: morningTasks,
      isAvailableNow: isMorning,
    });
  }

  // Evening Tasks
  const eveningTasks = tasksToGroup.filter(task => {
    if (task.completed) return false;
    if (task.timeConstraint === 'evening') return true;
    if (task.timeConstraint === 'custom' && task.customTimeWindow) {
      const startHour = parseInt(task.customTimeWindow.startTime.split(':')[0]);
      return startHour >= 17;
    }
    return false;
  });

  if (eveningTasks.length > 0) {
    categories.push({
      id: 'evening',
      title: 'Evening Tasks',
      description: '5pm - 11pm',
      icon: <Moon className="h-4 w-4" />,
      color: isEvening ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground',
      tasks: eveningTasks,
      isAvailableNow: isEvening,
    });
  }

  // High Energy Tasks
  const highEnergyTasks = tasksToGroup.filter(task =>
    !task.completed && task.energyLevel === 'high' && !task.timeConstraint
  );

  if (highEnergyTasks.length > 0) {
    categories.push({
      id: 'high-energy',
      title: 'High Energy Required',
      description: "Best when you're fresh",
      icon: <Zap className="h-4 w-4" />,
      color: 'text-yellow-600 dark:text-yellow-400',
      tasks: highEnergyTasks,
      isAvailableNow: true,
    });
  }

  // Low Energy Tasks
  const lowEnergyTasks = tasksToGroup.filter(task =>
    !task.completed && task.energyLevel === 'low' && !task.timeConstraint
  );

  if (lowEnergyTasks.length > 0) {
    categories.push({
      id: 'low-energy',
      title: 'Low Energy OK',
      description: 'Can do when tired',
      icon: <Battery className="h-4 w-4" />,
      color: 'text-gray-600 dark:text-gray-400',
      tasks: lowEnergyTasks,
      isAvailableNow: true,
    });
  }

  // Anytime Tasks (no time constraint, not already categorized)
  const categorizedIds = new Set(categories.flatMap(cat => cat.tasks.map(t => t.id)));
  const anytimeTasks = tasksToGroup.filter(task => !task.completed && !categorizedIds.has(task.id));

  if (anytimeTasks.length > 0) {
    categories.push({
      id: 'anytime',
      title: 'Anytime Tasks',
      description: 'No time constraints',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-primary',
      tasks: anytimeTasks,
      isAvailableNow: true,
    });
  }

  return {
    available: categories.filter(cat => cat.isAvailableNow && cat.tasks.length > 0),
    unavailable: categories.filter(cat => !cat.isAvailableNow && cat.tasks.length > 0),
  };
};

// Helper component to render a task item, optionally wrapped in a Draggable
interface DraggableTaskItemProps {
  task: Task;
  index: number;
  enableDragDrop: boolean;
  onToggleComplete: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAskAI?: (message: string) => void;
  onBreakdownTask?: (task: Task) => void;
  onStartIntention?: (task: Task) => void;
  isActiveIntention: boolean;
  showQuickActions: boolean;
}

const DraggableTaskItem = ({
  task,
  index,
  enableDragDrop,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onAskAI,
  onBreakdownTask,
  onStartIntention,
  isActiveIntention,
  showQuickActions,
}: DraggableTaskItemProps) => {
  if (enableDragDrop && !task.completed) {
    return (
      <Draggable draggableId={`task-${task.id}`} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
          >
            <UnscheduledTaskItem
              task={task}
              onToggleComplete={onToggleComplete}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onAskAI={onAskAI}
              onBreakdownTask={onBreakdownTask}
              onStartIntention={onStartIntention}
              isActiveIntention={isActiveIntention}
              showQuickActions={showQuickActions}
              dragHandleProps={provided.dragHandleProps}
              isDraggable={true}
              isDragging={snapshot.isDragging}
            />
          </div>
        )}
      </Draggable>
    );
  }

  return (
    <UnscheduledTaskItem
      task={task}
      onToggleComplete={onToggleComplete}
      onUpdateTask={onUpdateTask}
      onDeleteTask={onDeleteTask}
      onAskAI={onAskAI}
      onBreakdownTask={onBreakdownTask}
      onStartIntention={onStartIntention}
      isActiveIntention={isActiveIntention}
      showQuickActions={showQuickActions}
    />
  );
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
  onOpenDailyPlanning,
  enableDragDrop = false,
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
  const isMobile = useIsMobile();

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

  // MEMOIZE: Time-constraint categories (for Time view mode)
  const currentHour = new Date().getHours();
  const timeCategories = useMemo(() => {
    return groupByTimeConstraint(filteredTasks, currentHour);
  }, [filteredTasks, currentHour]);

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
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg">To-Do List</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredTasks.filter(t => !t.completed).length} tasks remaining
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onOpenDailyPlanning && (
                <Button
                  onClick={onOpenDailyPlanning}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5"
                  title="Plan which tasks to focus on today"
                >
                  <Target className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Plan Day</span>
                </Button>
              )}
              {onToggleTimeConstraintView && (
                <Button
                  onClick={onToggleTimeConstraintView}
                  variant={showTimeConstraintView ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-2.5"
                  title="Toggle time-based task view"
                >
                  <Clock className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">{showTimeConstraintView ? 'List' : 'Time'}</span>
                </Button>
              )}
              <Button
                onClick={handleAIOrganize}
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                title="Organize tasks with AI"
              >
                <Sparkles className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">AI</span>
              </Button>
              {(onClearCompleted || onClearAll) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
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
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'none' | 'category' | 'date')}>
              <SelectTrigger className="w-[100px] h-8 text-sm">
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No grouping</SelectItem>
                <SelectItem value="category">By Category</SelectItem>
                <SelectItem value="date">By Due Date</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowCompleted(!showCompleted)}
              title={showCompleted ? "Hide completed" : "Show completed"}
            >
              <Filter className={`h-4 w-4 ${showCompleted ? 'text-primary' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 flex-1 flex flex-col overflow-hidden pt-0">
          <div className="space-y-2">
            {bulkMode ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste your task list here... (one task per line)"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="min-h-[100px] resize-none text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={handleBulkAdd} className="btn-primary flex-1 h-8 text-sm" disabled={bulkAddLoading}>
                    {bulkAddLoading ? 'Saving...' : 'Add All'}
                  </Button>
                  <Button onClick={() => { setBulkText(''); setBulkMode(false); }} variant="outline" className="h-8 text-sm" disabled={bulkAddLoading}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleOpenTaskDialog} className="btn-primary flex-1 h-9">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkMode(true)}
                  className="h-9 px-3 text-xs"
                  title="Add multiple tasks at once"
                >
                  Bulk
                </Button>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks yet. Add one above!</p>
                </div>
              ) : showTimeConstraintView ? (
                /* ========== TIME VIEW MODE ========== */
                <div className="space-y-6">
                  {/* Header with current time */}
                  <p className="text-xs text-muted-foreground">
                    Tasks organized by when you can do them • {format(new Date(), 'h:mm a')}
                  </p>

                  {/* Available Now Section */}
                  {timeCategories.available.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">
                          Available Now
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {timeCategories.available.reduce((sum, cat) => sum + cat.tasks.length, 0)} tasks
                        </span>
                      </div>

                      {timeCategories.available.map(category => (
                        <div key={category.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("flex items-center gap-1", category.color)}>
                              {category.icon}
                              <h3 className="font-semibold text-sm">{category.title}</h3>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              ({category.tasks.length})
                            </span>
                          </div>

                          <div className="space-y-2 pl-6 border-l-2 border-muted">
                            {category.tasks.map((task, index) => (
                              <DraggableTaskItem
                                key={task.id}
                                task={task}
                                index={index}
                                enableDragDrop={enableDragDrop}
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

                  {/* Not Available Now Section */}
                  {timeCategories.unavailable.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Not Available Right Now
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {timeCategories.unavailable.reduce((sum, cat) => sum + cat.tasks.length, 0)} tasks
                        </span>
                      </div>

                      {timeCategories.unavailable.map(category => (
                        <div key={category.id} className="space-y-2 opacity-60">
                          <div className="flex items-center gap-2">
                            <div className={cn("flex items-center gap-1", category.color)}>
                              {category.icon}
                              <h3 className="font-semibold text-sm">{category.title}</h3>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              ({category.tasks.length})
                            </span>
                          </div>

                          <div className="space-y-1 pl-6">
                            {category.tasks.map(task => (
                              <div key={task.id} className="text-xs text-muted-foreground truncate">
                                • {task.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {timeCategories.available.length === 0 && timeCategories.unavailable.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No tasks to show. Add some tasks to get started!</p>
                    </div>
                  )}
                </div>
              ) : (
                /* ========== LIST VIEW MODE ========== */
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
                        <Droppable droppableId="daily-tasks" isDropDisabled={true}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-2"
                            >
                              {dailyTasks.map((task, index) => (
                                <DraggableTaskItem
                                  key={task.id}
                                  task={task}
                                  index={index}
                                  enableDragDrop={enableDragDrop}
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
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      ) : (
                        <div className="space-y-3">
                          {(groupBy === 'category' ? groupByCategory(dailyTasks) : groupByDate(dailyTasks)).map(({ type, tasks: groupTasks }) => (
                            <div key={type} className="space-y-1">
                              <div className="flex items-center gap-2 py-1 px-2 bg-muted/50 rounded text-xs font-medium text-muted-foreground">
                                {(groupBy === 'category' ? categoryLabels : dateLabels)[type] || type} ({groupTasks.length})
                              </div>
                              <div className="space-y-1 pl-2 border-l-2 border-primary/30">
                                {groupTasks.map((task, index) => (
                                  <DraggableTaskItem
                                    key={task.id}
                                    task={task}
                                    index={index}
                                    enableDragDrop={enableDragDrop}
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
                        <Droppable droppableId="ongoing-tasks" isDropDisabled={true}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-2"
                            >
                              {ongoingTasks.map((task, index) => (
                                <DraggableTaskItem
                                  key={task.id}
                                  task={task}
                                  index={index}
                                  enableDragDrop={enableDragDrop}
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
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      ) : (
                        <div className="space-y-3">
                          {(groupBy === 'category' ? groupByCategory(ongoingTasks) : groupByDate(ongoingTasks)).map(({ type, tasks: groupTasks }) => (
                            <div key={type} className="space-y-1">
                              <div className="flex items-center gap-2 py-1 px-2 bg-muted/50 rounded text-xs font-medium text-muted-foreground">
                                {(groupBy === 'category' ? categoryLabels : dateLabels)[type] || type} ({groupTasks.length})
                              </div>
                              <div className="space-y-1 pl-2 border-l-2 border-border">
                                {groupTasks.map((task, index) => (
                                  <DraggableTaskItem
                                    key={task.id}
                                    task={task}
                                    index={index}
                                    enableDragDrop={enableDragDrop}
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
            {showTimeConstraintView ? (
              <>
                {timeCategories.available.reduce((sum, cat) => sum + cat.tasks.length, 0)} available now •{' '}
                {timeCategories.unavailable.reduce((sum, cat) => sum + cat.tasks.length, 0)} later •{' '}
                {filteredTasks.filter(t => t.completed).length} completed
              </>
            ) : (
              <>
                {dailyTasks.filter(t => !t.completed).length} today •{' '}
                {ongoingTasks.filter(t => !t.completed).length} ongoing •{' '}
                {filteredTasks.filter(t => t.completed).length} completed
              </>
            )}
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

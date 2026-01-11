import { useState, useMemo, memo, useEffect } from 'react';
import { Task, TomorrowIntentions, TomorrowIntention } from '@/types';
import { Plus, MoreHorizontal, Sparkles, TrendingUp, Clock, ListPlus, CalendarClock, Check, Play, Pencil, Trash2, Target, Moon, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isToday, parseISO } from 'date-fns';

interface MobileTaskViewProps {
  tasks: Task[];
  userName?: string;
  userAvatar?: string;
  onToggleComplete: (id: string) => void;
  onAddTask: (title: string, estimatedMinutes?: number, taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other') => void;
  onBulkAddTasks?: (tasks: Array<{ title: string; estimatedMinutes?: number }>) => Promise<void>;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAskAI?: (message: string) => void;
  onOpenDailyPlanning?: () => void;
  onOpenAIChat?: (context: string) => void;
  onOpenDailyReview?: () => void;
  /** Hide bottom navigation when embedded in dashboard (default: false) */
  showBottomNav?: boolean;
  /** Hide header when embedded in dashboard (default: true) */
  showHeader?: boolean;
  /** ID of the currently active task in the timer (for highlighting) */
  activeTaskId?: string | null;
  /** Whether the timer is currently running (for animation) */
  isTimerRunning?: boolean;
  /** Tomorrow's intentions from Daily Review */
  intentions?: TomorrowIntentions | null;
  /** Callback when an intention is toggled */
  onToggleIntention?: (intentionId: string) => void;
  /** Callback to open the Daily Review modal */
  onOpenDailyReviewForIntentions?: () => void;
  /** Callback to start a work session on a task */
  onStartWorkSession?: (task: Task) => void;
}

interface CategoryConfig {
  id: string;
  name: string;
  icon: string;
  urgentBadge?: boolean;
}

// Category configuration - colors will come from theme
const categoryConfig: Record<string, CategoryConfig> = {
  work: {
    id: 'work',
    name: 'Work',
    icon: '💼',
  },
  school: {
    id: 'school',
    name: 'School',
    icon: '📚',
    urgentBadge: true,
  },
  home: {
    id: 'home',
    name: 'Health & Home',
    icon: '🏠',
  },
  other: {
    id: 'other',
    name: 'Personal',
    icon: '👤',
  },
  appointment: {
    id: 'appointment',
    name: 'Appointments',
    icon: '📅',
  },
  call: {
    id: 'call',
    name: 'Calls',
    icon: '📞',
  },
};

// Get current greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// Get formatted date
const getFormattedDate = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
  return now.toLocaleDateString('en-US', options);
};

const MobileTaskViewComponent = ({
  tasks,
  userName = 'User',
  userAvatar,
  onToggleComplete,
  onAddTask,
  onBulkAddTasks,
  onUpdateTask,
  onDeleteTask,
  onAskAI,
  onOpenDailyPlanning,
  onOpenAIChat,
  onOpenDailyReview,
  showBottomNav = false,
  showHeader = true,
  activeTaskId,
  isTimerRunning = false,
  intentions,
  onToggleIntention,
  onOpenDailyReviewForIntentions,
  onStartWorkSession,
}: MobileTaskViewProps) => {
  // Track recently completed intentions for celebration animation
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('');
  const [newTaskType, setNewTaskType] = useState<'school' | 'work' | 'home' | 'appointment' | 'call' | 'other'>('work');
  const [bulkText, setBulkText] = useState('');
  const [bulkAddLoading, setBulkAddLoading] = useState(false);
  
  // Edit task state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskMinutes, setEditTaskMinutes] = useState('');
  const [editTaskType, setEditTaskType] = useState<'school' | 'work' | 'home' | 'appointment' | 'call' | 'other'>('other');

  // Handle opening edit dialog
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskMinutes(task.estimatedMinutes?.toString() || '');
    setEditTaskType(task.taskType || 'other');
    setEditDialogOpen(true);
  };

  // Handle saving edited task
  const handleSaveEditedTask = () => {
    if (editingTask && editTaskTitle.trim()) {
      const updatedTask: Task = {
        ...editingTask,
        title: editTaskTitle.trim(),
        estimatedMinutes: editTaskMinutes ? parseInt(editTaskMinutes) : undefined,
        taskType: editTaskType,
      };
      onUpdateTask(updatedTask);
      setEditDialogOpen(false);
      setEditingTask(null);
    }
  };

  // Handle deleting a task
  const handleDeleteTaskClick = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDeleteTask(taskId);
    }
  };

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      const type = task.taskType || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(task);
    });
    
    return groups;
  }, [tasks]);

  // Calculate progress
  const progressStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [tasks]);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const minutes = newTaskMinutes ? parseInt(newTaskMinutes) : undefined;
      onAddTask(newTaskTitle, minutes, newTaskType);
      setNewTaskTitle('');
      setNewTaskMinutes('');
      setNewTaskType('work');
      setTaskDialogOpen(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    
    const lines = bulkText
      .split('\n')
      .map(line => line.trim())
      .map(line => line.replace(/^[-*•]\s*|^\[\s*[x ]?\s*\]\s*|^\d+[.)]\s*/i, '').trim())
      .filter(line => line.length > 0);
    
    const uniqueLines = Array.from(new Set(lines));
    
    const tasksToAdd = uniqueLines.map((line: string) => {
      const estimateMatch = line.match(/(.+?)\s+(\d+)\s*(m|min|h|hr|hour)s?$/i);
      if (estimateMatch) {
        const title = estimateMatch[1].trim();
        const value = parseInt(estimateMatch[2]);
        const unit = estimateMatch[3].toLowerCase();
        const minutes = unit.startsWith('h') ? value * 60 : value;
        return { title, estimatedMinutes: minutes };
      }
      return { title: line };
    });
    
    if (onBulkAddTasks) {
      setBulkAddLoading(true);
      try {
        await onBulkAddTasks(tasksToAdd);
        setBulkText('');
        setBulkDialogOpen(false);
      } finally {
        setBulkAddLoading(false);
      }
    } else {
      tasksToAdd.forEach(task => onAddTask(task.title, task.estimatedMinutes));
      setBulkText('');
      setBulkDialogOpen(false);
    }
  };

  const handleOpenAddTask = () => {
    setFabMenuOpen(false);
    setTaskDialogOpen(true);
  };

  const handleOpenBulkAdd = () => {
    setFabMenuOpen(false);
    setBulkDialogOpen(true);
  };

  const handlePlanDay = () => {
    setFabMenuOpen(false);
    onOpenDailyPlanning?.();
  };

  const handleAskAI = () => {
    setFabMenuOpen(false);
    onOpenAIChat?.('Help me prioritize my tasks');
  };

  // Check if a task is due today
  const isDueToday = (task: Task) => {
    if (!task.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-background overflow-hidden rounded-3xl shadow-2xl border border-border">
      {/* Status bar area */}
      <div className="w-full h-4 shrink-0 bg-transparent z-20" />

      {/* Main content */}
      <ScrollArea className={cn("flex-1", showBottomNav ? "pb-28" : "pb-6")}>
        <div className="px-5 pt-2 pb-6">
          {/* Header - only show if showHeader is true */}
          {showHeader && (
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 backdrop-blur-sm border border-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {getFormattedDate()}
                    </span>
                  </span>
                </div>
                <h2 className="text-foreground tracking-tight text-3xl font-bold leading-[1.1]">
                  {getGreeting()},<br />
                  <span className="text-muted-foreground">{userName}</span>
                </h2>
              </div>
              <div 
                className="relative group cursor-pointer"
                onClick={() => onOpenDailyReview?.()}
                title="Open Daily Review"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full opacity-30 group-hover:opacity-70 blur transition duration-200" />
                <div className="relative h-12 w-12 rounded-full border-2 border-background overflow-hidden group-hover:scale-105 transition-transform">
                  {userAvatar ? (
                    <img alt="User profile" className="h-full w-full object-cover" src={userAvatar} />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Intentions Bar - Priority tasks from Daily Review */}
          {showHeader && (
            <div className="mb-4">
              {(() => {
                // Check if intentions are valid for today
                const hasValidIntentions = intentions && 
                  intentions.intentions.length > 0 && 
                  isToday(parseISO(intentions.date));
                
                // Handler for toggling with celebration
                const handleIntentionToggle = (intentionId: string, wasCompleted: boolean) => {
                  if (!wasCompleted) {
                    // Trigger celebration animation
                    setCelebratingId(intentionId);
                    setTimeout(() => setCelebratingId(null), 1500);
                  }
                  onToggleIntention?.(intentionId);
                };
                
                if (hasValidIntentions && intentions) {
                  const completedCount = intentions.intentions.filter(i => i.completed).length;
                  const allCompleted = completedCount === intentions.intentions.length;
                  
                  return (
                    <div className={cn(
                      "relative p-4 rounded-2xl border overflow-hidden transition-all duration-300",
                      allCompleted 
                        ? "bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border-green-500/30" 
                        : "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20"
                    )}>
                      {/* Subtle decorative element */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
                      
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-full transition-colors",
                            allCompleted ? "bg-green-500/20" : "bg-primary/20"
                          )}>
                            <Target className={cn(
                              "h-3.5 w-3.5",
                              allCompleted ? "text-green-500" : "text-primary"
                            )} />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">Today's Intentions</h3>
                            <p className="text-[10px] text-muted-foreground">
                              {allCompleted ? "All done! 🎉" : `${completedCount}/${intentions.intentions.length} complete`}
                            </p>
                          </div>
                        </div>
                        {allCompleted && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                            <Sparkles className="h-3 w-3" />
                            Done!
                          </span>
                        )}
                      </div>
                      
                      {/* Intention Slots - Always show 3 */}
                      <div className="space-y-2">
                        {[0, 1, 2].map((index) => {
                          const intention = intentions.intentions[index];
                          const isCelebrating = celebratingId === intention?.id;
                          
                          if (!intention) {
                            // Empty slot
                            return (
                              <div 
                                key={`empty-${index}`}
                                className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 border border-dashed border-border/50"
                              >
                                <span className="text-[10px] font-medium text-muted-foreground/50 w-4 text-center">
                                  {index + 1}.
                                </span>
                                <div className="h-4 w-4 rounded-md border-2 border-dashed border-muted-foreground/30" />
                                <span className="text-xs text-muted-foreground/50 italic">
                                  No intention set
                                </span>
                              </div>
                            );
                          }
                          
                          return (
                            <div 
                              key={intention.id}
                              className={cn(
                                "relative flex items-center gap-3 p-2 rounded-xl transition-all duration-300 cursor-pointer group",
                                intention.completed 
                                  ? "bg-green-500/10" 
                                  : "bg-background/60 hover:bg-background/90",
                                isCelebrating && "ring-2 ring-green-500/50 scale-[1.02]",
                                // Active work session indicator - pulsing ring when working on this intention
                                !intention.completed && activeTaskId && intention.taskId === activeTaskId && isTimerRunning && 
                                  "ring-2 ring-primary animate-pulse bg-primary/10"
                              )}
                              onClick={() => handleIntentionToggle(intention.id, intention.completed)}
                            >
                              {/* Celebration particles */}
                              {isCelebrating && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                                  <div className="absolute -top-1 left-1/4 text-yellow-500 animate-bounce">✨</div>
                                  <div className="absolute -top-1 right-1/4 text-green-500 animate-bounce delay-75">🎉</div>
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <PartyPopper className="h-6 w-6 text-primary animate-ping opacity-50" />
                                  </div>
                                </div>
                              )}
                              
                              <span className="text-[10px] font-medium text-muted-foreground w-4 text-center">
                                {index + 1}.
                              </span>
                              <Checkbox
                                checked={intention.completed}
                                onCheckedChange={() => handleIntentionToggle(intention.id, intention.completed)}
                                className={cn(
                                  "transition-all h-4 w-4",
                                  intention.completed && "bg-green-500 border-green-500",
                                  !intention.completed && "group-hover:border-primary",
                                  // Active task checkbox styling
                                  !intention.completed && activeTaskId && intention.taskId === activeTaskId && "border-primary"
                                )}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className={cn(
                                "flex-1 text-sm transition-all",
                                intention.completed && "line-through text-muted-foreground",
                                !intention.completed && "text-foreground",
                                // Active task bold text
                                !intention.completed && activeTaskId && intention.taskId === activeTaskId && "font-semibold text-primary"
                              )}>
                                {intention.title}
                              </span>
                              {/* Active work indicator badge */}
                              {!intention.completed && activeTaskId && intention.taskId === activeTaskId && (
                                <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-full">
                                  <Play className="h-2 w-2 fill-current" />
                                  Working
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                
                // Empty state - gentle prompt to set intentions
                return (
                  <div 
                    className="p-4 rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-all group"
                    onClick={() => onOpenDailyReviewForIntentions?.() || onOpenDailyReview?.()}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Moon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground">Set Your Intentions</h3>
                        <p className="text-xs text-muted-foreground">
                          Open Daily Review to set your top 3 priorities
                        </p>
                      </div>
                      <Target className="h-5 w-5 text-primary/50 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Daily Goals Progress Card */}
          <div className="bg-card p-5 rounded-3xl shadow-lg border border-border mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <p className="text-card-foreground text-lg font-bold">Daily Goals</p>
                <span className="text-xs text-muted-foreground font-medium">
                  {progressStats.percentage > 50 ? "You're doing great!" : "Keep going!"}
                </span>
              </div>
              <span className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-accent/20 text-accent-foreground"
              )}>
                <TrendingUp className="h-3.5 w-3.5" />
                {progressStats.percentage >= 50 ? 'On Track' : 'Getting There'}
              </span>
            </div>
            <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressStats.percentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 items-end">
              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(progressStats.completed, 3) }).map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-primary border-2 border-card flex items-center justify-center text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                ))}
                {progressStats.total - progressStats.completed > 0 && (
                  <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                    +{progressStats.total - progressStats.completed}
                  </div>
                )}
              </div>
              <p className="text-card-foreground text-xl font-bold">{progressStats.percentage}%</p>
            </div>
          </div>

          {/* Categories Header */}
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Categories</h3>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(tasksByCategory).map(([category, categoryTasks]) => {
              const config = categoryConfig[category] || categoryConfig.other;
              const incompleteTasks = categoryTasks.filter(t => !t.completed);
              const completedCount = categoryTasks.filter(t => t.completed).length;
              const isFullWidth = category === 'work' || incompleteTasks.length > 2;
              const hasDueToday = incompleteTasks.some(isDueToday);

              return (
                <div
                  key={category}
                  className={cn(
                    "rounded-3xl p-4 shadow-lg border border-border relative overflow-hidden group hover:shadow-xl transition-shadow bg-card",
                    isFullWidth && 'col-span-2 p-5'
                  )}
                >
                  {/* More Options Button */}
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="bg-muted/50 backdrop-blur rounded-full p-1.5 text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => {
                            incompleteTasks.forEach(task => onToggleComplete(task.id));
                          }}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Mark all complete
                        </DropdownMenuItem>
                        {completedCount > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                const completedInCategory = categoryTasks.filter(t => t.completed);
                                completedInCategory.forEach(task => onDeleteTask(task.id));
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete completed ({completedCount})
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Urgent Badge */}
                  {config.urgentBadge && incompleteTasks.length > 0 && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold text-destructive-foreground bg-destructive px-2 py-0.5 rounded-full shadow-sm">
                      URGENT
                    </span>
                  )}

                  {/* Category Header */}
                  <div className={cn("flex items-center gap-3", isFullWidth ? 'mb-5' : 'flex-col items-start gap-2 mb-4')}>
                    <div className={cn(
                      "rounded-xl flex items-center justify-center bg-muted/50 ring-1 ring-border text-2xl",
                      isFullWidth ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10'
                    )}>
                      {config.icon}
                    </div>
                    <div>
                      <h3 className={cn(
                        "text-card-foreground font-bold leading-tight",
                        isFullWidth ? 'text-xl' : 'text-lg'
                      )}>
                        {config.name}
                      </h3>
                      {isFullWidth && (
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                          {incompleteTasks.length} tasks remaining
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Task List */}
                  <div className={cn("space-y-3", isFullWidth ? '' : 'flex-1')}>
                    {incompleteTasks.slice(0, isFullWidth ? undefined : 2).map(task => {
                      const isActiveTask = activeTaskId === task.id;
                      return (
                        <div 
                          key={task.id} 
                          className={cn(
                            "flex gap-x-3 items-center group/item p-2 -mx-2 rounded-xl transition-all",
                            isActiveTask && "bg-primary/10 ring-2 ring-primary/50",
                            isActiveTask && isTimerRunning && "animate-pulse"
                          )}
                        >
                          <label className="flex gap-x-3 items-center flex-1 cursor-pointer min-w-0">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => onToggleComplete(task.id)}
                              className={cn(
                                "h-5 w-5 rounded-md border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                                isActiveTask ? "border-primary" : "border-border"
                              )}
                            />
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              {/* Active indicator */}
                              {isActiveTask && (
                                <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-full">
                                  <Play className="h-2.5 w-2.5 fill-current" />
                                  ACTIVE
                                </span>
                              )}
                              <span className={cn(
                                "font-medium transition-colors group-hover/item:text-primary truncate",
                                isFullWidth ? 'text-[15px]' : 'text-xs leading-snug',
                                isActiveTask ? 'text-primary font-semibold' : 'text-card-foreground',
                                task.completed && 'text-muted-foreground line-through'
                              )}>
                                {task.title}
                              </span>
                              {/* Estimated time badge */}
                              {task.estimatedMinutes && !task.completed && !isActiveTask && (
                                <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                                  <Clock className="h-2.5 w-2.5" />
                                  {task.estimatedMinutes < 60
                                    ? `${task.estimatedMinutes}m`
                                    : `${Math.floor(task.estimatedMinutes / 60)}h${task.estimatedMinutes % 60 > 0 ? ` ${task.estimatedMinutes % 60}m` : ''}`
                                  }
                                </span>
                              )}
                            </div>
                          </label>
                          {/* Start Work Button - show when not active */}
                          {!isActiveTask && onStartWorkSession && (
                            <button
                              className="opacity-0 group-hover/item:opacity-100 focus:opacity-100 bg-primary/10 backdrop-blur rounded-full p-1.5 text-primary cursor-pointer hover:bg-primary/20 hover:scale-110 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartWorkSession(task);
                              }}
                              title="Start working on this task"
                            >
                              <Play className="h-4 w-4 fill-current" />
                            </button>
                          )}
                          {/* Task Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button 
                                className="opacity-0 group-hover/item:opacity-100 focus:opacity-100 bg-muted/50 backdrop-blur rounded-full p-1.5 text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {onStartWorkSession && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => onStartWorkSession(task)}
                                    className={isActiveTask ? "text-muted-foreground" : "text-primary"}
                                    disabled={isActiveTask}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    {isActiveTask ? 'Currently Active' : 'Start Work'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>                              
                              )}
                              <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTaskClick(task.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer for full-width cards */}
                  {isFullWidth && (hasDueToday || completedCount > 0) && (
                    <div className="mt-5 pt-3 border-t border-border flex justify-between items-center">
                      {hasDueToday && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-accent-foreground bg-accent/20 px-2.5 py-1.5 rounded-lg">
                          <Clock className="h-3.5 w-3.5" />
                          Due Today
                        </div>
                      )}
                      {completedCount > 0 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          +{completedCount} completed
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {Object.keys(tasksByCategory).length === 0 && (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <div className="text-5xl mb-3 opacity-50">✓</div>
                <p className="font-medium">No tasks yet</p>
                <p className="text-sm mt-1">Tap the + button to add your first task</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Floating Action Buttons */}
      <div className={cn(
        "absolute right-5 z-40 flex flex-col items-end gap-3 pointer-events-auto",
        showBottomNav ? "bottom-24" : "bottom-6"
      )}>
        {/* FAB Menu Items */}
        <div className={cn(
          "flex flex-col items-end gap-3 transition-all duration-300",
          fabMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}>
          {/* Ask AI */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={handleAskAI}>
            <span className="bg-card text-card-foreground text-xs font-bold py-2 px-3 rounded-xl shadow-lg border border-border whitespace-nowrap">
              Ask AI
            </span>
            <button className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all ring-2 ring-background">
              <Sparkles className="h-5 w-5" />
            </button>
          </div>

          {/* Plan Day */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={handlePlanDay}>
            <span className="bg-card text-muted-foreground text-xs font-medium py-1.5 px-3 rounded-xl shadow-md border border-border whitespace-nowrap group-hover:text-primary transition-colors">
              Plan Day
            </span>
            <button className="h-10 w-10 rounded-full bg-card text-muted-foreground shadow-md flex items-center justify-center hover:bg-accent/20 transition-colors border border-border group-hover:border-primary/50 group-hover:text-primary">
              <CalendarClock className="h-5 w-5" />
            </button>
          </div>

          {/* Bulk Add */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={handleOpenBulkAdd}>
            <span className="bg-card text-muted-foreground text-xs font-medium py-1.5 px-3 rounded-xl shadow-md border border-border whitespace-nowrap group-hover:text-primary transition-colors">
              Bulk Add
            </span>
            <button className="h-10 w-10 rounded-full bg-card text-muted-foreground shadow-md flex items-center justify-center hover:bg-accent/20 transition-colors border border-border group-hover:border-primary/50 group-hover:text-primary">
              <ListPlus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main FAB */}
        <button
          onClick={() => fabMenuOpen ? handleOpenAddTask() : setFabMenuOpen(true)}
          className={cn(
            "h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all mt-2 active:scale-95 group",
            fabMenuOpen
              ? "bg-primary text-primary-foreground"
              : "bg-foreground text-background"
          )}
        >
          <Plus 
            className={cn(
              "h-7 w-7 transition-transform duration-300",
              fabMenuOpen && "rotate-45"
            )} 
          />
        </button>
      </div>

      {/* Overlay when FAB menu is open */}
      <div 
        className={cn(
          "absolute inset-0 bg-background/50 backdrop-blur-[2px] z-30 transition-opacity",
          fabMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setFabMenuOpen(false)}
      />

      {/* Bottom Navigation - only show if showBottomNav is true */}
      {showBottomNav && (
        <div className="absolute bottom-0 left-0 w-full bg-card/90 backdrop-blur-xl border-t border-border z-30">
          <div className="flex justify-around items-center h-20 pb-4 px-4">
            <button className="flex flex-col items-center gap-1.5 p-2 text-primary w-16 transition-transform active:scale-95">
              <span className="text-xl">🏠</span>
              <span className="text-[10px] font-bold">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 p-2 text-muted-foreground hover:text-foreground transition-colors w-16 active:scale-95">
              <span className="text-xl">📅</span>
              <span className="text-[10px] font-medium">Calendar</span>
            </button>
            <div className="w-12" />
            <button className="flex flex-col items-center gap-1.5 p-2 text-muted-foreground hover:text-foreground transition-colors w-16 active:scale-95">
              <span className="text-xl">📊</span>
              <span className="text-[10px] font-medium">Stats</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 p-2 text-muted-foreground hover:text-foreground transition-colors w-16 active:scale-95">
              <span className="text-xl">⚙️</span>
              <span className="text-[10px] font-medium">Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="e.g., Finish Q3 Report"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-type">Category</Label>
              <Select value={newTaskType} onValueChange={(value: any) => setNewTaskType(value)}>
                <SelectTrigger id="task-type" className="rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">💼 Work</SelectItem>
                  <SelectItem value="school">📚 School</SelectItem>
                  <SelectItem value="home">🏠 Home / Health</SelectItem>
                  <SelectItem value="appointment">📅 Appointment</SelectItem>
                  <SelectItem value="call">📞 Call</SelectItem>
                  <SelectItem value="other">👤 Personal</SelectItem>
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
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()} className="rounded-xl">
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Add Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Paste your task list (one per line)</Label>
              <Textarea
                placeholder="- Task 1&#10;- Task 2 30m&#10;- Task 3 1h"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="min-h-[150px] resize-none rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Add time estimates like "30m" or "1h" at the end of a task
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)} disabled={bulkAddLoading} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleBulkAdd} disabled={!bulkText.trim() || bulkAddLoading} className="rounded-xl">
              {bulkAddLoading ? 'Adding...' : 'Add All Tasks'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-title">Task Title</Label>
              <Input
                id="edit-task-title"
                placeholder="e.g., Finish Q3 Report"
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEditedTask()}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-type">Category</Label>
              <Select value={editTaskType} onValueChange={(value: any) => setEditTaskType(value)}>
                <SelectTrigger id="edit-task-type" className="rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">💼 Work</SelectItem>
                  <SelectItem value="school">📚 School</SelectItem>
                  <SelectItem value="home">🏠 Home / Health</SelectItem>
                  <SelectItem value="appointment">📅 Appointment</SelectItem>
                  <SelectItem value="call">📞 Call</SelectItem>
                  <SelectItem value="other">👤 Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-estimated-minutes">Estimated Minutes (optional)</Label>
              <Input
                id="edit-estimated-minutes"
                type="number"
                placeholder="e.g., 30"
                value={editTaskMinutes}
                onChange={(e) => setEditTaskMinutes(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEditedTask()}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveEditedTask} disabled={!editTaskTitle.trim()} className="rounded-xl">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const MobileTaskView = memo(MobileTaskViewComponent);

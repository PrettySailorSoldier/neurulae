import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Task } from '@/types';
import {
  Sparkles,
  Clock,
  Zap,
  Target,
  Shuffle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickWinSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  currentEnergy?: number;
}

// Pre-defined quick wins for when no tasks match
const UNIVERSAL_QUICK_WINS = [
  { title: 'Clear 5 things from your desk', time: 2 },
  { title: 'Reply to one message', time: 3 },
  { title: 'Make your bed (if not done)', time: 2 },
  { title: 'Drink a glass of water', time: 1 },
  { title: 'Delete 5 emails', time: 3 },
  { title: 'Write tomorrow\'s top priority', time: 2 },
  { title: 'Set a timer and do nothing for 2 minutes', time: 2 },
  { title: 'Stretch for 2 minutes', time: 2 },
];

export function QuickWinSelector({
  open,
  onOpenChange,
  tasks,
  onSelectTask,
  currentEnergy = 5,
}: QuickWinSelectorProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showUniversal, setShowUniversal] = useState(false);

  // Filter tasks that are quick wins (< 15 min, not completed)
  const quickWinTasks = useMemo(() => {
    return tasks
      .filter(t => !t.completed)
      .filter(t => {
        // Prioritize tasks with estimated time < 15 min
        const estimatedTime = t.estimatedMinutes || 30;
        return estimatedTime <= 15;
      })
      .sort((a, b) => {
        // Sort by estimated time (shorter first)
        return (a.estimatedMinutes || 15) - (b.estimatedMinutes || 15);
      })
      .slice(0, 5);
  }, [tasks]);

  // Get random suggestion
  const getRandomTask = () => {
    if (quickWinTasks.length === 0) {
      setShowUniversal(true);
      return;
    }
    const randomIndex = Math.floor(Math.random() * quickWinTasks.length);
    setSelectedTask(quickWinTasks[randomIndex]);
  };

  const handleSelect = (task: Task) => {
    onSelectTask(task);
    onOpenChange(false);
  };

  const getEnergyMatch = (estimatedMinutes: number) => {
    if (currentEnergy <= 3) return estimatedMinutes <= 5;
    if (currentEnergy <= 5) return estimatedMinutes <= 10;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Win Selector
          </DialogTitle>
          <DialogDescription>
            Start with something small and buildable. Momentum matters more than perfection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Random picker */}
          <Button
            variant="outline"
            className="w-full gap-2 h-auto py-3"
            onClick={getRandomTask}
          >
            <Shuffle className="w-4 h-4" />
            <span>Pick one for me</span>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </Button>

          {/* Selected task highlight */}
          {selectedTask && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    Suggested
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedTask.estimatedMinutes || 15} min
                  </Badge>
                </div>
                <p className="font-medium mb-3">{selectedTask.title}</p>
                <Button className="w-full" onClick={() => handleSelect(selectedTask)}>
                  <Target className="w-4 h-4 mr-2" />
                  Start This One
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Task list */}
          {!showUniversal && quickWinTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Quick tasks from your list:
              </p>
              {quickWinTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleSelect(task)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left text-sm',
                    'border border-border/50 hover:border-primary/30 hover:bg-accent/50',
                    'transition-all flex items-center justify-between gap-2',
                    getEnergyMatch(task.estimatedMinutes || 15) 
                      ? 'bg-green-500/5' 
                      : 'bg-card'
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      getEnergyMatch(task.estimatedMinutes || 15)
                        ? 'bg-green-500'
                        : 'bg-muted'
                    )} />
                    <span className="truncate">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {task.estimatedMinutes || 15}m
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Universal quick wins */}
          {(showUniversal || quickWinTasks.length === 0) && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Universal quick wins:
              </p>
              {UNIVERSAL_QUICK_WINS.slice(0, 5).map((win, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Create a temporary task object
                    const tempTask: Task = {
                      id: `temp-${index}`,
                      title: win.title,
                      completed: false,
                      createdAt: new Date().toISOString(),
                      estimatedMinutes: win.time,
                    };
                    onSelectTask(tempTask);
                    onOpenChange(false);
                  }}
                  className={cn(
                    'w-full p-3 rounded-lg text-left text-sm',
                    'border border-border/50 hover:border-primary/30 hover:bg-accent/50',
                    'transition-all flex items-center justify-between gap-2 bg-card'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <span>{win.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {win.time}m
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* Toggle between lists */}
          {quickWinTasks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowUniversal(!showUniversal)}
            >
              {showUniversal ? 'Show my tasks' : 'Show universal quick wins'}
            </Button>
          )}

          {/* Encouragement */}
          <div className="text-center p-3 bg-accent/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <span className="font-medium">Starting is the hardest part.</span>
              <br />
              Pick anything. You can always pivot after you start.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuickWinSelector;

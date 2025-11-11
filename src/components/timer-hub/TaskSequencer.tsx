import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TimedTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, SkipForward, Trash2, Plus, GripVertical, Coffee } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface TaskSequencerProps {
  onSaveSession: (taskId: string | undefined, minutes: number) => void;
}

export function TaskSequencer({ onSaveSession }: TaskSequencerProps) {
  const [tasks, setTasks] = useLocalStorage<TimedTask[]>('neurulae-task-sequence', []);
  const [currentTaskIndex, setCurrentTaskIndex] = useLocalStorage('neurulae-current-task-index', 0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pauseBetweenTasks, setPauseBetweenTasks] = useLocalStorage('neurulae-pause-between-tasks', true);
  const [breakMinutes, setBreakMinutes] = useLocalStorage('neurulae-break-minutes', 5);
  const [onBreak, setOnBreak] = useState(false);

  const totalMinutes = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const completedMinutes = tasks
    .slice(0, currentTaskIndex)
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTaskComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, currentTaskIndex, onBreak]);

  const handleTaskComplete = () => {
    const currentTask = tasks[currentTaskIndex];
    
    if (onBreak) {
      toast.success('Break complete! Back to work 💪');
      setOnBreak(false);
      if (currentTaskIndex + 1 < tasks.length) {
        setCurrentTaskIndex(prev => prev + 1);
        setTimeRemaining(tasks[currentTaskIndex + 1].estimatedMinutes * 60);
      } else {
        toast.success('🎉 All tasks complete! Amazing work!', {
          description: `You completed ${tasks.length} tasks!`
        });
        setIsRunning(false);
        setTimeRemaining(0);
      }
    } else {
      if (currentTask) {
        onSaveSession(currentTask.linkedTaskId, currentTask.estimatedMinutes);
        setTasks(prev => prev.map((t, i) => 
          i === currentTaskIndex ? { ...t, completed: true } : t
        ));
        toast.success(`✅ "${currentTask.title}" complete!`);
      }

      if (pauseBetweenTasks && currentTaskIndex + 1 < tasks.length) {
        setOnBreak(true);
        setTimeRemaining(breakMinutes * 60);
        toast.success('☕ Break time! Relax and recharge');
      } else if (currentTaskIndex + 1 < tasks.length) {
        setCurrentTaskIndex(prev => prev + 1);
        setTimeRemaining(tasks[currentTaskIndex + 1].estimatedMinutes * 60);
      } else {
        toast.success('🎉 All tasks complete! Amazing work!', {
          description: `You completed ${tasks.length} tasks!`
        });
        setIsRunning(false);
        setTimeRemaining(0);
      }
    }
  };

  const handleAddTask = () => {
    const newTask: TimedTask = {
      id: crypto.randomUUID(),
      title: 'New Task',
      estimatedMinutes: 25,
      completed: false,
      order: tasks.length,
    };
    setTasks([...tasks, newTask]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleUpdateTask = (id: string, field: keyof TimedTask, value: any) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleStart = () => {
    if (tasks.length === 0) return;
    
    if (!isRunning && timeRemaining === 0) {
      const firstTask = tasks[currentTaskIndex];
      setTimeRemaining(firstTask.estimatedMinutes * 60);
    }
    setIsRunning(true);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setTasks(items.map((task, i) => ({ ...task, order: i })));
  };

  const handleSkip = () => {
    if (currentTaskIndex + 1 < tasks.length) {
      const nextTask = tasks[currentTaskIndex + 1];
      setCurrentTaskIndex(prev => prev + 1);
      setTimeRemaining(nextTask.estimatedMinutes * 60);
      setOnBreak(false);
    }
  };

  const currentTask = tasks[currentTaskIndex];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const overallProgress = ((completedMinutes / totalMinutes) * 100) || 0;
  const currentTaskProgress = currentTask && !onBreak
    ? ((1 - (timeRemaining / (currentTask.estimatedMinutes * 60))) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Timer Display */}
      <div className={`border-2 rounded-lg p-6 text-center transition-all ${
        onBreak 
          ? 'bg-gradient-to-br from-accent/20 to-accent/5 border-accent' 
          : 'bg-gradient-to-br from-primary/10 to-card border-primary/30'
      }`}>
        <div className="text-sm font-semibold mb-2 flex items-center justify-center gap-2">
          {onBreak ? (
            <>
              <Coffee className="h-4 w-4" />
              <span className="text-accent">Break Time</span>
            </>
          ) : currentTask ? (
            <>
              <span className="text-primary">Current: {currentTask.title}</span>
            </>
          ) : (
            'No tasks queued'
          )}
        </div>
        <div className="text-6xl font-bold mb-4 tabular-nums">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        
        {/* Current Task Progress */}
        {currentTask && !onBreak && (
          <div className="max-w-md mx-auto mb-4">
            <Progress value={currentTaskProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(currentTaskProgress)}% of current task
            </p>
          </div>
        )}

        {/* Overall Stats */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div>Total: {formatDuration(totalMinutes)}</div>
          <div>•</div>
          <div className="text-primary font-medium">Done: {formatDuration(completedMinutes)}</div>
          <div>•</div>
          <div>Left: {formatDuration(totalMinutes - completedMinutes)}</div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="max-w-lg mx-auto mt-4">
          <Progress value={overallProgress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {tasks.filter(t => t.completed).length} of {tasks.length} tasks complete
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={() => setIsRunning(!isRunning)}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button
          onClick={handleSkip}
          variant="outline"
          size="lg"
          disabled={currentTaskIndex >= tasks.length - 1}
        >
          <SkipForward className="h-5 w-5 mr-2" />
          Skip
        </Button>
      </div>

      {/* Settings */}
      <div className="flex items-center gap-4 justify-center">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pauseBetweenTasks}
            onChange={(e) => setPauseBetweenTasks(e.target.checked)}
            className="rounded border-border"
          />
          Pause between tasks
        </label>
        {pauseBetweenTasks && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Break:</span>
            <Input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Math.max(1, parseInt(e.target.value) || 5))}
              className="w-20 bg-input border-border"
              min="1"
            />
            <span className="text-sm text-muted-foreground">min</span>
          </div>
        )}
      </div>

      {/* Task Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Task Queue</h4>
          <Button onClick={handleAddTask} size="sm" variant="outline" disabled={isRunning}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="mb-2">No tasks yet</p>
            <p className="text-sm">Add your first task to get started!</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tasks">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 transition-colors ${
                    snapshot.isDraggingOver ? 'bg-primary/5 rounded-lg p-2' : ''
                  }`}
                >
                  {tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={isRunning || task.completed}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                            index === currentTaskIndex && !onBreak
                              ? 'bg-primary/20 border-primary shadow-md scale-[1.02]'
                              : task.completed
                              ? 'bg-muted/50 border-muted opacity-60'
                              : 'bg-card border-border hover:border-primary/50'
                          } ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}`}
                        >
                          <div {...provided.dragHandleProps}>
                            <GripVertical className={`h-5 w-5 ${isRunning || task.completed ? 'text-muted-foreground/30' : 'text-muted-foreground cursor-grab active:cursor-grabbing'}`} />
                          </div>
                          
                          <div className="flex-1 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                              {index + 1}
                            </div>
                            <Input
                              value={task.title}
                              onChange={(e) => handleUpdateTask(task.id, 'title', e.target.value)}
                              className="flex-1 bg-transparent border-0 focus-visible:ring-0 font-medium"
                              disabled={task.completed || isRunning}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={task.estimatedMinutes}
                              onChange={(e) => handleUpdateTask(task.id, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                              className="w-16 text-center bg-input"
                              min="1"
                              disabled={task.completed || isRunning}
                            />
                            <span className="text-sm text-muted-foreground w-8">min</span>
                          </div>

                          <Button
                            onClick={() => handleDeleteTask(task.id)}
                            variant="ghost"
                            size="icon"
                            className="hover:bg-destructive/20 hover:text-destructive"
                            disabled={task.completed || isRunning}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          {task.completed && (
                            <div className="absolute right-2 top-2">
                              <span className="text-2xl">✅</span>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
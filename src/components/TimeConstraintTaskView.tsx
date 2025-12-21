import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Task } from '@/types';
import { Clock, Sun, Moon, Calendar, Zap, Battery, BatteryMedium } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { UnscheduledTaskItem } from './UnscheduledTaskItem';

interface TimeConstraintTaskViewProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAskAI?: (message: string) => void;
  showQuickActions?: boolean;
}

interface TaskCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tasks: Task[];
  isAvailableNow: boolean;
}

export function TimeConstraintTaskView({
  tasks,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onAskAI,
  showQuickActions = true,
}: TimeConstraintTaskViewProps) {
  const now = new Date();
  const currentHour = now.getHours();

  // Determine time-based availability
  const isBusinessHours = currentHour >= 8 && currentHour < 17; // 8am-5pm
  const isMorning = currentHour >= 5 && currentHour < 12;
  const isEvening = currentHour >= 17 && currentHour < 23;

  const categorizedTasks = useMemo(() => {
    const categories: TaskCategory[] = [];

    // Business Hours Tasks (8am-5pm only)
    const businessHoursTasks = tasks.filter(task => {
      if (task.completed) return false;
      if (task.timeConstraint === 'business-hours') return true;
      // Auto-categorize certain task types
      if (task.taskType === 'call' || task.taskType === 'appointment') return true;
      // Check custom time windows that fall within business hours
      if (task.timeConstraint === 'custom' && task.customTimeWindow) {
        const startHour = parseInt(task.customTimeWindow.startTime.split(':')[0]);
        const endHour = parseInt(task.customTimeWindow.endTime.split(':')[0]);
        return startHour >= 8 && endHour <= 17;
      }
      return false;
    });

    categories.push({
      id: 'business-hours',
      title: 'Business Hours Only',
      description: '8am - 5pm',
      icon: <Calendar className="h-4 w-4" />,
      color: isBusinessHours ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
      tasks: businessHoursTasks,
      isAvailableNow: isBusinessHours,
    });

    // Morning Tasks
    const morningTasks = tasks.filter(task => {
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
    const eveningTasks = tasks.filter(task => {
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

    // Energy-based categories
    const highEnergyTasks = tasks.filter(task =>
      !task.completed &&
      task.energyLevel === 'high' &&
      !task.timeConstraint
    );

    if (highEnergyTasks.length > 0) {
      categories.push({
        id: 'high-energy',
        title: 'High Energy Required',
        description: 'Best when you\'re fresh',
        icon: <Zap className="h-4 w-4" />,
        color: 'text-yellow-600 dark:text-yellow-400',
        tasks: highEnergyTasks,
        isAvailableNow: true,
      });
    }

    const lowEnergyTasks = tasks.filter(task =>
      !task.completed &&
      task.energyLevel === 'low' &&
      !task.timeConstraint
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

    // Anytime Tasks (no time constraint)
    const anytimeTasks = tasks.filter(task => {
      if (task.completed) return false;
      // Exclude tasks already categorized
      const alreadyCategorized = categories.some(cat =>
        cat.tasks.some(t => t.id === task.id)
      );
      return !alreadyCategorized;
    });

    categories.push({
      id: 'anytime',
      title: 'Anytime Tasks',
      description: 'No time constraints',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-primary',
      tasks: anytimeTasks,
      isAvailableNow: true,
    });

    return categories;
  }, [tasks, isBusinessHours, isMorning, isEvening]);

  const availableNowCategories = categorizedTasks.filter(cat => cat.isAvailableNow && cat.tasks.length > 0);
  const unavailableCategories = categorizedTasks.filter(cat => !cat.isAvailableNow && cat.tasks.length > 0);

  return (
    <Card className="card-elevated h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          What Can I Do Now?
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tasks organized by when you can do them • {format(now, 'h:mm a')}
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {/* Available Now Section */}
            {availableNowCategories.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600">
                    Available Now
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {availableNowCategories.reduce((sum, cat) => sum + cat.tasks.length, 0)} tasks
                  </span>
                </div>

                {availableNowCategories.map(category => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("flex items-center gap-1", category.color)}>
                        {category.icon}
                        <h3 className="font-semibold text-sm">{category.title}</h3>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({category.tasks.length})
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {category.description}
                      </Badge>
                    </div>

                    <div className="space-y-2 pl-6 border-l-2 border-muted">
                      {category.tasks.map(task => (
                        <UnscheduledTaskItem
                          key={task.id}
                          task={task}
                          onToggleComplete={onToggleComplete}
                          onUpdateTask={onUpdateTask}
                          onDeleteTask={onDeleteTask}
                          onAskAI={onAskAI}
                          showQuickActions={showQuickActions}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Not Available Now Section */}
            {unavailableCategories.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Not Available Right Now
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {unavailableCategories.reduce((sum, cat) => sum + cat.tasks.length, 0)} tasks
                  </span>
                </div>

                {unavailableCategories.map(category => (
                  <div key={category.id} className="space-y-2 opacity-60">
                    <div className="flex items-center gap-2">
                      <div className={cn("flex items-center gap-1", category.color)}>
                        {category.icon}
                        <h3 className="font-semibold text-sm">{category.title}</h3>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({category.tasks.length})
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {category.description}
                      </Badge>
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

            {categorizedTasks.every(cat => cat.tasks.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks to show. Add some tasks to get started!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

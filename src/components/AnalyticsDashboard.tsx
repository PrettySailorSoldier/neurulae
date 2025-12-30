import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Flame,
  Award,
  BarChart3,
} from 'lucide-react';
import { Task, Playbook } from '@/types';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, differenceInDays, startOfWeek, endOfWeek } from 'date-fns';

interface AnalyticsDashboardProps {
  tasks: Task[];
  playbooks: Playbook[];
}

interface DailyStats {
  date: string;
  completed: number;
  added: number;
}

export function AnalyticsDashboard({ tasks, playbooks }: AnalyticsDashboardProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    // Total tasks
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Tasks completed today
    const completedToday = tasks.filter((t) => {
      if (!t.completed) return false;
      // Check if task was completed today (approximation based on existence)
      const createdDate = new Date(t.createdAt);
      return isWithinInterval(createdDate, { start: today, end: now });
    }).length;

    // Tasks completed this week
    const completedThisWeek = tasks.filter((t) => {
      if (!t.completed) return false;
      const createdDate = new Date(t.createdAt);
      return isWithinInterval(createdDate, { start: weekStart, end: weekEnd });
    }).length;

    // Overdue tasks
    const overdueTasks = tasks.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      return new Date(t.dueDate) < now;
    }).length;

    // Tasks due today
    const dueToday = tasks.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return isWithinInterval(dueDate, { start: today, end: endOfDay(now) });
    }).length;

    // Average task time
    const tasksWithTime = tasks.filter((t) => t.estimatedMinutes);
    const avgTaskTime =
      tasksWithTime.length > 0
        ? Math.round(
            tasksWithTime.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0) /
              tasksWithTime.length
          )
        : 0;

    // Total focus time (estimated)
    const totalFocusTime = tasks
      .filter((t) => t.completed && t.estimatedMinutes)
      .reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

    // Tasks by category
    const tasksByCategory = tasks.reduce((acc, t) => {
      const category = t.taskType || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Daily completion trend (last 7 days)
    const dailyStats: DailyStats[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const completed = tasks.filter((t) => {
        if (!t.completed) return false;
        const createdDate = new Date(t.createdAt);
        return isWithinInterval(createdDate, { start: dayStart, end: dayEnd });
      }).length;

      const added = tasks.filter((t) => {
        const createdDate = new Date(t.createdAt);
        return isWithinInterval(createdDate, { start: dayStart, end: dayEnd });
      }).length;

      dailyStats.push({
        date: format(date, 'EEE'),
        completed,
        added,
      });
    }

    // Playbook streaks
    const activeStreaks = playbooks.filter((p) => (p as any).currentStreak > 0).length;
    const maxStreak = Math.max(
      0,
      ...playbooks.map((p) => (p as any).currentStreak || 0)
    );

    // Productivity score (0-100)
    const productivityScore = Math.min(
      100,
      Math.round(
        (completionRate * 0.4) +
          (completedToday * 10) +
          (activeStreaks * 5) +
          (overdueTasks === 0 ? 20 : 0)
      )
    );

    return {
      totalTasks,
      completedTasks,
      completionRate,
      completedToday,
      completedThisWeek,
      overdueTasks,
      dueToday,
      avgTaskTime,
      totalFocusTime,
      tasksByCategory,
      dailyStats,
      activeStreaks,
      maxStreak,
      productivityScore,
    };
  }, [tasks, playbooks]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const categoryColors: Record<string, string> = {
    school: 'bg-blue-500',
    work: 'bg-purple-500',
    home: 'bg-green-500',
    appointment: 'bg-orange-500',
    call: 'bg-pink-500',
    other: 'bg-gray-500',
  };

  const categoryLabels: Record<string, string> = {
    school: 'School',
    work: 'Work',
    home: 'Home',
    appointment: 'Appointments',
    call: 'Calls',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Productivity Score */}
        <Card className="col-span-2 md:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Productivity Score</p>
                <p className="text-3xl font-bold text-primary">{stats.productivityScore}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Today */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-3xl font-bold">{stats.completedToday}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Focus Time */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Focus Time</p>
                <p className="text-3xl font-bold">{formatDuration(stats.totalFocusTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Active Streaks */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Streaks</p>
                <p className="text-3xl font-bold">{stats.activeStreaks}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {stats.completedTasks} of {stats.totalTasks} tasks completed
              </span>
              <span className="font-medium">{Math.round(stats.completionRate)}%</span>
            </div>
            <Progress value={stats.completionRate} className="h-3" />

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-500">{stats.completedThisWeek}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-red-500">{stats.overdueTasks}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-32 gap-1">
              {stats.dailyStats.map((day, i) => {
                const maxCompleted = Math.max(...stats.dailyStats.map((d) => d.completed), 1);
                const height = (day.completed / maxCompleted) * 100;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center justify-end h-24">
                      <div
                        className="w-full max-w-[24px] bg-primary rounded-t transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{day.date}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary rounded" />
                Completed
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tasks by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tasks by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.tasksByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => {
                  const percentage = stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{categoryLabels[category] || category}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${categoryColors[category] || 'bg-gray-500'} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(stats.tasksByCategory).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks yet. Start adding tasks to see your breakdown.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Average Task Duration</span>
                </div>
                <span className="font-medium">
                  {stats.avgTaskTime > 0 ? `${stats.avgTaskTime}m` : '--'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Due Today</span>
                </div>
                <span className="font-medium">{stats.dueToday} tasks</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Flame className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Longest Streak</span>
                </div>
                <span className="font-medium">{stats.maxStreak} days</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Pending Tasks</span>
                </div>
                <span className="font-medium">
                  {stats.totalTasks - stats.completedTasks}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

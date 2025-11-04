import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Task {
  id: string;
  name: string;
  estimated_minutes: number;
}

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface PlannedTask {
  date: string;
  dayName: string;
  taskName: string;
  duration: number;
  part?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MyPlan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [plan, setPlan] = useState<PlannedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load pending tasks (you'll need to adjust the table name and columns)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name, estimated_minutes')
        .eq('status', 'pending')
        .not('estimated_minutes', 'is', null);

      if (tasksError) throw tasksError;

      // Load availability slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('availability')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (slotsError) throw slotsError;

      setTasks(tasksData || []);
      setSlots(slotsData || []);

      // Generate plan
      if (tasksData && slotsData) {
        generatePlan(tasksData, slotsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = (tasks: Task[], slots: AvailabilitySlot[]) => {
    const plannedTasks: PlannedTask[] = [];
    let currentTaskIndex = 0;
    let currentSlotIndex = 0;
    const today = new Date();

    // Sort tasks by estimated time
    const sortedTasks = [...tasks].sort((a, b) => b.estimated_minutes - a.estimated_minutes);

    while (currentTaskIndex < sortedTasks.length && currentSlotIndex < slots.length) {
      const task = sortedTasks[currentTaskIndex];
      const slot = slots[currentSlotIndex];

      // Calculate slot duration in minutes
      const [startHour, startMin] = slot.start_time.split(':').map(Number);
      const [endHour, endMin] = slot.end_time.split(':').map(Number);
      const slotDuration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      // Calculate date for this slot (find next occurrence of day_of_week)
      const daysUntilSlot = (slot.day_of_week - today.getDay() + 7) % 7 || 7;
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + daysUntilSlot);
      const dateString = slotDate.toISOString().split('T')[0];

      if (task.estimated_minutes <= slotDuration) {
        // Task fits in this slot
        plannedTasks.push({
          date: dateString,
          dayName: DAYS[slot.day_of_week],
          taskName: task.name,
          duration: task.estimated_minutes,
        });
        currentTaskIndex++;
      } else {
        // Task needs to be split
        const parts = Math.ceil(task.estimated_minutes / slotDuration);
        const partDuration = Math.ceil(task.estimated_minutes / parts);
        
        plannedTasks.push({
          date: dateString,
          dayName: DAYS[slot.day_of_week],
          taskName: task.name,
          duration: Math.min(partDuration, slotDuration),
          part: `Part 1 of ${parts}`,
        });

        // Mark for next slots
        task.estimated_minutes -= slotDuration;
        if (task.estimated_minutes <= 0) {
          currentTaskIndex++;
        }
      }

      currentSlotIndex++;
    }

    setPlan(plannedTasks);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const groupedPlan = plan.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, PlannedTask[]>);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/app">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">My Study Plan</h1>
            <p className="text-muted-foreground">Your AI-generated study schedule</p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading your plan...</p>
            </CardContent>
          </Card>
        ) : tasks.length === 0 || slots.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {tasks.length === 0
                ? 'No tasks with estimated minutes found. Add tasks with time estimates first.'
                : 'No availability slots found. Set up your availability first.'}
            </AlertDescription>
          </Alert>
        ) : plan.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to generate a plan. Make sure you have both tasks and availability slots.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedPlan).map(([date, tasks]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {tasks[0].dayName} - {new Date(date).toLocaleDateString()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{task.taskName}</div>
                        {task.part && (
                          <div className="text-sm text-muted-foreground">{task.part}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDuration(task.duration)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Link to="/my-availability" className="flex-1">
            <Button variant="outline" className="w-full">
              Manage Availability
            </Button>
          </Link>
          <Button onClick={loadData} variant="outline">
            Refresh Plan
          </Button>
        </div>
      </div>
    </div>
  );
}

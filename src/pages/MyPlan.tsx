import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Calendar, Clock, AlertCircle, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';

interface ScheduleEntry {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  category: string;
  source: string;
}

export default function MyPlan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load all schedule entries (including AI-generated homework)
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule_entries')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .lte('start_time', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
        .order('start_time', { ascending: true });

      if (scheduleError) throw scheduleError;

      setSchedule(scheduleData || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('generate-smart-plan', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Planning Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Study Plan Generated! ✨',
        description: data?.message || 'Your AI study plan is ready',
      });

      // Reload schedule
      await loadData();
    } catch (error: any) {
      console.error('Error generating plan:', error);
      const status = error?.status || error?.cause?.status;
      let description = 'Failed to generate plan';
      if (status === 429) description = 'Rate limit exceeded. Please wait.';
      else if (status === 402) description = 'AI credits exhausted. Please add credits.';
      else if (error?.message) description = error.message;
      
      toast({ 
        title: 'Generation Failed', 
        description, 
        variant: 'destructive' 
      });
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'class': return 'bg-purple-500/10 text-purple-700 border-purple-300';
      case 'homework': return 'bg-green-500/10 text-green-700 border-green-300';
      case 'meeting': return 'bg-yellow-500/10 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work': return '💼';
      case 'class': return '📚';
      case 'homework': return '✏️';
      case 'meeting': return '🤝';
      default: return '📅';
    }
  };

  const groupedSchedule = schedule.reduce((acc, entry) => {
    const date = entry.start_time.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, ScheduleEntry[]>);

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

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Study Scheduling</h3>
                <p className="text-sm text-muted-foreground">
                  Click to generate an optimized study plan based on your tasks and free time
                </p>
              </div>
              <Button onClick={handleGeneratePlan} disabled={generating} size="lg">
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Plan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-center text-muted-foreground mt-4">Loading your schedule...</p>
            </CardContent>
          </Card>
        ) : schedule.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No schedule entries found. Upload your work/class schedule or add tasks first.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSchedule).map(([date, entries]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-3 border rounded-lg ${getCategoryColor(entry.category)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{getCategoryIcon(entry.category)}</span>
                            <span className="font-medium">{entry.title}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-background/50">
                              {entry.category}
                            </span>
                          </div>
                          {entry.description && (
                            <p className="text-sm opacity-80 mt-1">{entry.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm mt-2 opacity-80">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(entry.start_time), 'h:mm a')} - {format(parseISO(entry.end_time), 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Link to="/app" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

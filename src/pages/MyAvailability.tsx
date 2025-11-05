import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Clock, Plus, ArrowLeft } from 'lucide-react';

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MyAvailability() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedDay, setSelectedDay] = useState('1');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');

  useEffect(() => {
    if (user) {
      loadSlots();
    }
  }, [user]);

  const loadSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your availability',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlot = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('availability').insert({
        user_id: user.id,
        day_of_week: parseInt(selectedDay),
        start_time: startTime,
        end_time: endTime,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Availability slot added',
      });

      // Reset form
      setSelectedDay('1');
      setStartTime('18:00');
      setEndTime('21:00');

      // Reload slots
      loadSlots();
    } catch (error) {
      console.error('Error saving slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to save availability slot',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      const { error } = await supabase.from('availability').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Availability slot deleted',
      });

      loadSlots();
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete slot',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-tutorial="my-availability">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/app">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">My Availability</h1>
            <p className="text-muted-foreground">Set your weekly study schedule</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Time Slot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleSaveSlot} disabled={saving} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Slot'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : slots.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No availability slots yet. Add one above!
              </p>
            ) : (
              <div className="space-y-2">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-medium min-w-[100px]">
                        {DAYS[slot.day_of_week]}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {slot.start_time} - {slot.end_time}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSlot(slot.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

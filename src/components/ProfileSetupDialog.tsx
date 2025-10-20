import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

interface ProfileSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSetupDialog({ open, onOpenChange }: ProfileSetupDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [aiStyle, setAiStyle] = useState<'direct' | 'balanced' | 'conversational'>('direct');
  const [livingSituation, setLivingSituation] = useState<'alone' | 'with_others'>('alone');
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');

  const toggleWorkDay = (day: string) => {
    setWorkDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Build work schedule
      const workSchedule = workDays.map(day => ({
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day),
        startTime: workStartTime,
        endTime: workEndTime,
      }));

      // Save profile
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ai_coaching_style: aiStyle,
          living_situation: livingSituation,
          work_schedule: workSchedule,
          default_wake_time: wakeTime,
          default_sleep_time: sleepTime,
        });

      if (error) throw error;

      // Create recurring time blocks for work schedule
      if (workDays.length > 0) {
        const recurringBlocks = workSchedule.map(schedule => ({
          user_id: user.id,
          title: 'Work',
          day_of_week: schedule.dayOfWeek,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          category: 'work',
        }));

        await supabase.from('recurring_time_blocks').insert(recurringBlocks);
      }

      toast({
        title: 'Profile Complete!',
        description: 'Your AI assistant is now personalized to your needs.',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quick Setup - {step} of 3
          </DialogTitle>
          <DialogDescription>
            Help your AI assistant understand you better (takes 60 seconds)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  How would you like your AI to work with you?
                </Label>
                <RadioGroup value={aiStyle} onValueChange={(v) => setAiStyle(v as typeof aiStyle)}>
                  <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent" onClick={() => setAiStyle('direct')}>
                    <RadioGroupItem value="direct" id="direct" />
                    <div className="flex-1">
                      <Label htmlFor="direct" className="font-semibold cursor-pointer">Direct & Decisive</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Take action immediately. Don't ask permission, just create time blocks and plans.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent" onClick={() => setAiStyle('balanced')}>
                    <RadioGroupItem value="balanced" id="balanced" />
                    <div className="flex-1">
                      <Label htmlFor="balanced" className="font-semibold cursor-pointer">Balanced</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Take action but explain reasoning. A mix of guidance and execution.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent" onClick={() => setAiStyle('conversational')}>
                    <RadioGroupItem value="conversational" id="conversational" />
                    <div className="flex-1">
                      <Label htmlFor="conversational" className="font-semibold cursor-pointer">Conversational</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Explore options together. Ask questions and discuss before acting.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Living situation</Label>
                <RadioGroup value={livingSituation} onValueChange={(v) => setLivingSituation(v as typeof livingSituation)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="alone" id="alone" />
                    <Label htmlFor="alone" className="cursor-pointer">I live alone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="with_others" id="with_others" />
                    <Label htmlFor="with_others" className="cursor-pointer">I live with others</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">When do you work?</Label>
                <p className="text-sm text-muted-foreground mb-3">Select your work days</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <Button
                      key={day}
                      variant={workDays.includes(day) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleWorkDay(day)}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>

                {workDays.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Work starts at</Label>
                      <Input
                        type="time"
                        value={workStartTime}
                        onChange={(e) => setWorkStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Work ends at</Label>
                      <Input
                        type="time"
                        value={workEndTime}
                        onChange={(e) => setWorkEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Your daily rhythm</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>I usually wake up at</Label>
                    <Input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>I usually sleep at</Label>
                    <Input
                      type="time"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/contexts/PremiumContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Crown, Settings as SettingsIcon, LogOut, CreditCard, User, Clock, Briefcase, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

export default function Settings() {
  const navigate = useNavigate();
  const { plan, isPremium, isAdmin, loading } = usePremium();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiStyle, setAiStyle] = useState<'direct' | 'balanced' | 'conversational'>('balanced');
  const [livingSituation, setLivingSituation] = useState<'alone' | 'with_others'>('alone');
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setAiStyle(data.ai_coaching_style as typeof aiStyle);
        setLivingSituation(data.living_situation as typeof livingSituation);
        setWakeTime(data.default_wake_time || '07:00');
        setSleepTime(data.default_sleep_time || '23:00');
        
        if (data.work_schedule && Array.isArray(data.work_schedule) && data.work_schedule.length > 0) {
          const schedule = data.work_schedule as Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
          const days = schedule.map(s => 
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][s.dayOfWeek]
          );
          setWorkDays(days);
          setWorkStartTime(schedule[0].startTime || '09:00');
          setWorkEndTime(schedule[0].endTime || '17:00');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const workSchedule = workDays.map(day => ({
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day),
        startTime: workStartTime,
        endTime: workEndTime,
      }));

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

      // Update recurring blocks
      await supabase
        .from('recurring_time_blocks')
        .delete()
        .eq('user_id', user.id)
        .eq('category', 'work');

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
        title: 'Profile Updated',
        description: 'Your preferences have been saved.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile.',
        variant: 'destructive',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const toggleWorkDay = (day: string) => {
    setWorkDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getPlanDisplay = () => {
    if (loading) return "Loading...";
    if (isAdmin) return "Admin";
    if (plan === 'lifetime') return "Lifetime";
    if (plan === 'premium') return "Premium";
    return "Free";
  };

  const getPlanBadgeVariant = () => {
    if (isAdmin) return "default";
    if (isPremium) return "default";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Account Settings</h1>
        </div>

        {/* Account Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and current plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="text-lg">{user?.email}</p>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">Current Plan</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getPlanBadgeVariant()} className="text-lg py-1">
                  {isPremium && <Crown className="h-4 w-4 mr-1" />}
                  {getPlanDisplay()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile & Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile & Preferences
            </CardTitle>
            <CardDescription>Customize how your AI assistant works for you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Coaching Style
              </Label>
              <RadioGroup value={aiStyle} onValueChange={(v) => setAiStyle(v as typeof aiStyle)}>
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="direct" id="direct-setting" />
                  <div className="flex-1">
                    <Label htmlFor="direct-setting" className="font-semibold cursor-pointer">Direct & Decisive</Label>
                    <p className="text-sm text-muted-foreground">Takes action immediately without asking permission</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="balanced" id="balanced-setting" />
                  <div className="flex-1">
                    <Label htmlFor="balanced-setting" className="font-semibold cursor-pointer">Balanced</Label>
                    <p className="text-sm text-muted-foreground">Takes action but explains reasoning</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="conversational" id="conversational-setting" />
                  <div className="flex-1">
                    <Label htmlFor="conversational-setting" className="font-semibold cursor-pointer">Conversational</Label>
                    <p className="text-sm text-muted-foreground">Asks questions and explores options together</p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">Living Situation</Label>
              <RadioGroup value={livingSituation} onValueChange={(v) => setLivingSituation(v as typeof livingSituation)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alone" id="alone-setting" />
                  <Label htmlFor="alone-setting" className="cursor-pointer">I live alone</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="with_others" id="with_others-setting" />
                  <Label htmlFor="with_others-setting" className="cursor-pointer">I live with others</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Work Schedule
              </Label>
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

            <div>
              <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Daily Rhythm
              </Label>
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

            <Button onClick={handleSaveProfile} disabled={profileLoading} className="w-full">
              {profileLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        {!isAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isPremium ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    You're currently on the free plan. Upgrade to unlock premium features.
                  </p>
                  <Button onClick={() => navigate('/pricing')} className="w-full">
                    <Crown className="h-4 w-4 mr-2" />
                    View Premium Plans
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Manage your subscription, update payment method, or view billing history.
                  </p>
                  <Button 
                    onClick={handleManageSubscription} 
                    variant="outline" 
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/app')}
            >
              Back to App
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

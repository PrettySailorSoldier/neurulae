import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import { usePremium } from "@/contexts/PremiumContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Crown, Settings as SettingsIcon, LogOut, CreditCard, User, Clock, Briefcase, Brain, MessageSquarePlus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { PromoCodeInput } from "@/components/PromoCodeInput";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Settings() {
  const navigate = useNavigate();
  const { plan, isPremium, isAdmin, loading, checkSubscription } = usePremium();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [profileLoading, setProfileLoading] = useState(false);
  const [aiStyle, setAiStyle] = useState<'direct' | 'balanced' | 'conversational'>('balanced');
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');

  // AI Preferences
  const [showAI, setShowAI] = useLocalStorage('neurulae-ai-enabled', true);
  const [aiFirstMode, setAiFirstMode] = useLocalStorage('neurulae-ai-first-mode', false);
  const [showQuickActions, setShowQuickActions] = useLocalStorage('neurulae-ai-quick-actions', true);

  // Collapsible sections
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

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
          work_schedule: workSchedule,
          default_wake_time: wakeTime,
          default_sleep_time: sleepTime,
        });

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
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

  const handleClaimAdmin = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('claim-admin');
      if (error) throw error;
      toast({
        title: "🎉 Admin Access Granted",
        description: data.message || "You are now an admin!",
      });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to claim admin access",
        variant: "destructive",
      });
    }
  };

  const getPlanDisplay = () => {
    if (loading) return "Loading...";
    if (isAdmin) return "Admin";
    if (plan === 'lifetime') return "Lifetime";
    if (plan === 'premium') return "Premium";
    return "Free";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-7 w-7" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app')}
            title="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1: ACCOUNT & SUBSCRIPTION
        ═══════════════════════════════════════════════════════════════════ */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email & Plan */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <Badge variant={isPremium || isAdmin ? "default" : "secondary"} className="h-7">
                {isPremium && <Crown className="h-3 w-3 mr-1" />}
                {getPlanDisplay()}
              </Badge>
            </div>

            <Separator />

            {/* Subscription Actions */}
            {!isAdmin && (
              <div className="space-y-2">
                {!isPremium ? (
                  <Button onClick={() => navigate('/pricing')} className="w-full" size="sm">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                ) : (
                  <Button onClick={handleManageSubscription} variant="outline" className="w-full" size="sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                )}
                <PromoCodeInput />
              </div>
            )}

            {/* Admin Controls */}
            {isAdmin && (
              <Button variant="secondary" size="sm" asChild className="w-full">
                <Link to="/admin">Open Admin Panel</Link>
              </Button>
            )}
            {user?.email === 'astro.naught3@gmail.com' && !isAdmin && (
              <Button variant="outline" size="sm" onClick={handleClaimAdmin} className="w-full">
                Claim Admin Access
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2: AI PREFERENCES (Consolidated)
        ═══════════════════════════════════════════════════════════════════ */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5" />
              AI Assistant
            </CardTitle>
            <CardDescription>Customize your AI coaching experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Visibility Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-ai" className="cursor-pointer">Show AI Bar</Label>
                <Switch id="show-ai" checked={showAI} onCheckedChange={setShowAI} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-first-mode" className="cursor-pointer">AI-First Mode</Label>
                <Switch id="ai-first-mode" checked={aiFirstMode} onCheckedChange={setAiFirstMode} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="quick-actions" className="cursor-pointer">Quick Actions</Label>
                <Switch id="quick-actions" checked={showQuickActions} onCheckedChange={setShowQuickActions} />
              </div>
            </div>

            <Separator />

            {/* AI Coaching Style */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Coaching Style</Label>
              <RadioGroup value={aiStyle} onValueChange={(v) => setAiStyle(v as typeof aiStyle)} className="space-y-2">
                <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct" className="cursor-pointer flex-1">
                    <span className="font-medium">Direct</span>
                    <span className="text-muted-foreground text-xs ml-2">Takes action immediately</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="balanced" id="balanced" />
                  <Label htmlFor="balanced" className="cursor-pointer flex-1">
                    <span className="font-medium">Balanced</span>
                    <span className="text-muted-foreground text-xs ml-2">Acts with explanation</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="conversational" id="conversational" />
                  <Label htmlFor="conversational" className="cursor-pointer flex-1">
                    <span className="font-medium">Conversational</span>
                    <span className="text-muted-foreground text-xs ml-2">Explores options together</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3: SCHEDULE & RHYTHM (Collapsible)
        ═══════════════════════════════════════════════════════════════════ */}
        <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <Card className="mb-4">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    Schedule & Rhythm
                  </CardTitle>
                  {scheduleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                <CardDescription>Work schedule and daily routine</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                {/* Work Days */}
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Work Days
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                      const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i];
                      return (
                        <Button
                          key={day}
                          variant={workDays.includes(fullDay) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleWorkDay(fullDay)}
                          className="w-11"
                        >
                          {day}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {workDays.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Work Start</Label>
                      <Input type="time" value={workStartTime} onChange={(e) => setWorkStartTime(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Work End</Label>
                      <Input type="time" value={workEndTime} onChange={(e) => setWorkEndTime(e.target.value)} />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Daily Rhythm */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Wake Time</Label>
                    <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Sleep Time</Label>
                    <Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={profileLoading} className="w-full" size="sm">
                  {profileLoading ? 'Saving...' : 'Save Schedule'}
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4: SUPPORT & ACTIONS
        ═══════════════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquarePlus className="h-5 w-5" />
              Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              size="sm"
              onClick={() => setFeedbackDialogOpen(true)}
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Send Feedback
            </Button>

            <Separator className="my-3" />

            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <FeedbackDialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen} />
    </div>
  );
}

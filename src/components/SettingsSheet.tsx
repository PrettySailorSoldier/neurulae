import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings as SettingsIcon, Crown, User, Clock, Briefcase, 
  Sparkles, Brain, MessageSquarePlus, Palette, ImageIcon,
  Upload, Wand2, ChevronDown, LogOut, CreditCard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useNavigate } from 'react-router-dom';
import { ScheduleManager } from '@/components/ScheduleManager';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { FeedbackHistory } from '@/components/FeedbackHistory';
import { PromoCodeInput } from '@/components/PromoCodeInput';
import { ColorPicker } from '@/components/ColorPicker';
import { ColorHarmonyGenerator } from '@/components/ColorHarmonyGenerator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { CustomTheme } from '@/types';
import { autoOptimizeThemeColors, extractColorsFromImage } from '@/lib/colorUtils';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customTheme?: CustomTheme | null;
  onSaveCustomTheme?: (theme: CustomTheme) => void;
}

// Quick palette presets
const quickPalettes = [
  { name: 'Sunset', primary: '5 70% 65%', secondary: '25 85% 70%', accent: '10 75% 58%', background: '15 30% 88%' },
  { name: 'Ocean', primary: '180 50% 55%', secondary: '195 45% 35%', accent: '165 55% 50%', background: '195 60% 15%' },
  { name: 'Forest', primary: '140 45% 50%', secondary: '85 40% 55%', accent: '160 50% 45%', background: '150 35% 20%' },
  { name: 'Lavender', primary: '275 60% 60%', secondary: '260 45% 45%', accent: '285 55% 65%', background: '265 45% 12%' },
  { name: 'Candy', primary: '330 100% 70%', secondary: '200 70% 65%', accent: '50 100% 60%', background: '0 0% 20%' },
];

export function SettingsSheet({ open, onOpenChange, customTheme, onSaveCustomTheme }: SettingsSheetProps) {
  const { user, signOut } = useAuth();
  const { plan, isPremium, isAdmin } = usePremium();
  const { toast } = useToast();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiStyle, setAiStyle] = useState<'direct' | 'balanced' | 'conversational'>('balanced');
  const [livingSituation, setLivingSituation] = useState<'alone' | 'with_others'>('alone');
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');

  // AI Preferences
  const [showAI, setShowAI] = useLocalStorage('neurulae-ai-enabled', true);
  const [aiFirstMode, setAiFirstMode] = useLocalStorage('neurulae-ai-first-mode', false);
  const [showQuickActions, setShowQuickActions] = useLocalStorage('neurulae-ai-quick-actions', true);

  // Theme state
  const [theme, setTheme] = useState<CustomTheme>(customTheme || {
    name: 'My Custom Theme',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 3.9%',
      card: '0 0% 100%',
      cardForeground: '0 0% 3.9%',
      primary: '262.1 83.3% 57.8%',
      primaryForeground: '0 0% 98%',
      secondary: '220 14.3% 95.9%',
      secondaryForeground: '220.9 39.3% 11%',
      accent: '220 14.3% 95.9%',
      accentForeground: '220.9 39.3% 11%',
      muted: '220 14.3% 95.9%',
      mutedForeground: '220 8.9% 46.1%',
      border: '220 13% 91%',
      input: '220 13% 91%',
    },
    backgroundImage: {
      url: '',
      size: 'cover',
      position: 'center',
      repeat: 'no-repeat',
      attachment: 'scroll',
      opacity: 100,
      blur: 0,
      overlayColor: '0 0% 0%',
      overlayOpacity: 0,
      filter: {
        grayscale: 0,
        sepia: 0,
        brightness: 100,
        contrast: 100,
        saturate: 100,
      },
    },
  });
  const [showHarmonyGenerator, setShowHarmonyGenerator] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false);
  const [extractingColors, setExtractingColors] = useState(false);

  useEffect(() => {
    if (customTheme) {
      setTheme(customTheme);
    }
  }, [customTheme]);

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
    onOpenChange(false);
  };

  const handleColorChange = (colorKey: keyof CustomTheme['colors'], value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  };

  const handleApplyHarmony = (harmonyColors: Partial<CustomTheme['colors']>) => {
    setTheme((prev) => {
      const updatedColors = {
        ...prev.colors,
        ...harmonyColors,
      };
      
      const optimizedColors = autoOptimizeThemeColors(updatedColors) as CustomTheme['colors'];
      
      return {
        ...prev,
        colors: optimizedColors,
      };
    });
  };

  const handleAutoOptimize = () => {
    setTheme((prev) => {
      const optimizedColors = autoOptimizeThemeColors(prev.colors) as CustomTheme['colors'];
      return {
        ...prev,
        colors: optimizedColors,
      };
    });
    toast({
      title: 'Optimized',
      description: 'Text contrast has been improved for better readability.',
    });
  };

  const handleApplyQuickPalette = (palette: typeof quickPalettes[0]) => {
    setTheme((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
        background: palette.background,
      },
    }));
    // Auto-optimize after applying palette
    setTimeout(() => handleAutoOptimize(), 100);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractingColors(true);
    try {
      const colors = await extractColorsFromImage(file);
      
      if (colors.length >= 4) {
        setTheme((prev) => ({
          ...prev,
          colors: {
            ...prev.colors,
            primary: colors[0],
            secondary: colors[1],
            accent: colors[2],
            background: colors[3],
          },
        }));
        
        toast({
          title: 'Colors Extracted!',
          description: `Applied ${colors.length} colors from your image.`,
        });
        
        // Auto-optimize after extracting
        setTimeout(() => handleAutoOptimize(), 100);
      }
    } catch (error) {
      console.error('Error extracting colors:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract colors from image.',
        variant: 'destructive',
      });
    } finally {
      setExtractingColors(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleSaveTheme = () => {
    if (onSaveCustomTheme) {
      onSaveCustomTheme(theme);
      toast({
        title: 'Theme Saved',
        description: 'Your custom theme has been applied.',
      });
    }
  };

  const colorFields: { key: keyof CustomTheme['colors']; label: string }[] = [
    { key: 'background', label: 'Background' },
    { key: 'foreground', label: 'Foreground' },
    { key: 'primary', label: 'Primary' },
    { key: 'primaryForeground', label: 'Primary Text' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'secondaryForeground', label: 'Secondary Text' },
    { key: 'accent', label: 'Accent' },
    { key: 'accentForeground', label: 'Accent Text' },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Settings
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant={isPremium ? 'default' : 'secondary'}>
                    {isPremium && <Crown className="h-4 w-4 mr-1" />}
                    {isAdmin ? 'Admin' : plan === 'lifetime' ? 'Lifetime' : isPremium ? 'Premium' : 'Free'}
                  </Badge>
                  <div className="flex gap-2">
                    {!isAdmin && (
                      <Button size="sm" variant="outline" onClick={handleManageSubscription}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Billing
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="theme" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="theme">
                  <Palette className="w-4 h-4 mr-2" />
                  Theme
                </TabsTrigger>
                <TabsTrigger value="profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="schedule">
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule
                </TabsTrigger>
              </TabsList>

              {/* Theme Tab */}
              <TabsContent value="theme" className="space-y-4 mt-4">
                {/* Quick Palettes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Palettes</CardTitle>
                    <CardDescription>Click to instantly apply a color theme</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {quickPalettes.map((palette) => (
                      <Button
                        key={palette.name}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleApplyQuickPalette(palette)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex gap-1">
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: `hsl(${palette.primary})` }} />
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: `hsl(${palette.secondary})` }} />
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: `hsl(${palette.accent})` }} />
                          </div>
                          <span>{palette.name}</span>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {/* Extract from Image */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Generate Palette from Image</CardTitle>
                    <CardDescription>Upload a logo or photo to extract 4 dominant colors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={extractingColors}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {extractingColors ? 'Extracting Colors...' : 'Upload Image'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Color Harmony Generator */}
                <Collapsible open={showHarmonyGenerator} onOpenChange={setShowHarmonyGenerator}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Color Harmony Generator
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showHarmonyGenerator ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <ColorHarmonyGenerator
                      baseColor={theme.colors.primary}
                      onApplyHarmony={handleApplyHarmony}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Auto-Optimize Button */}
                <Button variant="outline" onClick={handleAutoOptimize} className="w-full">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Auto-Optimize Text Contrast
                </Button>

                {/* Manual Color Pickers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Manual Color Control</CardTitle>
                    <CardDescription>Fine-tune colors with HSL sliders and eye dropper</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {colorFields.map(({ key, label }) => (
                      <ColorPicker
                        key={key}
                        label={label}
                        value={theme.colors[key]}
                        onChange={(value) => handleColorChange(key, value)}
                      />
                    ))}
                  </CardContent>
                </Card>

                {/* Save Theme Button */}
                <Button onClick={handleSaveTheme} className="w-full">
                  Save Theme
                </Button>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Coaching Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={aiStyle} onValueChange={(v) => setAiStyle(v as typeof aiStyle)}>
                      <div className="flex items-start space-x-3 p-3 border rounded-lg mb-2">
                        <RadioGroupItem value="direct" id="direct" />
                        <div className="flex-1">
                          <Label htmlFor="direct" className="font-semibold cursor-pointer">Direct</Label>
                          <p className="text-sm text-muted-foreground">Takes action immediately</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded-lg mb-2">
                        <RadioGroupItem value="balanced" id="balanced" />
                        <div className="flex-1">
                          <Label htmlFor="balanced" className="font-semibold cursor-pointer">Balanced</Label>
                          <p className="text-sm text-muted-foreground">Explains reasoning</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="conversational" id="conversational" />
                        <div className="flex-1">
                          <Label htmlFor="conversational" className="font-semibold cursor-pointer">Conversational</Label>
                          <p className="text-sm text-muted-foreground">Explores options together</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Daily Rhythm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Wake up time</Label>
                      <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                    </div>
                    <div>
                      <Label>Sleep time</Label>
                      <Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Show AI Assistant</Label>
                      <Switch checked={showAI} onCheckedChange={setShowAI} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <Label>AI-First Mode</Label>
                      <Switch checked={aiFirstMode} onCheckedChange={setAiFirstMode} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <Label>Show Quick Actions</Label>
                      <Switch checked={showQuickActions} onCheckedChange={setShowQuickActions} />
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleSaveProfile} disabled={profileLoading} className="w-full">
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Work Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
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
                          <Label>Start time</Label>
                          <Input type="time" value={workStartTime} onChange={(e) => setWorkStartTime(e.target.value)} />
                        </div>
                        <div>
                          <Label>End time</Label>
                          <Input type="time" value={workEndTime} onChange={(e) => setWorkEndTime(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <ScheduleManager />

                <Button onClick={handleSaveProfile} disabled={profileLoading} className="w-full">
                  {profileLoading ? 'Saving...' : 'Save Schedule'}
                </Button>
              </TabsContent>
            </Tabs>

            {/* Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4" />
                  Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" onClick={() => setFeedbackDialogOpen(true)}>
                  Submit Feedback
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowFeedbackHistory(!showFeedbackHistory)}
                >
                  {showFeedbackHistory ? 'Hide' : 'View'} History
                </Button>
                {showFeedbackHistory && (
                  <div className="mt-4">
                    <FeedbackHistory />
                  </div>
                )}
              </CardContent>
            </Card>

            {!isAdmin && !isPremium && <PromoCodeInput />}
          </div>
        </SheetContent>
      </Sheet>

      <FeedbackDialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen} />
    </>
  );
}

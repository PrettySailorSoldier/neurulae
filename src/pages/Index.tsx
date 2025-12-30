import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { TaskSection } from '@/components/dashboard/TaskSection';
import { ScheduleSection } from '@/components/dashboard/ScheduleSection';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { syncService } from '@/services/syncService';
import { Task, Project, Theme, TimeBlock, ScheduledTask, Playbook, ReminderWidget, EnergyTaskWidget, FutureSelfMessengerWidget, FutureSelfMessage, MoodGardenWidget, ParallelUniverseWidget, SoundSignatureWidget, BrainDumpWidget, PotionInventoryWidget, SunlightAnchorWidget, Plant, CustomTheme, DashboardTab } from '@/types';
import { Plus, X, Settings2, ChevronUp, ChevronDown, Pencil, Flame, Trash2, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { getTodayString, getDateString } from '@/lib/timeUtils';
import { autoOptimizeThemeColors } from '@/lib/colorUtils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { useFeatureLimit } from '@/hooks/useFeatureLimit';
import { supabase } from '@/integrations/supabase/client';
import { MobileTabBar, MobileTab } from '@/components/MobileTabBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useActiveIntention } from '@/hooks/useActiveIntention';
import { ActiveIntentionBanner } from '@/components/ActiveIntentionBanner';

// Lazy load heavy components for better code splitting
const ProjectsTab = lazy(() => import('@/components/ProjectsTab').then(m => ({ default: m.ProjectsTab })));
const PlaybooksTab = lazy(() => import('@/components/PlaybooksTab').then(m => ({ default: m.PlaybooksTab })));
const WidgetPanel = lazy(() => import('@/components/WidgetPanel').then(m => ({ default: m.WidgetPanel })));
const CalendarScheduler = lazy(() => import('@/components/CalendarScheduler').then(m => ({ default: m.CalendarScheduler })));
const ChatPanel = lazy(() => import('@/components/ChatPanel').then(m => ({ default: m.ChatPanel })));
const EisenhowerMatrix = lazy(() => import('@/components/EisenhowerMatrix'));
const AIAssistant = lazy(() => import('@/components/AIAssistant').then(m => ({ default: m.AIAssistant })));
const ReminderWidgetEditor = lazy(() => import('@/components/ReminderWidgetEditor').then(m => ({ default: m.ReminderWidgetEditor })));
const EnergyTaskWidgetEditor = lazy(() => import('@/components/EnergyTaskWidgetEditor').then(m => ({ default: m.EnergyTaskWidgetEditor })));
const FutureSelfMessengerEditor = lazy(() => import('@/components/FutureSelfMessengerEditor').then(m => ({ default: m.FutureSelfMessengerEditor })));
const MoodGardenWidgetEditor = lazy(() => import('@/components/MoodGardenWidgetEditor').then(m => ({ default: m.MoodGardenWidgetEditor })));
const ParallelUniverseWidgetEditor = lazy(() => import('@/components/ParallelUniverseWidgetEditor').then(m => ({ default: m.ParallelUniverseWidgetEditor })));
const SoundSignatureWidgetEditor = lazy(() => import('@/components/SoundSignatureWidgetEditor').then(m => ({ default: m.SoundSignatureWidgetEditor })));
const CustomThemeBuilder = lazy(() => import('@/components/CustomThemeBuilder').then(m => ({ default: m.CustomThemeBuilder })));
const OnboardingTutorial = lazy(() => import('@/components/OnboardingTutorial').then(m => ({ default: m.OnboardingTutorial })));
const ProfileSetupDialog = lazy(() => import('@/components/ProfileSetupDialog').then(m => ({ default: m.ProfileSetupDialog })));
const KeyboardShortcutsDialog = lazy(() => import('@/components/KeyboardShortcutsDialog').then(m => ({ default: m.KeyboardShortcutsDialog })));
const FocusTimer = lazy(() => import('@/components/FocusTimer').then(m => ({ default: m.FocusTimer })));
const TimeConstraintTaskView = lazy(() => import('@/components/TimeConstraintTaskView').then(m => ({ default: m.TimeConstraintTaskView })));
const RoutineTemplate = lazy(() => import('@/components/RoutineTemplate').then(m => ({ default: m.RoutineTemplate })));
const CommandPalette = lazy(() => import('@/components/CommandPalette').then(m => ({ default: m.CommandPalette })));
const FocusMode = lazy(() => import('@/components/FocusMode').then(m => ({ default: m.FocusMode })));
const AnalyticsDashboard = lazy(() => import('@/components/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const DailyReviewPrompt = lazy(() => import('@/components/DailyReviewPrompt').then(m => ({ default: m.DailyReviewPrompt })));
const DailyPlanningDialog = lazy(() => import('@/components/DailyPlanningDialog').then(m => ({ default: m.DailyPlanningDialog })));

// Loading fallback component
const ComponentLoader = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
  </div>
);

const Index = () => {
  const { user } = useAuth();
  const { plan, isPremium, isAdmin } = usePremium();
  const [showSyncBanner, setShowSyncBanner] = useState(true);
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>('timeline');
  const [theme, setTheme] = useLocalStorage<Theme>('neurulae-theme', 'orchid');
  const { preferences, savePreferences, loading: prefsLoading } = useUserPreferences();
  const [tasks, setTasks] = useSyncedStorage<Task[]>('neurulae-tasks', []);
  const [priorities, setPriorities] = useSyncedStorage<Task[]>('neurulae-priorities', []);
  const [projects, setProjects] = useSyncedStorage<Project[]>('neurulae-projects', []);
  const [timeBlocks, setTimeBlocks] = useSyncedStorage<TimeBlock[]>('neurulae-timeblocks', []);
  const [scheduledTasks, setScheduledTasks] = useSyncedStorage<ScheduledTask[]>('neurulae-scheduled-tasks', []);
  const [playbooks, setPlaybooks] = useSyncedStorage<Playbook[]>('neurulae-playbooks', []);
  const [reminderWidgets, setReminderWidgets] = useLocalStorage<ReminderWidget[]>('neurulae-widgets', []);
  const [editingWidget, setEditingWidget] = useState<ReminderWidget | undefined>();
  const [widgetEditorOpen, setWidgetEditorOpen] = useState(false);

  const [energyWidgets, setEnergyWidgets] = useLocalStorage<EnergyTaskWidget[]>('neurulae-energy-widgets', []);
  const [editingEnergyWidget, setEditingEnergyWidget] = useState<EnergyTaskWidget | undefined>();
  const [energyWidgetEditorOpen, setEnergyWidgetEditorOpen] = useState(false);

  const [messengerWidgets, setMessengerWidgets] = useLocalStorage<FutureSelfMessengerWidget[]>('neurulae-messenger-widgets', []);
  const [editingMessengerWidget, setEditingMessengerWidget] = useState<FutureSelfMessengerWidget | undefined>();
  const [messengerWidgetEditorOpen, setMessengerWidgetEditorOpen] = useState(false);
  const [messengerEditorMode, setMessengerEditorMode] = useState<'settings' | 'message'>('settings');

  const [moodGardenWidgets, setMoodGardenWidgets] = useLocalStorage<MoodGardenWidget[]>('neurulae-mood-garden-widgets', []);
  const [editingMoodGardenWidget, setEditingMoodGardenWidget] = useState<MoodGardenWidget | undefined>();
  const [moodGardenWidgetEditorOpen, setMoodGardenWidgetEditorOpen] = useState(false);

  const [parallelUniverseWidgets, setParallelUniverseWidgets] = useLocalStorage<ParallelUniverseWidget[]>('neurulae-parallel-universe-widgets', []);
  const [editingParallelUniverseWidget, setEditingParallelUniverseWidget] = useState<ParallelUniverseWidget | undefined>();
  const [parallelUniverseWidgetEditorOpen, setParallelUniverseWidgetEditorOpen] = useState(false);

  const [soundSignatureWidgets, setSoundSignatureWidgets] = useLocalStorage<SoundSignatureWidget[]>('neurulae-sound-signature-widgets', []);
  const [editingSoundSignatureWidget, setEditingSoundSignatureWidget] = useState<SoundSignatureWidget | undefined>();
  const [soundSignatureWidgetEditorOpen, setSoundSignatureWidgetEditorOpen] = useState(false);

  const [brainDumpWidgets, setBrainDumpWidgets] = useLocalStorage<BrainDumpWidget[]>('neurulae-brain-dump-widgets', []);
  const [potionInventoryWidgets, setPotionInventoryWidgets] = useLocalStorage<PotionInventoryWidget[]>('neurulae-potion-inventory-widgets', []);
  const [sunlightAnchorWidgets, setSunlightAnchorWidgets] = useLocalStorage<SunlightAnchorWidget[]>('neurulae-sunlight-anchor-widgets', []);

  // Custom theme - now syncs via user_data table (customTheme added to database enum)
  const [customTheme, setCustomTheme] = useSyncedStorage<CustomTheme | null>('neurulae-customTheme', null);
  const [customThemeBuilderOpen, setCustomThemeBuilderOpen] = useState(false);
  const [templateTheme, setTemplateTheme] = useState<'orchid' | 'jellyfish' | 'sunset' | 'bluebonnet' | 'ocean' | 'forest' | 'midnight' | 'candy' | undefined>(undefined);
  const [themeToEdit, setThemeToEdit] = useState<CustomTheme | undefined>(undefined);
  const [editingThemeId, setEditingThemeId] = useState<string | undefined>(undefined); // Track the ID of the theme being edited
  const [isCreatingNewTheme, setIsCreatingNewTheme] = useState(false); // Track if explicitly creating new

  // Dashboard Tabs - includes both built-in and custom tabs
  const DEFAULT_DASHBOARD_TABS: DashboardTab[] = [
    { id: 'dashboard', key: 'dashboard', name: 'Dashboard', isBuiltIn: true, isVisible: true, order: 0 },
    { id: 'projects', key: 'projects', name: 'Projects', isBuiltIn: false, isVisible: true, order: 1 },
    { id: 'playbooks', key: 'playbooks', name: 'Playbooks', isBuiltIn: false, isVisible: true, order: 2 },
    { id: 'care', key: 'care', name: 'Care', isBuiltIn: false, isVisible: true, order: 3 },
  ];
  const [dashboardTabs, setDashboardTabs] = useLocalStorage<DashboardTab[]>('neurulae-dashboard-tabs', DEFAULT_DASHBOARD_TABS);
  const [customTabs, setCustomTabs] = useLocalStorage<{ id: string; name: string }[]>('neurulae-custom-tabs', []);
  const [newTabDialogOpen, setNewTabDialogOpen] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editTabsDialogOpen, setEditTabsDialogOpen] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');

  // Onboarding Tutorial
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage<boolean>('neurulae-tutorial-seen', false);

  // Profile Setup
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
  const [hasProfile, setHasProfile] = useLocalStorage<boolean>('neurulae-has-profile', false);

  // Calendar Scheduler
  const [schedulerOpen, setSchedulerOpen] = useState(false);

  // Eisenhower Matrix
  const [eisenhowerOpen, setEisenhowerOpen] = useState(false);

  // AI Assistant
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [initialAIMessage, setInitialAIMessage] = useState<string | undefined>();
  const [profileSetupDialogOpen, setProfileSetupDialogOpen] = useState(false);

  // Time Constraint View
  const [showTimeConstraintView, setShowTimeConstraintView] = useLocalStorage('neurulae-show-time-constraint-view', false);

  // Routine Template Viewer
  const [selectedRoutine, setSelectedRoutine] = useState<Playbook | null>(null);
  const [routineViewerOpen, setRoutineViewerOpen] = useState(false);

  // AI Preferences
  const [showAI, setShowAI] = useLocalStorage('neurulae-ai-enabled', true);
  const [aiFirstMode] = useLocalStorage('neurulae-ai-first-mode', false);
  const [showQuickActions] = useLocalStorage('neurulae-ai-quick-actions', true);

  // Command Palette
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Focus Mode
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [focusModeTask, setFocusModeTask] = useState<Task | null>(null);

  // Daily Review
  const [dailyReviewOpen, setDailyReviewOpen] = useState(false);
  const [lastReviewDate, setLastReviewDate] = useLocalStorage<string>('neurulae-last-review-date', '');

  // Daily Planning
  const [dailyPlanningOpen, setDailyPlanningOpen] = useState(false);
  const [lastPlanningDate, setLastPlanningDate] = useLocalStorage<string>('neurulae-last-planning-date', '');

  // Analytics Dashboard (as a tab)
  const [activeTab, setActiveTab] = useState('dashboard');

  const { toast } = useToast();

  // Active Intention Banner - for focus tracking
  const allTasks = [...tasks, ...priorities];
  const handleCompleteIntentionTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: true } : t));
    setPriorities(priorities.map(t => t.id === taskId ? { ...t, completed: true } : t));
    toast({
      title: "Task Completed!",
      description: "Great work staying focused!",
    });
  };

  const {
    activeIntention,
    currentTask: activeIntentionTask,
    startIntention,
    pauseIntention,
    resumeIntention,
    completeIntention,
    clearIntention,
    getElapsedTime,
    formatElapsedTime,
    isPaused: isIntentionPaused,
  } = useActiveIntention({
    tasks: allTasks,
    onTaskComplete: handleCompleteIntentionTask,
  });

  // Check if banner should be shown (default: true)
  const showIntentionBanner = preferences.enableActiveIntentionBanner !== false;

  // Show tutorial on first visit
  useEffect(() => {
    if (!hasSeenTutorial) {
      setTutorialOpen(true);
      setHasSeenTutorial(true);
    }
  }, [hasSeenTutorial, setHasSeenTutorial]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Escape to close focus mode
      if (e.key === 'Escape' && focusModeOpen) {
        setFocusModeOpen(false);
      }
      // N for new task (when not in input)
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // F for focus mode
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setFocusModeOpen(true);
      }
      // A for AI assistant
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setIsAIAssistantOpen(true);
      }
      // ? for keyboard shortcuts help
      if (e.key === '?' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setKeyboardShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusModeOpen]);

  // Check for daily planning prompt (show in morning)
  useEffect(() => {
    const checkDailyPlanning = () => {
      const now = new Date();
      const hour = now.getHours();
      const today = now.toISOString().split('T')[0];

      // Show planning dialog between 6 AM and 11 AM if not shown today
      if (hour >= 6 && hour <= 11 && lastPlanningDate !== today) {
        // Only show if user has incomplete tasks
        if (tasks.filter(t => !t.completed).length > 0) {
          setDailyPlanningOpen(true);
        }
      }
    };

    // Check on mount and every 30 minutes
    checkDailyPlanning();
    const interval = setInterval(checkDailyPlanning, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lastPlanningDate, tasks]);

  // Check for daily review prompt (show near bedtime)
  useEffect(() => {
    const checkDailyReview = () => {
      const now = new Date();
      const hour = now.getHours();
      const today = now.toISOString().split('T')[0];

      // Show review prompt between 8 PM and 11 PM if not shown today
      if (hour >= 20 && hour <= 23 && lastReviewDate !== today) {
        // Only show if user has some tasks
        if (tasks.length > 0) {
          setDailyReviewOpen(true);
        }
      }
    };

    // Check on mount and every 30 minutes
    checkDailyReview();
    const interval = setInterval(checkDailyReview, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lastReviewDate, tasks.length]);

  // Download cloud data when user logs in (cross-device sync)
  useEffect(() => {
    const loadCloudData = async () => {
      if (!user) return;

      console.log('Loading cloud data for user:', user.id);
      const cloudData = await syncService.downloadAll();

      if (Object.keys(cloudData).length > 0) {
        console.log('Found cloud data:', Object.keys(cloudData));

        // Only update if cloud has data (don't overwrite with empty)
        if (cloudData.tasks && Array.isArray(cloudData.tasks) && cloudData.tasks.length > 0) {
          setTasks(cloudData.tasks);
        }
        if (cloudData.priorities && Array.isArray(cloudData.priorities) && cloudData.priorities.length > 0) {
          setPriorities(cloudData.priorities);
        }
        if (cloudData.projects && Array.isArray(cloudData.projects) && cloudData.projects.length > 0) {
          setProjects(cloudData.projects);
        }
        if (cloudData.timeblocks && Array.isArray(cloudData.timeblocks) && cloudData.timeblocks.length > 0) {
          setTimeBlocks(cloudData.timeblocks);
        }
        if (cloudData['scheduled-tasks'] && Array.isArray(cloudData['scheduled-tasks']) && cloudData['scheduled-tasks'].length > 0) {
          setScheduledTasks(cloudData['scheduled-tasks']);
        }
        if (cloudData.playbooks && Array.isArray(cloudData.playbooks) && cloudData.playbooks.length > 0) {
          setPlaybooks(cloudData.playbooks);
        }
        if (cloudData.customTheme) {
          // Ensure backgroundImage is properly loaded from cloud
          console.log('[Theme] Loading customTheme from cloud:', {
            name: cloudData.customTheme.name,
            hasBackgroundImage: !!cloudData.customTheme.backgroundImage?.url,
          });
          setCustomTheme(cloudData.customTheme);
        }

        toast({
          title: "☁️ Synced",
          description: "Your data has been loaded from the cloud.",
          duration: 3000,
        });
      }
    };

    loadCloudData();
  }, [user]);

  // Custom theme now syncs automatically via useSyncedStorage - no manual sync needed

  // Debug: Log custom theme state changes
  useEffect(() => {
    if (customTheme) {
      console.log('[Theme] customTheme state updated:', {
        name: customTheme.name,
        hasBackgroundImage: !!customTheme.backgroundImage?.url,
        backgroundImageUrl: customTheme.backgroundImage?.url?.substring(0, 100),
        blur: customTheme.backgroundImage?.blur,
        opacity: customTheme.backgroundImage?.opacity,
      });
    }
  }, [customTheme]);

  // Load theme from database preferences
  useEffect(() => {
    if (!prefsLoading && preferences.theme) {
      setTheme(preferences.theme as Theme);
    }
  }, [preferences.theme, prefsLoading, setTheme]);

  // Daily refresh logic - load today's schedule on mount or date change
  useEffect(() => {
    const checkDailyRefresh = async () => {
      if (!user) return;

      const lastVisitDate = localStorage.getItem('neurulae-last-visit-date');
      const today = getTodayString();

      if (lastVisitDate !== today) {
        console.log('New day detected, refreshing schedule...');

        // Load today's schedule entries from database
        const { data, error } = await supabase
          .from('schedule_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_time', new Date().setHours(0, 0, 0, 0))
          .lte('start_time', new Date().setHours(23, 59, 59, 999))
          .order('start_time');

        if (!error && data) {
          console.log(`Loaded ${data.length} schedule entries for today`);

          // Show morning brief if there are activities today
          if (data.length > 0) {
            const homeworkCount = data.filter(e => e.category === 'homework').length;
            const classCount = data.filter(e => e.category === 'class').length;
            const workCount = data.filter(e => e.category === 'work').length;

            let description = 'Your schedule for today: ';
            const parts = [];
            if (workCount > 0) parts.push(`${workCount} work shift${workCount > 1 ? 's' : ''}`);
            if (classCount > 0) parts.push(`${classCount} class${classCount > 1 ? 'es' : ''}`);
            if (homeworkCount > 0) parts.push(`${homeworkCount} homework assignment${homeworkCount > 1 ? 's' : ''}`);
            description += parts.join(', ');

            toast({
              title: "☀️ Good morning!",
              description,
              duration: 5000,
            });
          }
        }

        localStorage.setItem('neurulae-last-visit-date', today);
      }
    };

    checkDailyRefresh();
  }, [user, toast]);

  // Check for profile and show setup if needed
  useEffect(() => {
    const checkProfile = async () => {
      if (!user || hasProfile) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!data) {
        setProfileSetupOpen(true);
      } else {
        setHasProfile(true);
      }
    };

    checkProfile();
  }, [user, hasProfile, setHasProfile]);

  // One-time migration from neuroflow/neupath to neurulae localStorage keys
  useEffect(() => {
    const migrationKey = 'neurulae-migration-completed';
    if (localStorage.getItem(migrationKey)) return;

    const oldPrefixes = ['neuroflow-', 'neupath-'];
    const keySuffixes = [
      'theme', 'tasks', 'priorities', 'projects', 'timeblocks', 'scheduled-tasks',
      'playbooks', 'widgets', 'energy-widgets', 'messenger-widgets',
      'mood-garden-widgets', 'parallel-universe-widgets', 'sound-signature-widgets',
      'custom-theme', 'custom-tabs', 'timer-sessions', 'active-timer',
      'chime-interval', 'chime-running', 'chime-count', 'chime-countdown'
    ];

    let migrated = 0;
    keySuffixes.forEach(suffix => {
      const newKey = `neurulae-${suffix}`;

      // Check if new key already has data
      if (localStorage.getItem(newKey)) return;

      // Try to find data from old prefixes (neupath first, then neuroflow)
      for (const prefix of oldPrefixes) {
        const oldKey = `${prefix}${suffix}`;
        const value = localStorage.getItem(oldKey);
        if (value) {
          localStorage.setItem(newKey, value);
          migrated++;
          break; // Stop after finding the first match
        }
      }
    });

    localStorage.setItem(migrationKey, 'true');
    if (migrated > 0) {
      toast({
        title: "✨ Welcome to Neurulae!",
        description: `Your data has been migrated successfully. All ${migrated} items preserved.`,
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const body = document.body;
    const root = document.documentElement;

    // Apply custom theme if selected
    if (theme === 'custom' && customTheme) {
      // Auto-optimize text colors for WCAG compliance (fixes invisible text issue)
      const optimizedColors = autoOptimizeThemeColors(customTheme.colors as Record<string, string>);
      
      Object.entries(optimizedColors).forEach(([key, value]) => {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value);
      });

      // Apply background image directly to body
      if (customTheme.backgroundImage && customTheme.backgroundImage.url) {
        const bg = customTheme.backgroundImage;

        // Apply background styles
        body.style.backgroundImage = `url(${bg.url})`;
        body.style.backgroundSize = bg.size === 'stretch' ? '100% 100%' : bg.size;
        body.style.backgroundPosition = bg.position.replace('-', ' ');
        body.style.backgroundRepeat = bg.repeat;
        body.style.backgroundAttachment = bg.attachment;

        // Set CSS variables for overlay and background filters (applied via body::before)
        root.style.setProperty('--bg-blur', `${bg.blur}px`);
        root.style.setProperty('--bg-opacity', `${bg.opacity / 100}`);
        root.style.setProperty('--overlay-color', bg.overlayColor);
        root.style.setProperty('--overlay-opacity', `${bg.overlayOpacity}%`);
        root.style.setProperty('--bg-filter-grayscale', `${bg.filter.grayscale}%`);
        root.style.setProperty('--bg-filter-sepia', `${bg.filter.sepia}%`);
        root.style.setProperty('--bg-filter-brightness', `${bg.filter.brightness}%`);
        root.style.setProperty('--bg-filter-contrast', `${bg.filter.contrast}%`);
        root.style.setProperty('--bg-filter-saturate', `${bg.filter.saturate}%`);
      }
    } else if (theme !== 'custom') {
      // Remove custom theme variables when switching to preset theme
      const colorKeys = ['background', 'foreground', 'card', 'cardForeground', 'primary', 'primaryForeground', 'secondary', 'secondaryForeground', 'accent', 'accentForeground', 'muted', 'mutedForeground', 'border', 'input'];
      colorKeys.forEach((key) => {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.removeProperty(cssVar);
      });

      // Remove background styles from body
      body.style.backgroundImage = '';
      body.style.backgroundSize = '';
      body.style.backgroundPosition = '';
      body.style.backgroundRepeat = '';
      body.style.backgroundAttachment = '';

      root.style.removeProperty('--bg-blur');
      root.style.removeProperty('--bg-opacity');
      root.style.removeProperty('--overlay-color');
      root.style.removeProperty('--overlay-opacity');
      root.style.removeProperty('--bg-filter-grayscale');
      root.style.removeProperty('--bg-filter-sepia');
      root.style.removeProperty('--bg-filter-brightness');
      root.style.removeProperty('--bg-filter-contrast');
      root.style.removeProperty('--bg-filter-saturate');
    }
  }, [theme, customTheme]);

  // REMOVED: Auto-sync effect that caused cascading writes
  // Theme is now only synced when user explicitly saves in CustomThemeBuilder

  const handleAddTask = async (taskOrTitle: string | Omit<Task, 'id' | 'createdAt'>, estimatedMinutes?: number, taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other') => {
    const taskId = crypto.randomUUID();
    const newTask: Task = typeof taskOrTitle === 'string'
      ? {
        id: taskId,
        title: taskOrTitle,
        completed: false,
        recurring: 'none',
        createdAt: new Date().toISOString(),
        ...(estimatedMinutes && { estimatedMinutes }),
        ...(taskType && { taskType }),
      }
      : {
        id: taskId,
        ...taskOrTitle,
        createdAt: new Date().toISOString(),
      };
    
    // Update local state immediately for responsive UI
    setTasks(prev => [...prev, newTask]);
    
    // Also persist to Supabase 'tasks' table for AI features
    if (user) {
      try {
        const { error } = await supabase
          .from('tasks')
          .insert({
            id: taskId,
            user_id: user.id,
            name: newTask.title,
            due_date: newTask.dueDate || null,
            estimated_minutes: newTask.estimatedMinutes || null,
            type: newTask.type || 'daily',
            status: 'pending',
            is_completed: false,
          });
        
        if (error) {
          console.error('Failed to save task to database:', error);
          // Show user-visible error so failures aren't silent
          toast({
            title: "⚠️ Sync Warning",
            description: `Task added locally but failed to sync to cloud: ${error.message}`,
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error('Error inserting task to database:', err);
        toast({
          title: "⚠️ Sync Error",
          description: "Task added locally but cloud sync failed. AI features may not see this task.",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompletedState = !task.completed;

    setTasks(tasks.map(t =>
      t.id === id ? { ...t, completed: newCompletedState } : t
    ));
    setPriorities(priorities.map(t =>
      t.id === id ? { ...t, completed: newCompletedState } : t
    ));

    // Show toast with undo action for completion
    if (newCompletedState) {
      const { dismiss } = toast({
        title: "Task completed",
        description: task.title.length > 30
          ? task.title.substring(0, 30) + "..."
          : task.title,
        action: (
          <ToastAction altText="Undo" onClick={() => {
            // Restore to incomplete
            setTasks(prev => prev.map(t =>
              t.id === id ? { ...t, completed: false } : t
            ));
            setPriorities(prev => prev.map(t =>
              t.id === id ? { ...t, completed: false } : t
            ));
            dismiss();
          }}>
            Undo
          </ToastAction>
        ),
      });
    }

    // Sync to database
    if (user) {
      try {
        await supabase
          .from('tasks')
          .update({
            is_completed: newCompletedState,
            status: newCompletedState ? 'completed' : 'pending'
          })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error updating task completion in database:', err);
      }
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    ));
    setPriorities(priorities.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleUpdateTaskById = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));
    setPriorities(priorities.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleDeleteTask = async (id: string) => {
    // Store the deleted task for potential undo
    const deletedTask = tasks.find(task => task.id === id);
    if (!deletedTask) return;

    // Remove from UI immediately
    setTasks(tasks.filter(task => task.id !== id));
    setPriorities(priorities.filter(task => task.id !== id));

    // Show toast with undo action
    const { dismiss } = toast({
      title: "Task deleted",
      description: deletedTask.title.length > 30
        ? deletedTask.title.substring(0, 30) + "..."
        : deletedTask.title,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          // Restore the task
          setTasks(prev => [...prev, deletedTask]);
          dismiss();
        }}>
          Undo
        </ToastAction>
      ),
    });

    // Soft-delete in database (set deleted_at timestamp)
    if (user) {
      try {
        await supabase
          .from('tasks')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error deleting task from database:', err);
      }
    }
  };

  const handleClearCompletedTasks = () => {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) {
      toast({
        title: "No completed tasks",
        description: "There are no completed tasks to clear.",
      });
      return;
    }

    // Remove completed tasks from UI
    setTasks(tasks.filter(t => !t.completed));
    setPriorities(priorities.filter(t => !t.completed));

    // Show toast with undo action
    const { dismiss } = toast({
      title: "Cleared completed tasks",
      description: `${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''} removed`,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          // Restore all completed tasks
          setTasks(prev => [...prev, ...completedTasks]);
          dismiss();
        }}>
          Undo
        </ToastAction>
      ),
    });

    // Soft-delete in database
    if (user) {
      completedTasks.forEach(async (task) => {
        try {
          await supabase
            .from('tasks')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', task.id)
            .eq('user_id', user.id);
        } catch (err) {
          console.error('Error deleting completed task:', err);
        }
      });
    }
  };

  const handleClearAllTasks = () => {
    if (tasks.length === 0) {
      toast({
        title: "No tasks",
        description: "There are no tasks to clear.",
      });
      return;
    }

    // Store all tasks for undo
    const allTasks = [...tasks];

    // Clear all tasks from UI
    setTasks([]);
    setPriorities([]);

    // Show toast with undo action
    const { dismiss } = toast({
      title: "Cleared all tasks",
      description: `${allTasks.length} task${allTasks.length > 1 ? 's' : ''} removed`,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          // Restore all tasks
          setTasks(allTasks);
          dismiss();
        }}>
          Undo
        </ToastAction>
      ),
    });

    // Soft-delete in database
    if (user) {
      allTasks.forEach(async (task) => {
        try {
          await supabase
            .from('tasks')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', task.id)
            .eq('user_id', user.id);
        } catch (err) {
          console.error('Error deleting task:', err);
        }
      });
    }
  };

  const handleBulkAddTasks = async (tasksToAdd: Array<{ title: string; estimatedMinutes?: number }>) => {
    if (!user) {
      console.error('Cannot bulk add tasks: user not authenticated');
      return;
    }
    
    // Prepare all tasks with IDs and proper defaults
    const newTasks: Task[] = tasksToAdd.map(({ title, estimatedMinutes }) => ({
      id: crypto.randomUUID(),
      title,
      completed: false,
      recurring: 'none' as const,
      type: 'daily' as const, // Ensure type is set for schema consistency
      createdAt: new Date().toISOString(),
      estimatedMinutes,
    }));
    
    // 1. Update UI first (optimistic update for responsiveness)
    setTasks(prev => [...prev, ...newTasks]);
    
    // 2. Sync to DB with schema-compliant rows
    const dbRows = newTasks.map(task => ({
      id: task.id,
      user_id: user.id,
      name: task.title,
      due_date: null,
      estimated_minutes: task.estimatedMinutes || null,
      type: 'daily', // Matches DB constraint
      status: 'pending',
      is_completed: false,
    }));
    
    const { error } = await supabase
      .from('tasks')
      .insert(dbRows);
    
    if (error) {
      console.error('Failed to bulk insert tasks:', error);
      // Show user-visible error for bulk add failures
      toast({
        title: "⚠️ Sync Error",
        description: "Tasks saved locally but failed to sync to cloud.",
        variant: "destructive",
      });
      // Don't throw - tasks are already in local state, just log the sync failure
    }
  };

  const handlePrioritizeTasks = (taskIds: string[]) => {
    // Move top priority tasks to priorities list
    const topTasks = taskIds.slice(0, 5).map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[];
    setPriorities(topTasks);
  };

  const handleScheduleTasks = (schedule: Array<{
    taskId: string;
    blockId: string;
    estimatedMinutes?: number;
    order?: number;
  }>) => {
    const today = getTodayString();
    const newScheduledTasks = schedule.map(item => ({
      id: crypto.randomUUID(),
      taskId: item.taskId,
      blockId: item.blockId,
      date: today,
      estimatedMinutes: item.estimatedMinutes,
    }));
    setScheduledTasks([...scheduledTasks, ...newScheduledTasks]);
  };

  const handleAddPriority = () => {
    // In a full implementation, this would open a dialog to select/create a task
    const newPriority: Task = {
      id: crypto.randomUUID(),
      title: 'New Priority',
      completed: false,
      recurring: 'none',
      createdAt: new Date().toISOString(),
    };
    setPriorities([...priorities, newPriority]);
  };

  const handleAddProject = () => {
    // In a full implementation, this would open a dialog
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: 'New Project',
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    setProjects([...projects, newProject]);
  };

  const handleAddTimeBlock = (blockData: Omit<TimeBlock, 'id' | 'createdAt'>) => {
    const newBlock: TimeBlock = {
      ...blockData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTimeBlocks([...timeBlocks, newBlock]);
  };

  const handleUpdateTimeBlock = (id: string, blockData: Omit<TimeBlock, 'id' | 'createdAt'>) => {
    setTimeBlocks(timeBlocks.map(block =>
      block.id === id ? { ...block, ...blockData } : block
    ));
  };

  const handleDeleteTimeBlock = (id: string) => {
    setTimeBlocks(timeBlocks.filter(block => block.id !== id));
    setScheduledTasks(scheduledTasks.filter(task => task.blockId !== id));
  };

  const handleScheduleTask = (taskId: string, blockId: string, date: string, estimatedMinutes?: number) => {
    const newScheduledTask: ScheduledTask = {
      id: crypto.randomUUID(),
      taskId,
      blockId,
      date,
      estimatedMinutes,
    };
    setScheduledTasks([...scheduledTasks, newScheduledTask]);
    toast({
      title: "Task Scheduled",
      description: "Your task has been added to the schedule.",
    });
  };

  const handleBreakdownTask = async (task: Task) => {
    try {
      toast({
        title: "Breaking down task...",
        description: "AI is generating subtasks for you.",
      });

      const { data, error } = await supabase.functions.invoke('breakdown-task', {
        body: {
          taskTitle: task.title,
          taskDescription: task.notes,
          estimatedMinutes: task.estimatedMinutes,
        },
      });

      if (error) throw error;

      if (data?.subtasks && Array.isArray(data.subtasks)) {
        const subtasks = data.subtasks.map((st: any) => ({
          id: crypto.randomUUID(),
          title: st.title,
          completed: false,
        }));

        handleUpdateTask({
          ...task,
          subtasks,
        });

        toast({
          title: "Task broken down!",
          description: `Added ${subtasks.length} subtasks to help you get started.`,
        });
      }
    } catch (error) {
      console.error('Error breaking down task:', error);
      toast({
        title: "Failed to break down task",
        description: "There was an error generating subtasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDailyPlanningComplete = (selectedTaskIds: string[]) => {
    // Mark selected tasks as "daily" type
    setTasks(tasks.map(task =>
      selectedTaskIds.includes(task.id)
        ? { ...task, type: 'daily' as const }
        : task
    ));

    // Update last planning date
    const today = new Date().toISOString().split('T')[0];
    setLastPlanningDate(today);

    toast({
      title: "Day planned!",
      description: `You've selected ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''} to focus on today.`,
    });
  };

  const handleAddPlaybook = (playbookData: Omit<Playbook, 'id' | 'createdAt'>) => {
    const newPlaybook: Playbook = {
      ...playbookData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      order: playbooks.length,
    };
    setPlaybooks([...playbooks, newPlaybook]);
  };

  const handleUpdatePlaybook = (id: string, playbookData: Partial<Playbook>) => {
    setPlaybooks(playbooks.map(p => p.id === id ? { ...p, ...playbookData } : p));
  };

  const handleDeletePlaybook = (id: string) => {
    setPlaybooks(playbooks.filter(p => p.id !== id));
  };

  const handleReorderPlaybooks = (reorderedPlaybooks: Playbook[]) => {
    setPlaybooks(reorderedPlaybooks);
  };

  const handleAddWidget = () => {
    setEditingWidget(undefined);
    setWidgetEditorOpen(true);
  };

  const handleEditWidget = (id: string) => {
    const widget = reminderWidgets.find(w => w.id === id);
    setEditingWidget(widget);
    setWidgetEditorOpen(true);
  };

  const handleSaveWidget = (widgetData: Omit<ReminderWidget, 'id' | 'createdAt'>) => {
    if (editingWidget) {
      setReminderWidgets(reminderWidgets.map(w =>
        w.id === editingWidget.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: ReminderWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setReminderWidgets([...reminderWidgets, newWidget]);
    }
  };

  const handleToggleWidgetItem = (widgetId: string, itemId: string) => {
    setReminderWidgets(reminderWidgets.map(widget => {
      if (widget.id === widgetId) {
        return {
          ...widget,
          items: widget.items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return widget;
    }));
  };

  const handleResetWidget = (widgetId: string) => {
    setReminderWidgets(reminderWidgets.map(widget => {
      if (widget.id === widgetId) {
        return {
          ...widget,
          items: widget.items.map(item => ({ ...item, completed: false })),
          lastResetDate: new Date().toISOString(),
        };
      }
      return widget;
    }));
  };

  const handleDeleteWidget = (widgetId: string) => {
    setReminderWidgets(reminderWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your reminder widget has been removed." });
  };

  const handleDeleteEnergyWidget = (widgetId: string) => {
    setEnergyWidgets(energyWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your energy widget has been removed." });
  };

  const handleDeleteMessengerWidget = (widgetId: string) => {
    setMessengerWidgets(messengerWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your messenger widget has been removed." });
  };

  const handleDeleteMoodGardenWidget = (widgetId: string) => {
    setMoodGardenWidgets(moodGardenWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your mood garden widget has been removed." });
  };

  const handleDeleteParallelUniverseWidget = (widgetId: string) => {
    setParallelUniverseWidgets(parallelUniverseWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your parallel universe widget has been removed." });
  };

  const handleDeleteSoundSignatureWidget = (widgetId: string) => {
    setSoundSignatureWidgets(soundSignatureWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your sound signature widget has been removed." });
  };

  // Brain Dump Widget handlers
  const handleAddBrainDumpWidget = () => {
    const newWidget: BrainDumpWidget = {
      id: crypto.randomUUID(),
      type: 'brain-dump',
      title: 'Brain Dump',
      thoughts: [],
    };
    setBrainDumpWidgets([...brainDumpWidgets, newWidget]);
    toast({ title: "Brain Dump created", description: "Send distracting thoughts to the void." });
  };

  const handleDeleteBrainDumpWidget = (widgetId: string) => {
    setBrainDumpWidgets(brainDumpWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your brain dump widget has been removed." });
  };

  const handleAddThought = (widgetId: string, content: string) => {
    setBrainDumpWidgets(brainDumpWidgets.map(widget => {
      if (widget.id === widgetId) {
        return {
          ...widget,
          thoughts: [
            ...widget.thoughts,
            {
              id: crypto.randomUUID(),
              content,
              timestamp: new Date().toISOString(),
            }
          ],
        };
      }
      return widget;
    }));
  };

  // Potion Inventory Widget handlers
  const handleAddPotionInventoryWidget = () => {
    const now = new Date().toISOString();
    const newWidget: PotionInventoryWidget = {
      id: crypto.randomUUID(),
      type: 'potion-inventory',
      title: 'Potion Inventory',
      // New required fields
      foodLevel: 100,
      waterLevel: 100,
      sleepLevel: 100,
      lastFoodTime: now,
      lastWaterTime: now,
      lastSleepTime: now,
      wakeTime: '07:00',
      mealSchedule: {
        breakfast: '07:00',
        morningSnack: '10:00',
        lunch: '12:30',
        afternoonSnack: '15:00',
        dinner: '18:30',
        bedtime: '22:00',
      },
      useCustomSchedule: false,
      decayEnabled: true,
      // Legacy fields for backwards compatibility
      healthLevel: 100,
      manaLevel: 100,
      staminaLevel: 100,
      lastDecayTime: now,
    };
    setPotionInventoryWidgets([...potionInventoryWidgets, newWidget]);
    toast({ title: "Potion Inventory created", description: "Track your health, mana, and stamina." });
  };

  const handleDeletePotionInventoryWidget = (widgetId: string) => {
    setPotionInventoryWidgets(potionInventoryWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your potion inventory has been removed." });
  };

  const handleUpdatePotionLevels = (widgetId: string, updates: Partial<PotionInventoryWidget>) => {
    setPotionInventoryWidgets(potionInventoryWidgets.map(widget => {
      if (widget.id === widgetId) {
        return { ...widget, ...updates };
      }
      return widget;
    }));
  };

  // Sunlight Anchor Widget handlers
  const handleAddSunlightAnchorWidget = () => {
    const newWidget: SunlightAnchorWidget = {
      id: crypto.randomUUID(),
      type: 'sunlight-anchor',
      title: 'Sunlight Anchor',
      useGeolocation: true, // Try geolocation by default
    };
    setSunlightAnchorWidgets([...sunlightAnchorWidgets, newWidget]);
    toast({ title: "Sunlight Anchor created", description: "Visual time awareness without numbers." });
  };

  const handleDeleteSunlightAnchorWidget = (widgetId: string) => {
    setSunlightAnchorWidgets(sunlightAnchorWidgets.filter(w => w.id !== widgetId));
    toast({ title: "Widget deleted", description: "Your sunlight anchor has been removed." });
  };

  const handleUpdateSunlightAnchorSettings = (widgetId: string, updates: Partial<SunlightAnchorWidget>) => {
    setSunlightAnchorWidgets(sunlightAnchorWidgets.map(w =>
      w.id === widgetId ? { ...w, ...updates } : w
    ));
  };

  // Auto-reset widgets based on schedule
  useEffect(() => {
    const checkResets = () => {
      const now = new Date();
      const today = getTodayString();

      setReminderWidgets(prevWidgets => {
        let hasChanges = false;
        const updatedWidgets = prevWidgets.map(widget => {
          if (widget.resetSchedule === 'none') return widget;

          const lastReset = widget.lastResetDate ? new Date(widget.lastResetDate) : null;
          let shouldReset = false;

          if (!lastReset) {
            shouldReset = true;
          } else if (widget.resetSchedule === 'daily') {
            shouldReset = getDateString(lastReset) !== today;
          } else if (widget.resetSchedule === 'weekly') {
            const daysSince = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
            shouldReset = daysSince >= 7;
          } else if (widget.resetSchedule === 'monthly') {
            shouldReset = lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
          }

          if (shouldReset) {
            hasChanges = true;
            return {
              ...widget,
              items: widget.items.map(item => ({ ...item, completed: false })),
              lastResetDate: new Date().toISOString(),
            };
          }

          return widget;
        });

        return hasChanges ? updatedWidgets : prevWidgets;
      });
    };

    checkResets();
    const interval = setInterval(checkResets, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Energy Widget handlers
  const handleAddEnergyWidget = () => {
    setEditingEnergyWidget(undefined);
    setEnergyWidgetEditorOpen(true);
  };

  const handleEditEnergyWidget = (widgetId: string) => {
    const widget = energyWidgets.find(w => w.id === widgetId);
    setEditingEnergyWidget(widget);
    setEnergyWidgetEditorOpen(true);
  };

  const handleSaveEnergyWidget = (widgetData: Omit<EnergyTaskWidget, 'id'> & { id?: string }) => {
    if (widgetData.id) {
      setEnergyWidgets(energyWidgets.map(w =>
        w.id === widgetData.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: EnergyTaskWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
      };
      setEnergyWidgets([...energyWidgets, newWidget]);
    }
    toast({ title: "Energy widget saved", description: "Your energy tracking widget has been updated." });
  };

  const handleLogEnergy = (widgetId: string, category: string, level: number) => {
    setEnergyWidgets(energyWidgets.map(widget => {
      if (widget.id === widgetId) {
        return {
          ...widget,
          energyLogs: [
            ...widget.energyLogs,
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              level,
              category: category as any,
            }
          ].slice(-100), // Keep last 100 logs
        };
      }
      return widget;
    }));
    toast({
      title: "Energy logged",
      description: `${category.charAt(0).toUpperCase() + category.slice(1)} energy: ${level}/10`
    });
  };

  // Future Self Messenger handlers
  const handleAddMessengerWidget = () => {
    setEditingMessengerWidget(undefined);
    setMessengerEditorMode('settings');
    setMessengerWidgetEditorOpen(true);
  };

  const handleEditMessengerWidget = (widgetId: string) => {
    const widget = messengerWidgets.find(w => w.id === widgetId);
    setEditingMessengerWidget(widget);
    setMessengerEditorMode('settings');
    setMessengerWidgetEditorOpen(true);
  };

  const handleCreateMessage = (widgetId: string) => {
    const widget = messengerWidgets.find(w => w.id === widgetId);
    setEditingMessengerWidget(widget);
    setMessengerEditorMode('message');
    setMessengerWidgetEditorOpen(true);
  };

  const handleSaveMessengerWidget = (widgetData: Omit<FutureSelfMessengerWidget, 'id'> & { id?: string }) => {
    if (widgetData.id) {
      setMessengerWidgets(messengerWidgets.map(w =>
        w.id === widgetData.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: FutureSelfMessengerWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
      };
      setMessengerWidgets([...messengerWidgets, newWidget]);
    }
    toast({ title: "Messenger widget saved" });
  };

  const handleSaveMessage = (message: Omit<FutureSelfMessage, 'id'>) => {
    if (!editingMessengerWidget) return;

    const newMessage: FutureSelfMessage = {
      ...message,
      id: crypto.randomUUID(),
    };

    setMessengerWidgets(messengerWidgets.map(widget => {
      if (widget.id === editingMessengerWidget.id) {
        return {
          ...widget,
          messages: [...widget.messages, newMessage],
        };
      }
      return widget;
    }));

    toast({
      title: "Message scheduled",
      description: "Your future self will receive this message at the right time."
    });
  };

  const handleViewMessage = (widgetId: string, messageId: string) => {
    setMessengerWidgets(messengerWidgets.map(widget => {
      if (widget.id === widgetId) {
        return {
          ...widget,
          messages: widget.messages.map(msg =>
            msg.id === messageId ? { ...msg, delivered: true, deliveredAt: new Date().toISOString() } : msg
          ),
        };
      }
      return widget;
    }));
  };

  // Mood Garden handlers
  const handleAddMoodGardenWidget = () => {
    setEditingMoodGardenWidget(undefined);
    setMoodGardenWidgetEditorOpen(true);
  };

  const handleEditMoodGardenWidget = (widgetId: string) => {
    const widget = moodGardenWidgets.find(w => w.id === widgetId);
    setEditingMoodGardenWidget(widget);
    setMoodGardenWidgetEditorOpen(true);
  };

  const handleSaveMoodGardenWidget = (widgetData: Omit<MoodGardenWidget, 'id'> & { id?: string }) => {
    if (widgetData.id) {
      setMoodGardenWidgets(moodGardenWidgets.map(w =>
        w.id === widgetData.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: MoodGardenWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
      };
      setMoodGardenWidgets([...moodGardenWidgets, newWidget]);
    }
    toast({ title: "Mood garden saved" });
  };

  const handleLogMood = (widgetId: string, emotion: string, intensity: number, note?: string) => {
    setMoodGardenWidgets(moodGardenWidgets.map(widget => {
      if (widget.id === widgetId) {
        const newEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          emotion,
          intensity,
          note,
        };

        // Update or create plant for this emotion
        let updatedPlants = [...widget.plants];
        const existingPlantIndex = updatedPlants.findIndex(p => p.type === emotion);

        if (existingPlantIndex >= 0) {
          // Update existing plant
          const plant = updatedPlants[existingPlantIndex];
          const newHealth = Math.min(100, plant.health + intensity);
          const newStage: Plant['stage'] =
            newHealth < 25 ? 'seed' :
              newHealth < 50 ? 'sprout' :
                newHealth < 75 ? 'growing' : 'blooming';

          updatedPlants[existingPlantIndex] = {
            ...plant,
            health: newHealth,
            lastWatered: new Date().toISOString(),
            stage: newStage,
          };
        } else {
          // Create new plant
          updatedPlants.push({
            id: crypto.randomUUID(),
            type: emotion,
            health: intensity * 10,
            lastWatered: new Date().toISOString(),
            stage: intensity < 3 ? 'seed' : 'sprout',
          });
        }

        return {
          ...widget,
          moodEntries: [...widget.moodEntries, newEntry].slice(-50),
          plants: updatedPlants,
        };
      }
      return widget;
    }));
    toast({ title: "Mood logged", description: `${emotion} - ${intensity}/10` });
  };

  // Parallel Universe handlers
  const handleAddParallelUniverseWidget = () => {
    setEditingParallelUniverseWidget(undefined);
    setParallelUniverseWidgetEditorOpen(true);
  };

  const handleEditParallelUniverseWidget = (widgetId: string) => {
    const widget = parallelUniverseWidgets.find(w => w.id === widgetId);
    setEditingParallelUniverseWidget(widget);
    setParallelUniverseWidgetEditorOpen(true);
  };

  const handleSaveParallelUniverseWidget = (widgetData: Omit<ParallelUniverseWidget, 'id'> & { id?: string }) => {
    if (widgetData.id) {
      setParallelUniverseWidgets(parallelUniverseWidgets.map(w =>
        w.id === widgetData.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: ParallelUniverseWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
      };
      setParallelUniverseWidgets([...parallelUniverseWidgets, newWidget]);
    }
    toast({ title: "Parallel universe widget saved" });
  };

  const handleLogDecision = (widgetId: string, question: string, chosen: string, alternatives: string[], context?: string) => {
    setParallelUniverseWidgets(parallelUniverseWidgets.map(widget => {
      if (widget.id === widgetId) {
        const newDecision = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          question,
          chosenOption: chosen,
          alternatives,
          context,
        };
        return {
          ...widget,
          decisions: [...widget.decisions, newDecision].slice(-20),
        };
      }
      return widget;
    }));
    toast({ title: "Decision logged" });
  };

  const handleGenerateOutcome = (widgetId: string, decisionId: string) => {
    toast({
      title: "AI feature coming soon",
      description: "AI-generated alternate outcomes will be available in a future update"
    });
  };

  // Sound Signature handlers
  const handleAddSoundSignatureWidget = () => {
    setEditingSoundSignatureWidget(undefined);
    setSoundSignatureWidgetEditorOpen(true);
  };

  const handleEditSoundSignatureWidget = (widgetId: string) => {
    const widget = soundSignatureWidgets.find(w => w.id === widgetId);
    setEditingSoundSignatureWidget(widget);
    setSoundSignatureWidgetEditorOpen(true);
  };

  const handleSaveSoundSignatureWidget = (widgetData: Omit<SoundSignatureWidget, 'id'> & { id?: string }) => {
    if (widgetData.id) {
      setSoundSignatureWidgets(soundSignatureWidgets.map(w =>
        w.id === widgetData.id ? { ...w, ...widgetData } : w
      ));
    } else {
      const newWidget: SoundSignatureWidget = {
        ...widgetData,
        id: crypto.randomUUID(),
      };
      setSoundSignatureWidgets([...soundSignatureWidgets, newWidget]);
    }
    toast({ title: "Sound signature widget saved" });
  };

  const handleLogSoundSession = (
    widgetId: string,
    soundType: string,
    duration: number,
    productivity: number,
    mood: string,
    activity: string
  ) => {
    setSoundSignatureWidgets(soundSignatureWidgets.map(widget => {
      if (widget.id === widgetId) {
        const newSession = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          soundType,
          duration,
          productivity,
          mood,
          activityType: activity,
        };
        return {
          ...widget,
          soundSessions: [...widget.soundSessions, newSession].slice(-100),
        };
      }
      return widget;
    }));
    toast({ title: "Sound session logged", description: `${soundType} - ${productivity}/10` });
  };

  // Custom Theme handlers
  const handleOpenCustomThemeBuilder = () => {
    setTemplateTheme(undefined);
    setThemeToEdit(undefined); // Clear any existing theme to edit - we're creating new
    setEditingThemeId(undefined); // Clear any existing theme ID
    setIsCreatingNewTheme(true); // Mark that we're creating a new theme
    setCustomThemeBuilderOpen(true);
  };

  const handleEditCustomTheme = (themeToEditParam?: CustomTheme, themeId?: string) => {
    setTemplateTheme(undefined);
    setThemeToEdit(themeToEditParam); // Set the specific theme being edited
    setEditingThemeId(themeId); // Store the ID for proper update matching
    setIsCreatingNewTheme(false); // We're editing, not creating new
    setCustomThemeBuilderOpen(true);
  };

  const handleUseThemeAsTemplate = (preset: 'orchid' | 'jellyfish' | 'sunset' | 'bluebonnet' | 'ocean' | 'forest' | 'midnight' | 'candy') => {
    setTemplateTheme(preset);
    setCustomThemeBuilderOpen(true);
  };

  const handleSaveCustomTheme = (newTheme: CustomTheme) => {
    setCustomTheme(newTheme); // Automatically syncs via useSyncedStorage
    setTheme('custom');
    setTemplateTheme(undefined);

    toast({
      title: "✨ Custom theme saved",
      description: `${newTheme.name} will sync across all devices`
    });
  };

  const handleDeleteCustomTheme = () => {
    setCustomTheme(null);
    setTheme('orchid');
    toast({
      title: "Custom theme deleted",
      description: "Switched to Orchid Velvet theme"
    });
  };

  // Handler for applying a saved custom theme from the dropdown
  const handleApplyCustomTheme = (themeToApply: CustomTheme) => {
    setCustomTheme(themeToApply); // Update the active custom theme state
    // Note: ThemeSwitcher already calls onThemeChange('custom') after this
  };

  const handleAddCustomTab = () => {
    if (newTabName.trim()) {
      const newTab = {
        id: crypto.randomUUID(),
        name: newTabName.trim(),
      };
      setCustomTabs([...customTabs, newTab]);
      setNewTabName('');
      setNewTabDialogOpen(false);
      toast({ title: "Tab created", description: `${newTab.name} has been added` });
    }
  };

  const handleDeleteCustomTab = (tabId: string) => {
    setCustomTabs(customTabs.filter(tab => tab.id !== tabId));
    toast({ title: "Tab removed" });
  };

  const handleRenameCustomTab = (tabId: string, newName: string) => {
    if (!newName.trim()) return;
    setCustomTabs(customTabs.map(tab =>
      tab.id === tabId ? { ...tab, name: newName.trim() } : tab
    ));
    toast({ title: "Tab renamed" });
  };

  const handleMoveTabUp = (index: number) => {
    if (index === 0) return;
    const newTabs = [...customTabs];
    [newTabs[index - 1], newTabs[index]] = [newTabs[index], newTabs[index - 1]];
    setCustomTabs(newTabs);
  };

  const handleMoveTabDown = (index: number) => {
    if (index === customTabs.length - 1) return;
    const newTabs = [...customTabs];
    [newTabs[index], newTabs[index + 1]] = [newTabs[index + 1], newTabs[index]];
    setCustomTabs(newTabs);
  };

  // Dashboard Tab Handlers (for built-in tabs like Projects, Playbooks, Care)
  const handleRenameDashboardTab = (tabId: string, newName: string) => {
    if (!newName.trim()) return;
    setDashboardTabs(dashboardTabs.map(tab =>
      tab.id === tabId ? { ...tab, name: newName.trim() } : tab
    ));
    toast({ title: "Tab renamed" });
  };

  const handleToggleDashboardTabVisibility = (tabId: string) => {
    const tab = dashboardTabs.find(t => t.id === tabId);
    if (!tab || tab.isBuiltIn) return; // Can't hide Dashboard tab
    setDashboardTabs(dashboardTabs.map(t =>
      t.id === tabId ? { ...t, isVisible: !t.isVisible } : t
    ));
    toast({ 
      title: tab.isVisible ? "Tab hidden" : "Tab shown",
      description: `${tab.name} has been ${tab.isVisible ? 'hidden' : 'shown'}`
    });
  };

  const handleDeleteDashboardTab = (tabId: string) => {
    const tab = dashboardTabs.find(t => t.id === tabId);
    if (!tab || tab.isBuiltIn) return; // Can't delete Dashboard tab
    // For built-in feature tabs (projects, playbooks, care), just hide instead of delete
    if (['projects', 'playbooks', 'care'].includes(tab.key)) {
      handleToggleDashboardTabVisibility(tabId);
      return;
    }
    // For truly custom tabs, remove completely
    setDashboardTabs(dashboardTabs.filter(t => t.id !== tabId));
    toast({ title: "Tab removed" });
  };

  const handleAddDashboardTab = (name: string) => {
    if (!name.trim()) return;
    const maxOrder = Math.max(...dashboardTabs.map(t => t.order), 0);
    const newTab: DashboardTab = {
      id: crypto.randomUUID(),
      key: `custom-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      isBuiltIn: false,
      isVisible: true,
      order: maxOrder + 1,
    };
    setDashboardTabs([...dashboardTabs, newTab]);
    toast({ title: "Tab created", description: `${newTab.name} has been added` });
  };

  const handleMoveDashboardTabUp = (tabId: string) => {
    const sortedTabs = [...dashboardTabs].sort((a, b) => a.order - b.order);
    const index = sortedTabs.findIndex(t => t.id === tabId);
    if (index <= 1) return; // Can't move above Dashboard or if already second
    const newTabs = [...sortedTabs];
    const temp = newTabs[index].order;
    newTabs[index].order = newTabs[index - 1].order;
    newTabs[index - 1].order = temp;
    setDashboardTabs(newTabs);
  };

  const handleMoveDashboardTabDown = (tabId: string) => {
    const sortedTabs = [...dashboardTabs].sort((a, b) => a.order - b.order);
    const index = sortedTabs.findIndex(t => t.id === tabId);
    if (index === 0 || index === sortedTabs.length - 1) return; // Can't move Dashboard or if already last
    const newTabs = [...sortedTabs];
    const temp = newTabs[index].order;
    newTabs[index].order = newTabs[index + 1].order;
    newTabs[index + 1].order = temp;
    setDashboardTabs(newTabs);
  };

  const handleResetDashboardTabs = () => {
    setDashboardTabs(DEFAULT_DASHBOARD_TABS);
    toast({ title: "Tabs reset", description: "Dashboard tabs have been reset to defaults" });
  };

  const handleAskAI = (message: string) => {
    setInitialAIMessage(message);
    setIsAIAssistantOpen(true);
  };

  const handleOpenAIChat = (context: string) => {
    setInitialAIMessage(context);
    setIsAIAssistantOpen(true);
  };

  // Theme change handler - updates both local state AND database to prevent race condition
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme); // 1. Update UI immediately
    if (user) {
      savePreferences({ theme: newTheme }); // 2. Update Database Source of Truth
    }
  };

  const handleGenerateSchedule = () => {
    setInitialAIMessage("I've uploaded my work/class schedule and added my tasks. Please generate an optimized schedule for me.");
    setIsAIAssistantOpen(true);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      const isInputField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Cmd/Ctrl + K for AI Assistant
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isInputField) {
        e.preventDefault();
        setIsAIAssistantOpen(prev => !prev);
      }

      // Cmd/Ctrl + / for keyboard shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/' && !isInputField) {
        e.preventDefault();
        setKeyboardShortcutsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Remove AI-First Mode effect since we can't control AICommandBar externally

  return (
    <div className={cn("min-h-screen", isMobile && "pb-16")}>
      <DashboardHeader
        user={user}
        isPremium={isPremium}
        isAdmin={isAdmin}
        plan={plan}
        theme={theme}
        customTheme={customTheme}
        showSyncBanner={showSyncBanner}
        onSetSyncBanner={setShowSyncBanner}
        onSetEisenhowerOpen={setEisenhowerOpen}
        onSetChatPanelOpen={setIsChatPanelOpen}
        onSetTutorialOpen={setTutorialOpen}
        onThemeChange={handleThemeChange}
        onCustomThemeClick={handleOpenCustomThemeBuilder}
        onEditCustomTheme={handleEditCustomTheme}
        onApplyCustomTheme={handleApplyCustomTheme}
        onDeleteCustomTheme={handleDeleteCustomTheme}
        onUseAsTemplate={handleUseThemeAsTemplate}
      />

      {/* Active Intention Banner - persistent focus tracker */}
      {showIntentionBanner && activeIntention && (
        <ActiveIntentionBanner
          activeIntention={activeIntention}
          currentTask={activeIntentionTask}
          isPaused={isIntentionPaused}
          onComplete={completeIntention}
          onPause={pauseIntention}
          onResume={resumeIntention}
          onClear={clearIntention}
          getElapsedTime={getElapsedTime}
          formatElapsedTime={formatElapsedTime}
        />
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6" role="main">
        <StatsOverview
          onOpenScheduler={() => setSchedulerOpen(true)}
          tasks={tasks}
          playbooks={playbooks}
        />

        {/* Tabbed Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          {/* Widget Panel */}
          <WidgetPanel
            reminderWidgets={reminderWidgets}
            energyWidgets={energyWidgets}
            messengerWidgets={messengerWidgets}
            moodGardenWidgets={moodGardenWidgets}
            parallelUniverseWidgets={parallelUniverseWidgets}
            soundSignatureWidgets={soundSignatureWidgets}
            brainDumpWidgets={brainDumpWidgets}
            potionInventoryWidgets={potionInventoryWidgets}
            sunlightAnchorWidgets={sunlightAnchorWidgets}
            onAddWidget={handleAddWidget}
            onEditWidget={handleEditWidget}
            onDeleteWidget={handleDeleteWidget}
            onToggleWidgetItem={handleToggleWidgetItem}
            onResetWidget={handleResetWidget}
            onAddEnergyWidget={handleAddEnergyWidget}
            onEditEnergyWidget={handleEditEnergyWidget}
            onDeleteEnergyWidget={handleDeleteEnergyWidget}
            onLogEnergy={handleLogEnergy}
            onAddMessengerWidget={handleAddMessengerWidget}
            onEditMessengerWidget={handleEditMessengerWidget}
            onDeleteMessengerWidget={handleDeleteMessengerWidget}
            onCreateMessage={handleCreateMessage}
            onViewMessage={handleViewMessage}
            onAddMoodGardenWidget={handleAddMoodGardenWidget}
            onEditMoodGardenWidget={handleEditMoodGardenWidget}
            onDeleteMoodGardenWidget={handleDeleteMoodGardenWidget}
            onLogMood={handleLogMood}
            onAddParallelUniverseWidget={handleAddParallelUniverseWidget}
            onEditParallelUniverseWidget={handleEditParallelUniverseWidget}
            onDeleteParallelUniverseWidget={handleDeleteParallelUniverseWidget}
            onLogDecision={handleLogDecision}
            onGenerateOutcome={handleGenerateOutcome}
            onAddSoundSignatureWidget={handleAddSoundSignatureWidget}
            onEditSoundSignatureWidget={handleEditSoundSignatureWidget}
            onDeleteSoundSignatureWidget={handleDeleteSoundSignatureWidget}
            onLogSoundSession={handleLogSoundSession}
            onAddBrainDumpWidget={handleAddBrainDumpWidget}
            onDeleteBrainDumpWidget={handleDeleteBrainDumpWidget}
            onAddThought={handleAddThought}
            onAddPotionInventoryWidget={handleAddPotionInventoryWidget}
            onDeletePotionInventoryWidget={handleDeletePotionInventoryWidget}
            onUpdatePotionLevels={handleUpdatePotionLevels}
            onAddSunlightAnchorWidget={handleAddSunlightAnchorWidget}
            onDeleteSunlightAnchorWidget={handleDeleteSunlightAnchorWidget}
            onUpdateSunlightAnchorSettings={handleUpdateSunlightAnchorSettings}
          />
          <div className="flex items-center gap-2">
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:auto-cols-auto" style={{ gridTemplateColumns: `repeat(${dashboardTabs.filter(t => t.isVisible).length + customTabs.length}, minmax(0, 1fr))` }}>
              {dashboardTabs
                .filter(tab => tab.isVisible)
                .sort((a, b) => a.order - b.order)
                .map(tab => (
                  <TabsTrigger key={tab.id} value={tab.key}>
                    {tab.name}
                  </TabsTrigger>
                ))}
              {customTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              onClick={() => setNewTabDialogOpen(true)}
              size="icon"
              variant="outline"
              className="shrink-0"
              title="Add new tab"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setEditTabsDialogOpen(true)}
              size="icon"
              variant="outline"
              className="shrink-0"
              title="Manage tabs"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Main Workflow - Visual Timeline & Unified To-Do List */}
            {isMobile ? (
              <div className="pb-20">
                {mobileTab === 'focus' && (
                  <div className="space-y-4">
                    <Suspense fallback={<ComponentLoader />}>
                      <FocusTimer tasks={tasks} playbooks={playbooks} />
                    </Suspense>
                  </div>
                )}
                {mobileTab === 'timeline' && (
                  <ScheduleSection
                    timeBlocks={timeBlocks}
                    scheduledTasks={scheduledTasks}
                    tasks={tasks}
                    onAddTimeBlock={handleAddTimeBlock}
                    onUpdateTimeBlock={handleUpdateTimeBlock}
                    onDeleteTimeBlock={handleDeleteTimeBlock}
                    onAddTask={handleAddTask}
                  />
                )}
                {mobileTab === 'tasks' && (
                  showTimeConstraintView ? (
                    <Suspense fallback={<ComponentLoader />}>
                      <TimeConstraintTaskView
                        tasks={tasks}
                        onToggleComplete={handleToggleComplete}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                        onAskAI={handleAskAI}
                        showQuickActions={showQuickActions}
                      />
                    </Suspense>
                  ) : (
                    <TaskSection
                      tasks={tasks}
                      timeBlocks={timeBlocks}
                      userId={user?.id}
                      onAddTask={handleAddTask}
                      onBulkAddTasks={handleBulkAddTasks}
                      onToggleComplete={handleToggleComplete}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                      onPrioritize={handlePrioritizeTasks}
                      onScheduleTasks={handleScheduleTasks}
                      onAskAI={handleAskAI}
                      onBreakdownTask={handleBreakdownTask}
                      onOpenAIChat={handleOpenAIChat}
                      onStartIntention={startIntention}
                      activeIntentionId={activeIntention?.taskId}
                      showQuickActions={showQuickActions}
                      onToggleTimeConstraintView={() => setShowTimeConstraintView(!showTimeConstraintView)}
                      showTimeConstraintView={showTimeConstraintView}
                      onClearCompleted={handleClearCompletedTasks}
                      onClearAll={handleClearAllTasks}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <ScheduleSection
                  timeBlocks={timeBlocks}
                  scheduledTasks={scheduledTasks}
                  tasks={tasks}
                  onAddTimeBlock={handleAddTimeBlock}
                  onUpdateTimeBlock={handleUpdateTimeBlock}
                  onDeleteTimeBlock={handleDeleteTimeBlock}
                  onAddTask={handleAddTask}
                />
                {showTimeConstraintView ? (
                  <div className="lg:col-span-2">
                    <Suspense fallback={<ComponentLoader />}>
                      <TimeConstraintTaskView
                        tasks={tasks}
                        onToggleComplete={handleToggleComplete}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                        onAskAI={handleAskAI}
                        showQuickActions={showQuickActions}
                      />
                    </Suspense>
                  </div>
                ) : (
                  <TaskSection
                    tasks={tasks}
                    timeBlocks={timeBlocks}
                    userId={user?.id}
                    onAddTask={handleAddTask}
                    onBulkAddTasks={handleBulkAddTasks}
                    onToggleComplete={handleToggleComplete}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onPrioritize={handlePrioritizeTasks}
                    onScheduleTasks={handleScheduleTasks}
                    onAskAI={handleAskAI}
                    onOpenAIChat={handleOpenAIChat}
                    onStartIntention={startIntention}
                    activeIntentionId={activeIntention?.taskId}
                    showQuickActions={showQuickActions}
                    onToggleTimeConstraintView={() => setShowTimeConstraintView(!showTimeConstraintView)}
                    showTimeConstraintView={showTimeConstraintView}
                    onClearCompleted={handleClearCompletedTasks}
                    onClearAll={handleClearAllTasks}
                  />
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects">
            <Suspense fallback={<ComponentLoader />}>
              <ProjectsTab projects={projects} onAddProject={handleAddProject} />
            </Suspense>
          </TabsContent>

          <TabsContent value="playbooks" data-tutorial="playbooks">
            <Suspense fallback={<ComponentLoader />}>
              <PlaybooksTab
                playbooks={playbooks}
                onAddPlaybook={handleAddPlaybook}
                onUpdatePlaybook={handleUpdatePlaybook}
                onDeletePlaybook={handleDeletePlaybook}
                onReorderPlaybooks={handleReorderPlaybooks}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="care">
            <div className="space-y-6 bg-background/80 backdrop-blur-md rounded-xl p-6 border border-border/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Daily Routines</h2>
                  <p className="text-sm text-muted-foreground">Build consistency with structured routines</p>
                </div>
                <Button onClick={() => {
                  const newRoutine: Playbook = {
                    id: crypto.randomUUID(),
                    title: 'New Routine',
                    description: 'A daily routine to help you stay organized',
                    category: 'productivity',
                    steps: [],
                    isTemplate: false,
                    linkedTaskIds: [],
                    resetOnRecurrence: false,
                    createdAt: new Date().toISOString(),
                    isRoutine: true,
                    routineType: 'custom',
                    streakData: {
                      currentStreak: 0,
                      longestStreak: 0,
                      completionHistory: []
                    }
                  };
                  handleAddPlaybook(newRoutine);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Routine
                </Button>
              </div>

              {/* Routine Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['morning', 'evening', 'work-start', 'work-end', 'custom'].map(type => {
                  const routinesOfType = playbooks.filter(p => p.isRoutine && p.routineType === type);

                  const typeInfo = {
                    morning: { title: '🌅 Morning Routines', desc: 'Start your day right' },
                    evening: { title: '🌙 Evening Routines', desc: 'Wind down and prepare' },
                    'work-start': { title: '💼 Work Start', desc: 'Get ready to focus' },
                    'work-end': { title: '🏠 Work End', desc: 'Transition from work' },
                    custom: { title: '✨ Custom Routines', desc: 'Your personalized flows' }
                  }[type] || { title: type, desc: '' };

                  return (
                    <div key={type} className="space-y-2 bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/40">
                      <div>
                        <h3 className="font-semibold text-sm">{typeInfo.title}</h3>
                        <p className="text-xs text-muted-foreground">{typeInfo.desc}</p>
                      </div>

                      {routinesOfType.length === 0 ? (
                        <div className="text-xs text-muted-foreground italic p-4 border border-dashed rounded-lg">
                          No routines yet
                        </div>
                      ) : (
                        routinesOfType.map(routine => (
                          <Button
                            key={routine.id}
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => {
                              setSelectedRoutine(routine);
                              setRoutineViewerOpen(true);
                            }}
                          >
                            <span className="truncate">{routine.title}</span>
                            {routine.streakData && routine.streakData.currentStreak > 0 && (
                              <span className="ml-2 text-xs text-orange-600 flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                {routine.streakData.currentStreak}
                              </span>
                            )}
                          </Button>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>

              {/* All Non-Routine Playbooks as Potential Routines */}
              {playbooks.filter(p => !p.isRoutine).length > 0 && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-2">Convert Playbooks to Routines</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    These playbooks can be converted to routines with streak tracking
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {playbooks.filter(p => !p.isRoutine).slice(0, 6).map(playbook => (
                      <Button
                        key={playbook.id}
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => {
                          const updates: Partial<Playbook> = {
                            isRoutine: true,
                            routineType: 'custom',
                            streakData: {
                              currentStreak: 0,
                              longestStreak: 0,
                              completionHistory: []
                            }
                          };
                          handleUpdatePlaybook(playbook.id, updates);
                          toast({
                            title: '✨ Converted to Routine',
                            description: `${playbook.title} is now a tracked routine!`,
                          });
                        }}
                      >
                        {playbook.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {customTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id}>
              <div className="text-center py-12 bg-card rounded-lg border-2 border-border">
                <h3 className="text-xl font-semibold mb-2">{tab.name}</h3>
                <p className="text-muted-foreground">Custom content for this tab</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Onboarding Tutorial */}
      <Suspense fallback={null}>
        <OnboardingTutorial
          open={tutorialOpen}
          onOpenChange={setTutorialOpen}
        />
      </Suspense>

      {/* New Tab Dialog */}
      <Dialog open={newTabDialogOpen} onOpenChange={setNewTabDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tab</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tab-name">Tab Name</Label>
              <Input
                id="tab-name"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="My Custom Tab"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomTab();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTabDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomTab}>Create Tab</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tabs Dialog */}
      <Dialog open={editTabsDialogOpen} onOpenChange={setEditTabsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Tabs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Dashboard Tabs Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Main Tabs</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetDashboardTabs}
                  className="h-7 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
              <div className="space-y-2">
                {dashboardTabs
                  .sort((a, b) => a.order - b.order)
                  .map((tab) => (
                    <div 
                      key={tab.id} 
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border bg-card",
                        !tab.isVisible && "opacity-50"
                      )}
                    >
                      {editingTabId === tab.id ? (
                        <Input
                          value={editingTabName}
                          onChange={(e) => setEditingTabName(e.target.value)}
                          onBlur={() => {
                            if (editingTabName.trim()) {
                              handleRenameDashboardTab(tab.id, editingTabName);
                            }
                            setEditingTabId(null);
                            setEditingTabName('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editingTabName.trim()) {
                                handleRenameDashboardTab(tab.id, editingTabName);
                              }
                              setEditingTabId(null);
                              setEditingTabName('');
                            } else if (e.key === 'Escape') {
                              setEditingTabId(null);
                              setEditingTabName('');
                            }
                          }}
                          autoFocus
                          className="flex-1"
                        />
                      ) : (
                        <>
                          <span className="flex-1 font-medium">
                            {tab.name}
                            {tab.isBuiltIn && (
                              <span className="ml-2 text-xs text-muted-foreground">(locked)</span>
                            )}
                          </span>
                          {!tab.isBuiltIn && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingTabId(tab.id);
                                setEditingTabName(tab.name);
                              }}
                              className="h-8 w-8"
                              title="Rename"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                      {!tab.isBuiltIn && editingTabId !== tab.id && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleMoveDashboardTabUp(tab.id)}
                            className="h-8 w-8"
                            title="Move up"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleMoveDashboardTabDown(tab.id)}
                            className="h-8 w-8"
                            title="Move down"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleDashboardTabVisibility(tab.id)}
                            className="h-8 w-8"
                            title={tab.isVisible ? "Hide tab" : "Show tab"}
                          >
                            {tab.isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Custom Tabs Section */}
            {customTabs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Custom Tabs</h4>
                <div className="space-y-2">
                  {customTabs.map((tab, index) => (
                    <div key={tab.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                      {editingTabId === tab.id ? (
                        <Input
                          value={editingTabName}
                          onChange={(e) => setEditingTabName(e.target.value)}
                          onBlur={() => {
                            if (editingTabName.trim()) {
                              handleRenameCustomTab(tab.id, editingTabName);
                            }
                            setEditingTabId(null);
                            setEditingTabName('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editingTabName.trim()) {
                                handleRenameCustomTab(tab.id, editingTabName);
                              }
                              setEditingTabId(null);
                              setEditingTabName('');
                            } else if (e.key === 'Escape') {
                              setEditingTabId(null);
                              setEditingTabName('');
                            }
                          }}
                          autoFocus
                          className="flex-1"
                        />
                      ) : (
                        <>
                          <span className="flex-1 font-medium">{tab.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingTabId(tab.id);
                              setEditingTabName(tab.name);
                            }}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveTabUp(index)}
                          disabled={index === 0}
                          className="h-8 w-8"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveTabDown(index)}
                          disabled={index === customTabs.length - 1}
                          className="h-8 w-8"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteCustomTab(tab.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setEditTabsDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Widget Editor Dialogs */}
      <Suspense fallback={null}>
        <ReminderWidgetEditor
          open={widgetEditorOpen}
          onClose={() => setWidgetEditorOpen(false)}
          widget={editingWidget}
          onSave={handleSaveWidget}
        />

        <EnergyTaskWidgetEditor
          open={energyWidgetEditorOpen}
          onClose={() => setEnergyWidgetEditorOpen(false)}
          widget={editingEnergyWidget}
          onSave={handleSaveEnergyWidget}
        />

        <FutureSelfMessengerEditor
          open={messengerWidgetEditorOpen}
          onClose={() => setMessengerWidgetEditorOpen(false)}
          widget={editingMessengerWidget}
          mode={messengerEditorMode}
          onSave={handleSaveMessengerWidget}
          onSaveMessage={handleSaveMessage}
        />

        <MoodGardenWidgetEditor
          open={moodGardenWidgetEditorOpen}
          onOpenChange={setMoodGardenWidgetEditorOpen}
          widget={editingMoodGardenWidget}
          onSave={handleSaveMoodGardenWidget}
        />

        <ParallelUniverseWidgetEditor
          open={parallelUniverseWidgetEditorOpen}
          onOpenChange={setParallelUniverseWidgetEditorOpen}
          widget={editingParallelUniverseWidget}
          onSave={handleSaveParallelUniverseWidget}
        />

        <SoundSignatureWidgetEditor
          open={soundSignatureWidgetEditorOpen}
          onOpenChange={setSoundSignatureWidgetEditorOpen}
          widget={editingSoundSignatureWidget}
          onSave={handleSaveSoundSignatureWidget}
        />

        <CustomThemeBuilder
          open={customThemeBuilderOpen}
          onOpenChange={(open) => {
            setCustomThemeBuilderOpen(open);
            if (!open) {
              setThemeToEdit(undefined); // Clear theme to edit when closing
              setEditingThemeId(undefined); // Clear theme ID when closing
              setIsCreatingNewTheme(false); // Reset creating new flag
            }
          }}
          onSave={handleSaveCustomTheme}
          existingTheme={
            // Only pass existingTheme when EDITING (not creating new)
            // themeToEdit is set when clicking Edit button on a saved theme
            isCreatingNewTheme ? undefined : themeToEdit
          }
          existingThemeId={isCreatingNewTheme ? undefined : editingThemeId}
          templateTheme={templateTheme}
        />

        <CalendarScheduler
          open={schedulerOpen}
          onOpenChange={setSchedulerOpen}
          tasks={tasks}
          scheduledTasks={scheduledTasks}
          timeBlocks={timeBlocks}
          onScheduleTask={handleScheduleTask}
        />

        <EisenhowerMatrix
          open={eisenhowerOpen}
          onOpenChange={setEisenhowerOpen}
          tasks={[...tasks, ...priorities]}
          onUpdateTask={handleUpdateTaskById}
        />

        {showAI && (
          <AIAssistant
            open={isAIAssistantOpen}
            onOpenChange={setIsAIAssistantOpen}
            onUpdateTask={handleUpdateTaskById}
            onUpdateTimeBlock={handleUpdateTimeBlock}
            onAddTimeBlock={handleAddTimeBlock}
            onAddTask={handleAddTask}
            tasks={[...tasks, ...priorities]}
            timeBlocks={timeBlocks}
            playbooks={playbooks}
            onAddPlaybook={handleAddPlaybook}
            onUpdatePlaybook={handleUpdatePlaybook}
            initialMessage={initialAIMessage}
          />
        )}

        <KeyboardShortcutsDialog
          open={keyboardShortcutsOpen}
          onOpenChange={setKeyboardShortcutsOpen}
        />

        <ProfileSetupDialog
          open={profileSetupOpen}
          onOpenChange={(open) => {
            setProfileSetupOpen(open);
            if (!open) setHasProfile(true);
          }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ChatPanel
          isOpen={isChatPanelOpen}
          onClose={() => setIsChatPanelOpen(false)}
          tasks={tasks}
          timeBlocks={timeBlocks}
          playbooks={playbooks}
          onUpdateTask={handleUpdateTaskById}
          onUpdateTimeBlock={handleUpdateTimeBlock}
          onAddTimeBlock={handleAddTimeBlock}
          onAddTask={handleAddTask}
          onAddPlaybook={handleAddPlaybook}
          onUpdatePlaybook={handleUpdatePlaybook}
        />
      </Suspense>

      {isMobile && <MobileTabBar activeTab={mobileTab} onTabChange={setMobileTab} />}

      {/* Routine Template Viewer */}
      {selectedRoutine && (
        <Suspense fallback={null}>
          <RoutineTemplate
            open={routineViewerOpen}
            onOpenChange={setRoutineViewerOpen}
            playbook={selectedRoutine}
            onUpdatePlaybook={(updated) => {
              handleUpdatePlaybook(updated.id, updated);
              setSelectedRoutine(updated);
            }}
          />
        </Suspense>
      )}

      {/* Command Palette (Cmd+K) */}
      <Suspense fallback={null}>
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          onAddTask={(title, estimatedMinutes, taskType) => {
            handleAddTask(title, estimatedMinutes, taskType);
          }}
          onOpenAIChat={() => setIsAIAssistantOpen(true)}
          onOpenTimer={() => setMobileTab('timeline')}
          onOpenFocusMode={() => setFocusModeOpen(true)}
          onToggleTheme={() => setCustomThemeBuilderOpen(true)}
          tasks={tasks}
          currentTab={activeTab}
          onChangeTab={setActiveTab}
        />
      </Suspense>

      {/* Focus Mode */}
      <Suspense fallback={null}>
        <FocusMode
          isOpen={focusModeOpen}
          onClose={() => setFocusModeOpen(false)}
          task={focusModeTask}
          onCompleteTask={(taskId) => {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: true } : t));
            toast({ title: "Task completed!", description: "Great focus session!" });
          }}
          tasks={tasks.filter(t => !t.completed)}
          onSelectTask={(task) => setFocusModeTask(task)}
        />
      </Suspense>

      {/* Daily Planning Dialog */}
      {dailyPlanningOpen && (
        <Suspense fallback={null}>
          <DailyPlanningDialog
            open={dailyPlanningOpen}
            onOpenChange={setDailyPlanningOpen}
            tasks={tasks}
            onPlanComplete={handleDailyPlanningComplete}
            availableMinutesToday={480}
          />
        </Suspense>
      )}

      {/* Daily Review Prompt */}
      {dailyReviewOpen && (
        <Suspense fallback={null}>
          <DailyReviewPrompt
            tasks={tasks}
            onClose={() => {
              setDailyReviewOpen(false);
              setLastReviewDate(new Date().toISOString().split('T')[0]);
            }}
            onAddTask={(title) => handleAddTask(title)}
            lastReviewDate={lastReviewDate}
            onSaveReview={(date, notes) => {
              setLastReviewDate(date);
              if (notes) {
                toast({ title: "Review saved", description: "Good night! See you tomorrow." });
              }
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Index;

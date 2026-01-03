export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

// Time estimation tracking for training estimation skills
export interface EstimationRecord {
  id: string;
  estimatedMinutes: number;
  actualMinutes: number;
  completedAt: string; // ISO timestamp
  difference: number; // actualMinutes - estimatedMinutes (positive = over, negative = under)
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  projectId?: string;
  focusTimeMinutes?: number;
  estimatedMinutes?: number;
  recurring?: 'none' | 'daily' | 'weekly';
  colorTag?: string;
  createdAt: string;
  linkedPlaybookId?: string;
  subtasks?: SubTask[];
  notes?: string;
  eisenhowerQuadrant?: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';
  course?: string;
  type?: 'daily' | 'ongoing';
  taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other';
  // Time constraint fields
  timeConstraint?: 'business-hours' | 'anytime' | 'morning' | 'evening' | 'custom';
  customTimeWindow?: {
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  };
  energyLevel?: 'high' | 'medium' | 'low'; // Energy required for this task
  noiseLevel?: 'quiet' | 'normal' | 'noisy'; // Noise level of this task (for quiet hours filtering)
  // Time estimation tracking
  actualMinutes?: number; // Actual time spent (recorded after timer completion)
  estimationHistory?: EstimationRecord[]; // History of estimate vs actual for this task
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
  createdAt: string;
}

// Dashboard Tab Configuration
export interface DashboardTab {
  id: string;
  key: string; // Used for routing (e.g., 'dashboard', 'projects', 'playbooks', 'care')
  name: string; // Display name
  icon?: string; // Optional icon
  isBuiltIn: boolean; // true for Dashboard (cannot be deleted)
  isVisible: boolean; // Whether to show this tab
  order: number; // Display order
}

export type Theme = 'orchid' | 'jellyfish' | 'sunset' | 'bluebonnet' | 'ocean' | 'forest' | 'midnight' | 'candy' | 'custom';

export interface CustomTheme {
  name: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
  };
  backgroundImage?: {
    url: string;
    size: 'cover' | 'contain' | 'auto' | 'stretch';
    position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y' | 'space' | 'round';
    attachment: 'scroll' | 'fixed';
    opacity: number;
    blur: number;
    overlayColor: string;
    overlayOpacity: number;
    filter: {
      grayscale: number;
      sepia: number;
      brightness: number;
      contrast: number;
      saturate: number;
    };
  };
}

export interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  totalTime: number;
  currentTaskId?: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // "HH:MM" format (e.g., "07:00")
  endTime: string;   // "HH:MM" format (e.g., "21:00")
  type: 'main' | 'dedicated'; // left side vs right side of timeline
  scheduleType: 'weekday' | 'weekend' | 'everyday';
  color?: string; // optional custom color
  createdAt: string;
}

export interface ScheduledTask {
  id: string;
  taskId: string; // links to Task.id
  blockId: string; // which TimeBlock it belongs to
  date: string; // YYYY-MM-DD format
  startTime?: string; // optional specific time within block
  estimatedMinutes?: number;
}

export interface TimedTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  completed: boolean;
  order: number;
  linkedTaskId?: string;
}

export interface TimerSession {
  id: string;
  taskId?: string;
  startTime: string;
  endTime?: string;
  actualMinutes?: number;
  date: string;
  timerType: 'interval' | 'sequence' | 'flowtime' | 'chime' | 'tomato';
}

export interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  estimatedMinutes?: number;
  completed: boolean;
  order: number;
  tips?: string[];
  // Routine-specific fields
  flexibility?: 'essential' | 'recommended' | 'optional'; // How flexible is this step?
  habitStack?: {
    before?: string; // Habit to do before this step
    after?: string;  // Habit to do after this step
  };
  timerEnabled?: boolean; // Whether to auto-start timer for this step
}

export interface Playbook {
  id: string;
  title: string;
  description?: string;
  category: string;
  steps: PlaybookStep[];
  isTemplate: boolean;
  linkedTaskIds: string[];
  resetOnRecurrence: boolean;
  createdAt: string;
  order?: number;
  // Routine-specific fields
  isRoutine?: boolean; // Is this a routine template?
  routineType?: 'morning' | 'evening' | 'work-start' | 'work-end' | 'custom';
  streakData?: {
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate?: string;
    completionHistory: { date: string; completed: boolean; skippedOptional: number }[];
  };
}

export interface ReminderWidget {
  id: string;
  title: string;
  description?: string;
  items: ReminderItem[];
  resetSchedule: 'none' | 'daily' | 'weekly' | 'monthly';
  lastResetDate?: string;
  createdAt: string;
}

export interface ReminderItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

// Energy-Task Harmony Widget
export interface EnergyLog {
  id: string;
  timestamp: string;
  level: number; // 1-10
  category: 'mental' | 'physical' | 'creative' | 'social';
  note?: string;
}

export interface EnergyTaskWidget {
  id: string;
  type: 'energy-task-harmony';
  title: string;
  energyLogs: EnergyLog[];
  taskSuggestionsEnabled: boolean;
  notificationsEnabled: boolean;
  trackedCategories: Array<'mental' | 'physical' | 'creative' | 'social'>;
  linkedTasks: Array<{
    taskId: string;
    taskTitle: string;
    optimalEnergy: number;
    preferredCategory: 'mental' | 'physical' | 'creative' | 'social';
  }>;
}

// Future-Self Messenger Widget
export interface FutureSelfMessage {
  id: string;
  content: string;
  type: 'text' | 'note';
  createdAt: string;
  deliveryTrigger: 'date' | 'achievement' | 'condition';
  deliveryDate?: string;
  deliveryCondition?: string;
  delivered: boolean;
  deliveredAt?: string;
  tags: string[];
}

export interface FutureSelfMessengerWidget {
  id: string;
  type: 'future-self-messenger';
  title: string;
  messages: FutureSelfMessage[];
  aiDeliveryEnabled: boolean;
}

// Mood Garden Widget
export interface MoodEntry {
  id: string;
  timestamp: string;
  emotion: string;
  intensity: number; // 1-10
  note?: string;
}

export interface Plant {
  id: string;
  type: string;
  health: number;
  lastWatered: string;
  stage: 'seed' | 'sprout' | 'growing' | 'blooming';
}

export interface MoodGardenWidget {
  id: string;
  type: 'mood-garden';
  title: string;
  moodEntries: MoodEntry[];
  plants: Plant[];
  trackedEmotions: string[];
}

// Parallel Universe Widget
export interface Decision {
  id: string;
  timestamp: string;
  question: string;
  chosenOption: string;
  alternatives: string[];
  context?: string;
}

export interface AlternateOutcome {
  id: string;
  decisionId: string;
  alternativePath: string;
  aiGeneratedOutcome: string;
  generatedAt: string;
}

export interface ParallelUniverseWidget {
  id: string;
  type: 'parallel-universe';
  title: string;
  decisions: Decision[];
  alternateOutcomes: AlternateOutcome[];
  aiEnabled: boolean;
}

// Sound Signature Widget
export interface SoundSession {
  id: string;
  timestamp: string;
  soundType: string;
  duration: number;
  productivity: number; // 1-10
  mood: string;
  activityType: string;
}

export interface PlaylistRecommendation {
  id: string;
  name: string;
  forActivity: string;
  basedOnSessions: string[];
  confidence: number;
}

export interface SoundSignatureWidget {
  id: string;
  type: 'sound-signature';
  title: string;
  soundSessions: SoundSession[];
  playlists: PlaylistRecommendation[];
  trackedActivities: string[];
}

// Brain Dump Widget - for externalizing intrusive thoughts
export interface BrainDumpThought {
  id: string;
  content: string;
  timestamp: string;
}

export interface BrainDumpWidget {
  id: string;
  type: 'brain-dump';
  title: string;
  thoughts: BrainDumpThought[];
}

// Potion Inventory Widget - gamified wellness tracker (Food/Water/Sleep)
export interface MealSchedule {
  breakfast: string;    // "07:00" format
  morningSnack: string; // "10:00" format
  lunch: string;        // "12:30" format
  afternoonSnack: string; // "15:00" format
  dinner: string;       // "18:30" format
  bedtime: string;      // "22:00" format
}

export interface PotionInventoryWidget {
  id: string;
  type: 'potion-inventory';
  title: string;
  // Levels represent: Food (hunger), Water (hydration), Sleep (energy)
  foodLevel: number;    // 0-100 - decays between meals
  waterLevel: number;   // 0-100 - decays throughout the day
  sleepLevel: number;   // 0-100 - decays from wake time, resets on sleep
  // Last refill times
  lastFoodTime: string;
  lastWaterTime: string;
  lastSleepTime: string; // When user went to bed
  wakeTime: string;      // When user woke up
  // Settings
  mealSchedule: MealSchedule;
  useCustomSchedule: boolean;
  decayEnabled: boolean;
  // Legacy fields for backwards compatibility
  healthLevel?: number;
  manaLevel?: number;
  staminaLevel?: number;
  lastDecayTime?: string;
}

// Sunlight Anchor Widget - visual time awareness with geolocation
export interface SunlightAnchorWidget {
  id: string;
  type: 'sunlight-anchor';
  title: string;
  // Location settings
  useGeolocation: boolean;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  // Manual override times (used if geolocation disabled or failed)
  manualSunrise?: string; // "06:30" format
  manualSunset?: string;  // "19:30" format
  // User schedule
  wakeTime?: string;      // "07:00" format
  sleepTime?: string;     // "22:00" format
  // Cached sunrise/sunset for today
  cachedSunrise?: string;
  cachedSunset?: string;
  lastLocationUpdate?: string;
}

// Active Intention Banner - for focus tracking and intention hijacking prevention
export interface IntentionInterruption {
  id: string;
  note: string;
  timestamp: string;
}

export interface ActiveIntention {
  taskId: string;
  taskName: string;
  startedAt: string; // ISO timestamp
  isPaused: boolean;
  pausedAt: string | null; // ISO timestamp when paused
  totalPausedTime: number; // Total milliseconds spent paused
  interruptions: IntentionInterruption[];
}

// Time Zone Settings - for Daily Flow Timeline
export interface TimeZone {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  color: string;     // CSS color value
  icon?: string;     // Lucide icon name
  allowedTaskTypes?: Array<'school' | 'work' | 'home' | 'appointment' | 'call' | 'other'>;
  allowedNoiseLevels?: Array<'quiet' | 'normal' | 'noisy'>;
  isBuiltIn?: boolean; // True for system zones like quiet hours, business hours
}

export interface TimeZoneSettings {
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format (e.g., "22:00")
    endTime: string;   // HH:MM format (e.g., "07:00")
  };
  businessHours: {
    enabled: boolean;
    startTime: string; // HH:MM format (e.g., "08:00")
    endTime: string;   // HH:MM format (e.g., "17:00")
    weekdaysOnly: boolean;
  };
  customZones: TimeZone[];
}

// ============ ROUTINE TYPES ============

// A single step within a routine
export interface RoutineStep {
  id: string;
  name: string;
  estimatedMinutes: number;
  actualMinutes?: number; // filled in after completion
  notes?: string; // optional instructions or reminders
  isFlexible: boolean; // can this step be reordered by user?
  order: number; // position in sequence
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

// A routine template (reusable)
export interface Routine {
  id: string;
  name: string;
  description?: string;
  icon?: string; // emoji or icon name
  color?: string; // for visual distinction on timeline

  // Timing
  totalEstimatedMinutes: number; // calculated from steps
  anchorType: 'fixed_start' | 'flexible' | 'end_by';
  anchorTime?: string; // HH:MM format, e.g., "07:00"

  // Recurrence
  repeatSchedule?: {
    type: 'daily' | 'weekdays' | 'weekends' | 'specific_days' | 'none';
    days?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  };

  // Content
  steps: RoutineStep[];

  // Metadata
  isTemplate: boolean; // true = reusable template, false = one-time routine
  category?: 'morning' | 'work' | 'evening' | 'errand' | 'self_care' | 'custom';
  createdAt: string; // ISO timestamp
  updatedAt: string;
  lastUsedAt?: string;
  timesCompleted: number;

  // Settings
  autoAdvance: boolean; // automatically start next step when timer ends
  showNotifications: boolean;
  allowSkipping: boolean;
}

// An instance of a routine placed on a specific day's schedule
export interface ScheduledRoutine {
  id: string;
  routineId: string; // references the Routine template
  date: string; // YYYY-MM-DD
  scheduledStartTime: string; // HH:MM
  actualStartTime?: string;
  actualEndTime?: string;

  // Override the template's steps for this instance
  steps: RoutineStep[]; // copy of steps with instance-specific status/actualMinutes

  status: 'scheduled' | 'in_progress' | 'completed' | 'partially_completed' | 'skipped';

  // Execution tracking
  currentStepIndex: number;
  pausedAt?: string; // if routine was paused mid-execution

  // Post-completion
  totalActualMinutes?: number;
  notes?: string; // user can add notes after completing
}

// For tracking routine execution in real-time
export interface ActiveRoutineState {
  scheduledRoutineId: string;
  routineName: string;
  currentStep: RoutineStep;
  currentStepIndex: number;
  totalSteps: number;
  stepStartedAt: string; // ISO timestamp
  stepElapsedSeconds: number;
  isPaused: boolean;
  completedSteps: number;
  skippedSteps: number;
}

// Day template (save entire day's schedule)
export interface DayTemplate {
  id: string;
  name: string;
  description?: string;

  // What's in this template
  timeBlocks: {
    startTime: string; // HH:MM
    endTime: string;
    type: 'routine' | 'time_block' | 'task_block';
    routineId?: string; // if type is 'routine'
    blockName?: string; // if type is 'time_block', e.g., "Deep Work"
    color?: string;
  }[];

  // When to suggest this template
  suggestedFor?: 'weekday' | 'weekend' | 'any';

  createdAt: string;
  updatedAt: string;
  timesUsed: number;
}

// ============ ROUTINE PRESETS (for AI/templates) ============

export interface RoutinePreset {
  id: string;
  name: string;
  description: string;
  category: Routine['category'];
  estimatedMinutes: number;
  steps: Omit<RoutineStep, 'id' | 'status' | 'actualMinutes'>[]; // template steps without runtime fields
  tags: string[];
}

// For the routine builder form
export interface RoutineFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  anchorType: Routine['anchorType'];
  anchorTime: string;
  repeatSchedule: Routine['repeatSchedule'];
  steps: Omit<RoutineStep, 'status' | 'actualMinutes'>[];
  autoAdvance: boolean;
  showNotifications: boolean;
  allowSkipping: boolean;
  category: Routine['category'];
}

// For time estimation history
export interface RoutineCompletionRecord {
  id: string;
  routineId: string;
  date: string;
  estimatedMinutes: number;
  actualMinutes: number;
  stepsCompleted: number;
  stepsSkipped: number;
  stepBreakdown: {
    stepName: string;
    estimated: number;
    actual: number;
    wasSkipped: boolean;
  }[];
}

// Storage keys for localStorage
export const ROUTINE_STORAGE_KEYS = {
  ROUTINES: 'neurulae-routines',
  SCHEDULED_ROUTINES: 'neurulae-scheduled-routines',
  ACTIVE_ROUTINE: 'neurulae-active-routine',
  DAY_TEMPLATES: 'neurulae-day-templates',
  ROUTINE_HISTORY: 'neurulae-routine-history',
  ROUTINE_PRESETS: 'neurulae-routine-presets',
  NOTIFICATION_STATE: 'neurulae-routine-notification-state',
  SETTINGS: 'neurulae-routine-settings',
} as const;

// Routine settings interface
export interface RoutineSettings {
  enableNotifications: boolean;
  reminderMinutesBefore: number;
  showOverdueReminders: boolean;
  autoStartOnTime: boolean;
  defaultBufferMinutes: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// ============ NEURODIVERGENT-FOCUSED TYPES ============

// AI Personality for neurodivergent-friendly coaching
export type AIPersonality = 'warm' | 'direct' | 'playful';

export interface AIPersonalityOption {
  id: AIPersonality;
  name: string;
  description: string;
  sampleResponse: string;
}

// Anchor Point System (Simple Triggers Only)
export interface AnchorPoint {
  id: string;
  name: string;

  // Simple trigger: EITHER time-based OR event-based (not both, no complex logic)
  triggerType: 'time' | 'event';

  // For time-based: "07:00" format
  triggerTime?: string;

  // For event-based: simple string like "after morning coffee", "when partner leaves"
  triggerEvent?: string;

  // How reliable is this anchor? (helps AI make better suggestions)
  reliability: 'rock-solid' | 'usually' | 'sometimes';

  // What attaches to this anchor
  linkedRoutineIds: string[];
  attachmentPosition: 'before' | 'after';

  // Metadata
  category: 'morning' | 'midday' | 'evening' | 'flex';
  isActive: boolean;
  createdAt: string;
}

// Natural patterns discovered during onboarding
export interface NaturalPattern {
  id: string;
  activity: string;
  typicalTime?: string;
  reliability: 'always' | 'usually' | 'sometimes';
  notes?: string;
}

// Friction points - where transitions are hard
export interface FrictionPoint {
  id: string;
  transition: string; // "getting out of bed", "starting work"
  severity: 'minor' | 'moderate' | 'major';
  currentStrategies?: string[];
  aiSuggestions?: string[];
}

// Energy patterns throughout the day
export interface EnergyPattern {
  peakHours: string[]; // ["09:00", "14:00"]
  lowHours: string[];
  variability: 'predictable' | 'somewhat-variable' | 'highly-variable';
}

// Onboarding Flow State
export interface OnboardingFlowState {
  currentStep: 'welcome' | 'personality' | 'patterns' | 'anchors' | 'friction' | 'first-routine' | 'complete';
  aiPersonality: AIPersonality;
  collectedData: {
    naturalPatterns: NaturalPattern[];
    anchorPoints: AnchorPoint[];
    frictionPoints: FrictionPoint[];
    transitionStruggles: string[];
    energyPatterns: EnergyPattern;
  };
  completedAt?: string;
  canResumeFrom?: string; // step to resume from if user exits early
}

// Enhanced Routine for "Good Enough" versions
export interface RoutineVariant {
  id: string;
  parentRoutineId: string; // The full routine this is a variant of
  name: string; // "Low energy morning", "Minimal version"
  energyLevel: 'high' | 'medium' | 'low' | 'minimal';
  simplifiedSteps: string[]; // Simplified step descriptions
  timeMultiplier: number; // 0.5 = half the time, 2 = double the time
  skipThreshold: number; // Energy level (1-10) at or below which this variant is suggested
  aiSuggestions?: string[]; // AI-generated simplification tips
  createdAt: string;
}


// Check-in System
export interface CheckIn {
  id: string;
  type: 'daily' | 'weekly' | 'ad-hoc';
  scheduledFor: string; // ISO timestamp
  completedAt?: string;

  responses: {
    whatWorked: string[];
    whatDidnt: string[];
    energyLevel: number; // 1-10
    overallFeeling: 'great' | 'okay' | 'struggling';
    freeformNotes?: string;
  };

  aiInsights?: string[];
  suggestedAdjustments?: RoutineAdjustment[];
}

export interface RoutineAdjustment {
  routineId: string;
  type: 'timing' | 'steps' | 'anchor' | 'remove';
  suggestion: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

// Environment Design Suggestions
export interface EnvironmentSuggestion {
  id: string;
  category: 'physical' | 'digital' | 'social';
  suggestion: string;
  linkedRoutineId?: string;
  linkedTransition?: string;
  status: 'suggested' | 'trying' | 'kept' | 'rejected';
  effectivenessRating?: number; // 1-5
  notes?: string;
  createdAt: string;
}

// Pattern insights from check-ins and usage data
export interface PatternInsight {
  id: string;
  type: 'success' | 'struggle' | 'suggestion';
  description: string;
  relatedRoutineIds?: string[];
  relatedAnchorIds?: string[];
  confidence: 'high' | 'medium' | 'low';
  generatedAt: string;
  dismissed: boolean;
}

// Transition support prompt (shown when starting a new task/routine)
export interface TransitionPrompt {
  id: string;
  message: string;
  environmentChecklist?: string[];
  breathingPrompt?: boolean;
  linkedRoutineId?: string;
}

// Storage keys for neurodivergent features
export const ND_STORAGE_KEYS = {
  ANCHOR_POINTS: 'neurulae-anchor-points',
  ONBOARDING_FLOW: 'neurulae-nd-onboarding',
  ROUTINE_VARIANTS: 'neurulae-routine-variants',
  CHECK_INS: 'neurulae-check-ins',
  ENVIRONMENT_SUGGESTIONS: 'neurulae-env-suggestions',
  PATTERN_INSIGHTS: 'neurulae-pattern-insights',
  AI_PERSONALITY: 'neurulae-ai-personality',
  TRANSITION_PROMPTS: 'neurulae-transition-prompts',
} as const;

// AI Personality options with sample responses
export const AI_PERSONALITIES: AIPersonalityOption[] = [
  {
    id: 'warm',
    name: 'Warm & Validating',
    description: 'Acknowledges struggles, celebrates small wins, supportive',
    sampleResponse: "That's a really good observation about your mornings. Let's work with what's already happening naturally."
  },
  {
    id: 'direct',
    name: 'Direct & Practical',
    description: 'Minimal emotional language, focused on concrete steps',
    sampleResponse: "Morning anchor identified: coffee at 8am. Next: pick one small task to attach to it."
  },
  {
    id: 'playful',
    name: 'Playful & Light',
    description: 'Uses humor and lightness, reduces pressure',
    sampleResponse: "Ooh, coffee as an anchor! Your brain already knows what's up. Let's sneak a tiny win in there."
  }
];

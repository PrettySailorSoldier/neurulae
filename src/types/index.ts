export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
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
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
  createdAt: string;
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

// Potion Inventory Widget - gamified health tracker
export interface PotionInventoryWidget {
  id: string;
  type: 'potion-inventory';
  title: string;
  healthLevel: number; // 0-100
  manaLevel: number;   // 0-100
  staminaLevel: number; // 0-100
  lastDecayTime: string;
  decayEnabled: boolean;
}

// Sunlight Anchor Widget - visual time awareness
export interface SunlightAnchorWidget {
  id: string;
  type: 'sunlight-anchor';
  title: string;
}

import { IntervalStep } from '@/types';

export interface IntervalTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: 'cleaning' | 'work' | 'selfcare' | 'fitness' | 'custom';
  steps: Omit<IntervalStep, 'id' | 'isComplete'>[];
  isDefault?: boolean;
}

// Color palette for template steps
const COLORS = {
  rose: '#f43f5e',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
};

export const DEFAULT_INTERVAL_TEMPLATES: IntervalTemplate[] = [
  // Cleaning Templates
  {
    id: 'quick-tidy',
    name: 'Quick Tidy',
    description: 'Fast room reset in 15 minutes',
    icon: '🧹',
    category: 'cleaning',
    isDefault: true,
    steps: [
      { name: 'Get ready', duration: 60, color: COLORS.cyan },
      { name: 'Surfaces', duration: 300, color: COLORS.blue },
      { name: 'Floor sweep', duration: 240, color: COLORS.purple },
      { name: 'Put away items', duration: 300, color: COLORS.green },
    ],
  },
  {
    id: 'kitchen-reset',
    name: 'Kitchen Reset',
    description: 'Complete kitchen clean in 25 minutes',
    icon: '🍳',
    category: 'cleaning',
    isDefault: true,
    steps: [
      { name: 'Dishes', duration: 600, color: COLORS.blue },
      { name: 'Wipe counters', duration: 300, color: COLORS.cyan },
      { name: 'Stove & appliances', duration: 300, color: COLORS.orange },
      { name: 'Sweep floor', duration: 300, color: COLORS.green },
    ],
  },
  {
    id: 'bathroom-refresh',
    name: 'Bathroom Refresh',
    description: 'Sparkling bathroom in 20 minutes',
    icon: '🚿',
    category: 'cleaning',
    isDefault: true,
    steps: [
      { name: 'Toilet', duration: 300, color: COLORS.blue },
      { name: 'Sink & counter', duration: 300, color: COLORS.cyan },
      { name: 'Mirror', duration: 120, color: COLORS.purple },
      { name: 'Floor', duration: 300, color: COLORS.green },
      { name: 'Restock supplies', duration: 180, color: COLORS.yellow },
    ],
  },

  // Work Templates
  {
    id: 'pomodoro-deep-work',
    name: 'Pomodoro Deep Work',
    description: 'Two focused blocks with break',
    icon: '🍅',
    category: 'work',
    isDefault: true,
    steps: [
      { name: 'Focus Block 1', duration: 1500, color: COLORS.rose },
      { name: 'Break', duration: 300, color: COLORS.green },
      { name: 'Focus Block 2', duration: 1500, color: COLORS.rose },
    ],
  },
  {
    id: 'writing-session',
    name: 'Writing Session',
    description: 'Structured writing with warmup',
    icon: '✍️',
    category: 'work',
    isDefault: true,
    steps: [
      { name: 'Outline/brainstorm', duration: 300, color: COLORS.yellow },
      { name: 'Draft writing', duration: 1200, color: COLORS.blue },
      { name: 'Review & edit', duration: 600, color: COLORS.purple },
      { name: 'Final polish', duration: 300, color: COLORS.green },
    ],
  },
  {
    id: 'meeting-prep',
    name: 'Meeting Prep',
    description: 'Get ready for an important meeting',
    icon: '📋',
    category: 'work',
    isDefault: true,
    steps: [
      { name: 'Review agenda', duration: 180, color: COLORS.cyan },
      { name: 'Prepare notes', duration: 300, color: COLORS.blue },
      { name: 'Test tech/setup', duration: 120, color: COLORS.orange },
    ],
  },

  // Self-care Templates
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Start your day right in 30 minutes',
    icon: '🌅',
    category: 'selfcare',
    isDefault: true,
    steps: [
      { name: 'Stretch', duration: 300, color: COLORS.yellow },
      { name: 'Hygiene', duration: 600, color: COLORS.cyan },
      { name: 'Get dressed', duration: 300, color: COLORS.purple },
      { name: 'Breakfast', duration: 600, color: COLORS.orange },
      { name: 'Plan day', duration: 300, color: COLORS.blue },
    ],
  },
  {
    id: 'evening-wind-down',
    name: 'Evening Wind Down',
    description: 'Prepare for restful sleep',
    icon: '🌙',
    category: 'selfcare',
    isDefault: true,
    steps: [
      { name: 'Tidy space', duration: 300, color: COLORS.blue },
      { name: 'Prepare tomorrow', duration: 300, color: COLORS.purple },
      { name: 'Skincare/hygiene', duration: 600, color: COLORS.cyan },
      { name: 'Relax & unwind', duration: 600, color: COLORS.green },
    ],
  },
  {
    id: 'self-care-reset',
    name: 'Self-Care Reset',
    description: 'Quick mental refresh',
    icon: '🧘',
    category: 'selfcare',
    isDefault: true,
    steps: [
      { name: 'Deep breathing', duration: 180, color: COLORS.cyan },
      { name: 'Light stretching', duration: 300, color: COLORS.green },
      { name: 'Hydrate & snack', duration: 180, color: COLORS.orange },
      { name: 'Journal/reflect', duration: 300, color: COLORS.purple },
    ],
  },

  // Fitness Templates
  {
    id: 'quick-workout',
    name: 'Quick Workout',
    description: '20-minute energy boost',
    icon: '💪',
    category: 'fitness',
    isDefault: true,
    steps: [
      { name: 'Warm up', duration: 180, color: COLORS.yellow },
      { name: 'Cardio burst', duration: 300, color: COLORS.rose },
      { name: 'Strength set 1', duration: 300, color: COLORS.orange },
      { name: 'Strength set 2', duration: 300, color: COLORS.orange },
      { name: 'Cool down', duration: 120, color: COLORS.green },
    ],
  },
  {
    id: 'stretch-break',
    name: 'Stretch Break',
    description: "Desk worker's friend",
    icon: '🙆',
    category: 'fitness',
    isDefault: true,
    steps: [
      { name: 'Neck & shoulders', duration: 120, color: COLORS.cyan },
      { name: 'Arms & wrists', duration: 120, color: COLORS.blue },
      { name: 'Back twist', duration: 120, color: COLORS.purple },
      { name: 'Legs & hips', duration: 120, color: COLORS.green },
    ],
  },
];

// Category metadata for UI
export const TEMPLATE_CATEGORIES = {
  cleaning: { label: 'Cleaning', icon: '🧹', color: '#22c55e' },
  work: { label: 'Work', icon: '💼', color: '#3b82f6' },
  selfcare: { label: 'Self-Care', icon: '🧘', color: '#a855f7' },
  fitness: { label: 'Fitness', icon: '💪', color: '#f97316' },
  custom: { label: 'My Templates', icon: '⭐', color: '#eab308' },
};

// Helper to calculate total duration of a template
export function getTemplateDuration(template: IntervalTemplate): number {
  return template.steps.reduce((sum, step) => sum + step.duration, 0);
}

// Format duration for display
export function formatTemplateDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
  }
  return `${mins}m`;
}

// Storage key for custom templates
export const CUSTOM_TEMPLATES_KEY = 'neurulae-custom-interval-templates';

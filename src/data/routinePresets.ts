import { RoutinePreset } from '@/types';

export const ROUTINE_PRESETS: RoutinePreset[] = [
  {
    id: 'morning-quick',
    name: 'Quick Morning Routine',
    description: 'Minimal morning routine when time is tight. Gets you functional and out the door.',
    category: 'morning',
    estimatedMinutes: 25,
    tags: ['morning', 'quick', 'essential'],
    steps: [
      { name: 'Bathroom & face wash', estimatedMinutes: 5, notes: 'Use the bathroom, wash face, basic hygiene', isFlexible: false, order: 0 },
      { name: 'Get dressed', estimatedMinutes: 5, notes: 'Clothes laid out the night before helps!', isFlexible: false, order: 1 },
      { name: 'Take meds/vitamins', estimatedMinutes: 2, notes: 'With a full glass of water', isFlexible: true, order: 2 },
      { name: 'Quick breakfast', estimatedMinutes: 8, notes: 'Something simple - banana, yogurt, toast', isFlexible: false, order: 3 },
      { name: 'Gather essentials', estimatedMinutes: 5, notes: 'Phone, keys, wallet, bag - check each one', isFlexible: false, order: 4 },
    ]
  },
  {
    id: 'morning-full',
    name: 'Full Morning Routine',
    description: 'Complete morning routine with time for self-care. For days when you can take your time.',
    category: 'morning',
    estimatedMinutes: 60,
    tags: ['morning', 'complete', 'self-care'],
    steps: [
      { name: 'Wake up & stretch', estimatedMinutes: 5, notes: 'Gentle stretches in bed before getting up', isFlexible: false, order: 0 },
      { name: 'Bathroom', estimatedMinutes: 5, notes: '', isFlexible: false, order: 1 },
      { name: 'Shower', estimatedMinutes: 15, notes: 'Include hair wash if needed', isFlexible: false, order: 2 },
      { name: 'Skincare & grooming', estimatedMinutes: 10, notes: 'Face routine, hair styling, etc.', isFlexible: false, order: 3 },
      { name: 'Get dressed', estimatedMinutes: 5, notes: '', isFlexible: false, order: 4 },
      { name: 'Take meds/vitamins', estimatedMinutes: 2, notes: '', isFlexible: true, order: 5 },
      { name: 'Make & eat breakfast', estimatedMinutes: 15, notes: 'Proper sit-down breakfast', isFlexible: false, order: 6 },
      { name: 'Review today\'s plan', estimatedMinutes: 3, notes: 'Quick look at calendar and to-do list', isFlexible: true, order: 7 },
    ]
  },
  {
    id: 'work-startup',
    name: 'Work Day Startup',
    description: 'Transition into work mode. Creates mental separation between "home" and "work" brain.',
    category: 'work',
    estimatedMinutes: 20,
    tags: ['work', 'focus', 'transition'],
    steps: [
      { name: 'Clear workspace', estimatedMinutes: 3, notes: 'Remove distractions, organize desk', isFlexible: true, order: 0 },
      { name: 'Get water/coffee', estimatedMinutes: 2, notes: 'Hydration station ready', isFlexible: true, order: 1 },
      { name: 'Close non-work tabs', estimatedMinutes: 2, notes: 'Social media, YouTube, etc. - close them all', isFlexible: false, order: 2 },
      { name: 'Check calendar', estimatedMinutes: 3, notes: 'Any meetings today? Deadlines?', isFlexible: false, order: 3 },
      { name: 'Review task list', estimatedMinutes: 5, notes: 'Pick your top 3 priorities for today', isFlexible: false, order: 4 },
      { name: 'Set intention', estimatedMinutes: 2, notes: 'What ONE thing must get done today?', isFlexible: false, order: 5 },
      { name: 'Start focus music/sounds', estimatedMinutes: 1, notes: 'Optional: lo-fi, brown noise, whatever works', isFlexible: true, order: 6 },
      { name: 'Begin first task', estimatedMinutes: 2, notes: 'Just open it and type one sentence', isFlexible: false, order: 7 },
    ]
  },
  {
    id: 'work-shutdown',
    name: 'Work Shutdown',
    description: 'End-of-work ritual to mentally leave work behind. Prevents that "still working" feeling all evening.',
    category: 'work',
    estimatedMinutes: 15,
    tags: ['work', 'shutdown', 'transition', 'evening'],
    steps: [
      { name: 'Note where you stopped', estimatedMinutes: 2, notes: 'Write down exactly what you were doing and next step', isFlexible: false, order: 0 },
      { name: 'Update task list', estimatedMinutes: 3, notes: 'Check off done items, add any new ones that came up', isFlexible: false, order: 1 },
      { name: 'Quick tomorrow preview', estimatedMinutes: 2, notes: 'Glance at tomorrow - any early meetings?', isFlexible: true, order: 2 },
      { name: 'Close all work tabs', estimatedMinutes: 2, notes: 'Every. Single. One.', isFlexible: false, order: 3 },
      { name: 'Shut down/close laptop', estimatedMinutes: 1, notes: 'Physical closure helps mental closure', isFlexible: false, order: 4 },
      { name: 'Transition activity', estimatedMinutes: 5, notes: 'Walk, stretch, change clothes - physically shift', isFlexible: false, order: 5 },
    ]
  },
  {
    id: 'evening-wind-down',
    name: 'Evening Wind-Down',
    description: 'Prepare your brain for sleep. Start 1-2 hours before bed.',
    category: 'evening',
    estimatedMinutes: 45,
    tags: ['evening', 'sleep', 'self-care'],
    steps: [
      { name: 'Dim the lights', estimatedMinutes: 1, notes: 'Switch to warm/low lighting', isFlexible: false, order: 0 },
      { name: 'Put phone on charger (away from bed)', estimatedMinutes: 2, notes: 'Ideally in another room', isFlexible: false, order: 1 },
      { name: 'Light snack if hungry', estimatedMinutes: 5, notes: 'Nothing heavy - crackers, banana, herbal tea', isFlexible: true, order: 2 },
      { name: 'Prepare tomorrow\'s clothes', estimatedMinutes: 5, notes: 'Lay out full outfit including shoes', isFlexible: true, order: 3 },
      { name: 'Evening hygiene', estimatedMinutes: 10, notes: 'Brush teeth, skincare, etc.', isFlexible: false, order: 4 },
      { name: 'Brain dump', estimatedMinutes: 5, notes: 'Write down anything on your mind so you can let it go', isFlexible: true, order: 5 },
      { name: 'Relaxing activity', estimatedMinutes: 15, notes: 'Read, gentle stretching, meditation - no screens', isFlexible: false, order: 6 },
      { name: 'Get into bed', estimatedMinutes: 2, notes: 'Lights out!', isFlexible: false, order: 7 },
    ]
  },
  {
    id: 'errand-block',
    name: 'Errand Running Block',
    description: 'Framework for tackling multiple errands efficiently. Customize the specific stops.',
    category: 'errand',
    estimatedMinutes: 90,
    tags: ['errands', 'outside', 'tasks'],
    steps: [
      { name: 'Make errand list', estimatedMinutes: 5, notes: 'Write down all stops, group by location', isFlexible: false, order: 0 },
      { name: 'Check if you need anything', estimatedMinutes: 3, notes: 'Wallet, bags, returns, list, coupons', isFlexible: false, order: 1 },
      { name: 'Errand stop 1', estimatedMinutes: 20, notes: 'Customize this', isFlexible: true, order: 2 },
      { name: 'Errand stop 2', estimatedMinutes: 20, notes: 'Customize this', isFlexible: true, order: 3 },
      { name: 'Errand stop 3', estimatedMinutes: 20, notes: 'Customize this', isFlexible: true, order: 4 },
      { name: 'Return home', estimatedMinutes: 15, notes: 'Account for drive time', isFlexible: false, order: 5 },
      { name: 'Put everything away', estimatedMinutes: 7, notes: 'Don\'t just set bags down - actually put things away', isFlexible: false, order: 6 },
    ]
  },
  {
    id: 'cleaning-sprint',
    name: '15-Minute Cleaning Sprint',
    description: 'Quick burst of cleaning when the whole house feels overwhelming. Just 15 minutes!',
    category: 'self_care',
    estimatedMinutes: 15,
    tags: ['cleaning', 'quick', 'home'],
    steps: [
      { name: 'Grab a trash bag', estimatedMinutes: 1, notes: 'Walk through space, grab obvious trash', isFlexible: false, order: 0 },
      { name: 'Trash sweep', estimatedMinutes: 3, notes: 'Throw away all visible trash in one pass', isFlexible: false, order: 1 },
      { name: 'Dishes to sink', estimatedMinutes: 2, notes: 'Just gather them - don\'t wash yet', isFlexible: true, order: 2 },
      { name: 'Flat surface clear', estimatedMinutes: 4, notes: 'Pick ONE surface (table, counter, desk) and clear it', isFlexible: true, order: 3 },
      { name: 'Laundry gather', estimatedMinutes: 2, notes: 'Clothes to hamper, or start a load if needed', isFlexible: true, order: 4 },
      { name: 'Quick wipe down', estimatedMinutes: 3, notes: 'Wipe the surface you cleared', isFlexible: true, order: 5 },
    ]
  },
  {
    id: 'focus-block',
    name: 'Deep Focus Block',
    description: '90-minute focused work session with built-in break. Based on ultradian rhythms.',
    category: 'work',
    estimatedMinutes: 105,
    tags: ['work', 'focus', 'deep-work'],
    steps: [
      { name: 'Define the ONE task', estimatedMinutes: 2, notes: 'What specific thing are you working on this block?', isFlexible: false, order: 0 },
      { name: 'Remove distractions', estimatedMinutes: 3, notes: 'Phone away, tabs closed, notifications off', isFlexible: false, order: 1 },
      { name: 'First focus sprint (25 min)', estimatedMinutes: 25, notes: 'Work only on the ONE task', isFlexible: false, order: 2 },
      { name: 'Micro-break', estimatedMinutes: 5, notes: 'Stand up, stretch, water, bathroom', isFlexible: false, order: 3 },
      { name: 'Second focus sprint (25 min)', estimatedMinutes: 25, notes: 'Continue the ONE task', isFlexible: false, order: 4 },
      { name: 'Micro-break', estimatedMinutes: 5, notes: 'Move your body, look away from screen', isFlexible: false, order: 5 },
      { name: 'Third focus sprint (25 min)', estimatedMinutes: 25, notes: 'Finish strong', isFlexible: false, order: 6 },
      { name: 'Capture progress', estimatedMinutes: 3, notes: 'Note what you accomplished and next step', isFlexible: false, order: 7 },
      { name: 'Real break', estimatedMinutes: 12, notes: 'Walk, snack, full mental break before next block', isFlexible: false, order: 8 },
    ]
  },
  {
    id: 'study-session',
    name: 'Study Session',
    description: 'Structured study session with active recall and breaks. Great for exam prep.',
    category: 'work',
    estimatedMinutes: 75,
    tags: ['study', 'learning', 'school'],
    steps: [
      { name: 'Gather materials', estimatedMinutes: 3, notes: 'Notes, textbook, flashcards, water bottle', isFlexible: false, order: 0 },
      { name: 'Set specific goal', estimatedMinutes: 2, notes: 'What exactly will you learn/review this session?', isFlexible: false, order: 1 },
      { name: 'First study block', estimatedMinutes: 20, notes: 'Active reading/note-taking - no passive highlighting', isFlexible: false, order: 2 },
      { name: 'Self-test break', estimatedMinutes: 5, notes: 'Close book, write what you remember', isFlexible: false, order: 3 },
      { name: 'Second study block', estimatedMinutes: 20, notes: 'Focus on weak areas from self-test', isFlexible: false, order: 4 },
      { name: 'Movement break', estimatedMinutes: 5, notes: 'Walk around, stretch, get snack', isFlexible: false, order: 5 },
      { name: 'Third study block', estimatedMinutes: 15, notes: 'Practice problems or teach concept out loud', isFlexible: false, order: 6 },
      { name: 'Final review', estimatedMinutes: 5, notes: 'Summarize key points in your own words', isFlexible: false, order: 7 },
    ]
  },
  {
    id: 'self-care-check',
    name: 'Self-Care Check-In',
    description: 'Quick check-in with yourself when feeling overwhelmed or disconnected.',
    category: 'self_care',
    estimatedMinutes: 20,
    tags: ['self-care', 'wellness', 'mental-health'],
    steps: [
      { name: 'Pause everything', estimatedMinutes: 1, notes: 'Put down your phone, step away from tasks', isFlexible: false, order: 0 },
      { name: 'Three deep breaths', estimatedMinutes: 1, notes: 'Slow inhale, slow exhale, feel your body', isFlexible: false, order: 1 },
      { name: 'Physical needs check', estimatedMinutes: 3, notes: 'Hungry? Thirsty? Need bathroom? Cold/hot?', isFlexible: false, order: 2 },
      { name: 'Address immediate need', estimatedMinutes: 5, notes: 'Eat something, drink water, use bathroom, get blanket', isFlexible: true, order: 3 },
      { name: 'Emotional check-in', estimatedMinutes: 3, notes: 'What emotion am I feeling? Where do I feel it?', isFlexible: false, order: 4 },
      { name: 'Name one small win', estimatedMinutes: 2, notes: 'Something you did today, however small', isFlexible: true, order: 5 },
      { name: 'Set one small intention', estimatedMinutes: 2, notes: 'Just one tiny thing to do next', isFlexible: false, order: 6 },
      { name: 'Gentle transition', estimatedMinutes: 3, notes: 'Slowly return to activity, no rushing', isFlexible: false, order: 7 },
    ]
  },
];

export const ROUTINE_CATEGORIES = [
  { id: 'morning', label: 'Morning', icon: '🌅', color: '#FFB347' },
  { id: 'work', label: 'Work', icon: '💼', color: '#87CEEB' },
  { id: 'evening', label: 'Evening', icon: '🌙', color: '#9B59B6' },
  { id: 'errand', label: 'Errands', icon: '🏃', color: '#2ECC71' },
  { id: 'self_care', label: 'Self Care', icon: '🧘', color: '#E91E63' },
  { id: 'custom', label: 'Custom', icon: '✨', color: '#607D8B' },
] as const;

export const getPresetsByCategory = (category: string) =>
  ROUTINE_PRESETS.filter(p => p.category === category);

export const getPresetById = (id: string) =>
  ROUTINE_PRESETS.find(p => p.id === id);

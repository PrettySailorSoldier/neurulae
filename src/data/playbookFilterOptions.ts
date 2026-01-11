// Filter options for the two-tier playbook filter system

export type PrimaryFilter = 'all' | 'by-room' | 'by-activity' | 'by-time' | 'templates';

export const PRIMARY_FILTERS: { value: PrimaryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'by-room', label: 'By Room' },
  { value: 'by-activity', label: 'By Activity' },
  { value: 'by-time', label: 'By Time' },
  { value: 'templates', label: 'Templates' },
];

export const ROOM_OPTIONS = [
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'living-room', label: 'Living Room' },
  { value: 'office', label: 'Office' },
  { value: 'entryway', label: 'Entryway & Dining' },
  { value: 'garage', label: 'Garage' },
  { value: 'whole-home', label: 'Whole Home' },
  { value: 'vehicle', label: 'Vehicle' },
] as const;

export const ACTIVITY_OPTIONS = [
  { value: 'deep-clean', label: 'Deep Cleaning' },
  { value: 'quick-clean', label: 'Quick Cleaning' },
  { value: 'declutter', label: 'Decluttering' },
  { value: 'organize', label: 'Organizing' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'daily-routine', label: 'Daily Routine' },
  { value: 'self-care', label: 'Self-Care' },
  { value: 'cooking', label: 'Cooking' },
] as const;

export const TIME_OPTIONS = [
  { value: '0-15', label: '≤ 15 min' },
  { value: '15-30', label: '15-30 min' },
  { value: '30-60', label: '30-60 min' },
  { value: '60-120', label: '1-2 hours' },
  { value: '120+', label: '2+ hours' },
] as const;

// Helper to get secondary options based on primary filter
export function getSecondaryOptions(primary: PrimaryFilter) {
  switch (primary) {
    case 'by-room':
      return ROOM_OPTIONS;
    case 'by-activity':
      return ACTIVITY_OPTIONS;
    case 'by-time':
      return TIME_OPTIONS;
    default:
      return [];
  }
}

// Template tier sections for organized display
export const TEMPLATE_SECTIONS = [
  { tier: 1, title: '⭐ Essential Templates', description: 'Start here - the most versatile playbooks' },
  { tier: 2, title: '🏠 Room-by-Room', description: 'Deep cleans for specific spaces' },
  { tier: 3, title: '⚡ Speed Cleaning & Specialty', description: 'Quick cleans, decluttering, seasonal tasks' },
  { tier: 4, title: '🚗 Vehicle & Outdoor', description: 'Beyond the home' },
] as const;

// Helper to calculate duration category from total minutes
export function getDurationCategory(totalMinutes: number): '0-15' | '15-30' | '30-60' | '60-120' | '120+' {
  if (totalMinutes <= 15) return '0-15';
  if (totalMinutes <= 30) return '15-30';
  if (totalMinutes <= 60) return '30-60';
  if (totalMinutes <= 120) return '60-120';
  return '120+';
}

/**
 * Time-related utility functions for the dashboard
 */

export type DayPhase = 'morning' | 'afternoon' | 'evening';

/**
 * Get the current phase of the day
 * Morning: before 12pm
 * Afternoon: 12pm - 5pm
 * Evening: after 5pm
 */
export function getCurrentDayPhase(): DayPhase {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Get a greeting based on time of day
 * Returns "Good Morning", "Good Afternoon", or "Good Evening"
 */
export function getTimeOfDayGreeting(): string {
  const phase = getCurrentDayPhase();
  switch (phase) {
    case 'morning':
      return 'Good Morning';
    case 'afternoon':
      return 'Good Afternoon';
    case 'evening':
      return 'Good Evening';
  }
}

/**
 * Calculate what percentage through the "active day" we are
 * Assumes active day is 6am - 10pm (16 hours)
 * Returns 0-100
 */
export function calculateDayProgress(): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Day starts at 6am (360 minutes) and ends at 10pm (1320 minutes)
  const dayStartMinutes = 6 * 60;  // 6:00 AM
  const dayEndMinutes = 22 * 60;    // 10:00 PM
  const totalDayMinutes = dayEndMinutes - dayStartMinutes; // 960 minutes = 16 hours
  
  // Calculate elapsed minutes since day start
  const elapsedMinutes = currentMinutes - dayStartMinutes;
  
  // Clamp to 0-100%
  const progress = (elapsedMinutes / totalDayMinutes) * 100;
  return Math.max(0, Math.min(100, progress));
}

/**
 * Get the position percentage for each phase boundary
 * Morning: 0% - 37.5% (6am - 12pm = 6 hours of 16)
 * Afternoon: 37.5% - 68.75% (12pm - 5pm = 5 hours of 16) 
 * Evening: 68.75% - 100% (5pm - 10pm = 5 hours of 16)
 */
export function getPhasePositions() {
  return {
    morningEnd: 37.5,     // 12pm
    afternoonEnd: 68.75,  // 5pm
  };
}

/**
 * Check if today is a weekend
 */
export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get schedule type label
 */
export function getScheduleTypeLabel(date: Date = new Date()): string {
  return isWeekend(date) ? 'Weekend' : 'Business Hours';
}

/**
 * Format current time for display
 */
export function formatCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
}

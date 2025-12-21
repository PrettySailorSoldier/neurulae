// Time utility functions for Neurulae timeline

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function timeToPercentage(time: string): number {
  const minutes = timeToMinutes(time);
  return (minutes / 1440) * 100; // 1440 minutes in a day
}

export function getCurrentTimePercentage(): number {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return (minutes / 1440) * 100;
}

export function isTimeInRange(current: string, start: string, end: string): boolean {
  const currentMins = timeToMinutes(current);
  const startMins = timeToMinutes(start);
  const endMins = timeToMinutes(end);
  return currentMins >= startMins && currentMins <= endMins;
}

export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function isWeekday(): boolean {
  const day = new Date().getDay();
  return day >= 1 && day <= 5;
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Time Zone Utilities for Daily Flow Timeline

export interface ComputedTimeZone {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  icon?: string;
  isActive: boolean;
  startPercentage: number;
  endPercentage: number;
  heightPercentage: number;
}

export interface TimeZoneConfig {
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  businessHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    weekdaysOnly: boolean;
  };
  customZones?: Array<{
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    color: string;
    icon?: string;
  }>;
}

// Check if a time falls within a range (handles overnight ranges like 22:00-07:00)
export function isTimeInRangeWithOvernight(current: string, start: string, end: string): boolean {
  const currentMins = timeToMinutes(current);
  const startMins = timeToMinutes(start);
  const endMins = timeToMinutes(end);

  // Normal range (e.g., 08:00-17:00)
  if (startMins <= endMins) {
    return currentMins >= startMins && currentMins < endMins;
  }

  // Overnight range (e.g., 22:00-07:00)
  return currentMins >= startMins || currentMins < endMins;
}

// Get all time zones with their computed positions for rendering
export function getComputedTimeZones(config: TimeZoneConfig): ComputedTimeZone[] {
  const zones: ComputedTimeZone[] = [];
  const currentTime = getCurrentTime();
  const today = new Date();
  const isWeekdayToday = today.getDay() >= 1 && today.getDay() <= 5;

  // Quiet Hours (typically overnight, e.g., 22:00-07:00)
  if (config.quietHours.enabled) {
    const startMins = timeToMinutes(config.quietHours.startTime);
    const endMins = timeToMinutes(config.quietHours.endTime);

    // Handle overnight quiet hours by splitting into two segments
    if (startMins > endMins) {
      // Evening segment (e.g., 22:00-24:00)
      zones.push({
        id: 'quiet-evening',
        name: 'Quiet Hours',
        startTime: config.quietHours.startTime,
        endTime: '24:00',
        color: 'hsl(var(--muted))',
        icon: 'Moon',
        isActive: isTimeInRangeWithOvernight(currentTime, config.quietHours.startTime, '24:00'),
        startPercentage: timeToPercentage(config.quietHours.startTime),
        endPercentage: 100,
        heightPercentage: 100 - timeToPercentage(config.quietHours.startTime),
      });

      // Morning segment (e.g., 00:00-07:00)
      zones.push({
        id: 'quiet-morning',
        name: 'Quiet Hours',
        startTime: '00:00',
        endTime: config.quietHours.endTime,
        color: 'hsl(var(--muted))',
        icon: 'Moon',
        isActive: isTimeInRangeWithOvernight(currentTime, '00:00', config.quietHours.endTime),
        startPercentage: 0,
        endPercentage: timeToPercentage(config.quietHours.endTime),
        heightPercentage: timeToPercentage(config.quietHours.endTime),
      });
    } else {
      // Normal daytime quiet hours (unusual but supported)
      zones.push({
        id: 'quiet',
        name: 'Quiet Hours',
        startTime: config.quietHours.startTime,
        endTime: config.quietHours.endTime,
        color: 'hsl(var(--muted))',
        icon: 'Moon',
        isActive: isTimeInRangeWithOvernight(currentTime, config.quietHours.startTime, config.quietHours.endTime),
        startPercentage: timeToPercentage(config.quietHours.startTime),
        endPercentage: timeToPercentage(config.quietHours.endTime),
        heightPercentage: timeToPercentage(config.quietHours.endTime) - timeToPercentage(config.quietHours.startTime),
      });
    }
  }

  // Business Hours
  if (config.businessHours.enabled) {
    const shouldShowBusiness = !config.businessHours.weekdaysOnly || isWeekdayToday;
    if (shouldShowBusiness) {
      zones.push({
        id: 'business',
        name: 'Business Hours',
        startTime: config.businessHours.startTime,
        endTime: config.businessHours.endTime,
        color: 'hsl(var(--primary) / 0.15)',
        icon: 'Briefcase',
        isActive: isTimeInRange(currentTime, config.businessHours.startTime, config.businessHours.endTime),
        startPercentage: timeToPercentage(config.businessHours.startTime),
        endPercentage: timeToPercentage(config.businessHours.endTime),
        heightPercentage: timeToPercentage(config.businessHours.endTime) - timeToPercentage(config.businessHours.startTime),
      });
    }
  }

  // Custom zones
  if (config.customZones) {
    for (const zone of config.customZones) {
      zones.push({
        id: zone.id,
        name: zone.name,
        startTime: zone.startTime,
        endTime: zone.endTime,
        color: zone.color,
        icon: zone.icon,
        isActive: isTimeInRangeWithOvernight(currentTime, zone.startTime, zone.endTime),
        startPercentage: timeToPercentage(zone.startTime),
        endPercentage: timeToPercentage(zone.endTime),
        heightPercentage: timeToPercentage(zone.endTime) - timeToPercentage(zone.startTime),
      });
    }
  }

  return zones;
}

// Get the currently active time zone
export function getCurrentTimeZone(config: TimeZoneConfig): ComputedTimeZone | null {
  const zones = getComputedTimeZones(config);
  return zones.find(z => z.isActive) || null;
}

// Check if a task can be done now based on time zone settings
export function isTaskAvailableInTimeZone(
  task: { timeConstraint?: string; noiseLevel?: string; taskType?: string },
  config: TimeZoneConfig
): { available: boolean; reason?: string } {
  const currentTime = getCurrentTime();
  const today = new Date();
  const isWeekdayToday = today.getDay() >= 1 && today.getDay() <= 5;

  // Check if we're in quiet hours
  if (config.quietHours.enabled) {
    const inQuietHours = isTimeInRangeWithOvernight(
      currentTime,
      config.quietHours.startTime,
      config.quietHours.endTime
    );

    if (inQuietHours && task.noiseLevel === 'noisy') {
      return { available: false, reason: 'Too noisy for quiet hours' };
    }
  }

  // Check business hours constraint
  if (task.timeConstraint === 'business-hours') {
    if (!config.businessHours.enabled) {
      return { available: true }; // No business hours defined, allow anytime
    }

    const inBusinessHours = isTimeInRange(
      currentTime,
      config.businessHours.startTime,
      config.businessHours.endTime
    );

    if (config.businessHours.weekdaysOnly && !isWeekdayToday) {
      return { available: false, reason: 'Business hours are weekdays only' };
    }

    if (!inBusinessHours) {
      return { available: false, reason: 'Outside business hours' };
    }
  }

  // Check morning constraint
  if (task.timeConstraint === 'morning') {
    const currentHour = parseInt(currentTime.split(':')[0]);
    if (currentHour >= 12) {
      return { available: false, reason: 'Morning task - best before noon' };
    }
  }

  // Check evening constraint
  if (task.timeConstraint === 'evening') {
    const currentHour = parseInt(currentTime.split(':')[0]);
    if (currentHour < 17) {
      return { available: false, reason: 'Evening task - best after 5 PM' };
    }
  }

  return { available: true };
}

// Format time for display (12hr format with AM/PM)
export function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}
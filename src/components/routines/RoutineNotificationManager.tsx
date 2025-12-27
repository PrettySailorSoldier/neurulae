import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Routine, ScheduledRoutine, ROUTINE_STORAGE_KEYS } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format, parseISO, differenceInMinutes, addMinutes, isAfter, isBefore } from 'date-fns';

interface RoutineNotificationManagerProps {
  routines: Routine[];
  scheduledRoutines: ScheduledRoutine[];
  onStartRoutine: (routine: Routine | ScheduledRoutine) => void;
  enabled?: boolean;
}

interface NotificationState {
  notifiedRoutines: Record<string, {
    reminderSent?: boolean;
    startSent?: boolean;
    overdueSent?: boolean;
  }>;
  lastChecked: string;
}

export function RoutineNotificationManager({
  routines,
  scheduledRoutines,
  onStartRoutine,
  enabled = true,
}: RoutineNotificationManagerProps) {
  const [notificationState, setNotificationState] = useLocalStorage<NotificationState>(
    ROUTINE_STORAGE_KEYS.NOTIFICATION_STATE,
    { notifiedRoutines: {}, lastChecked: new Date().toISOString() }
  );

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasNotificationPermission = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if (!enabled) return;

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        hasNotificationPermission.current = true;
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          hasNotificationPermission.current = permission === 'granted';
        });
      }
    }
  }, [enabled]);

  const sendNotification = useCallback((title: string, body: string, routineId: string, routine: Routine | ScheduledRoutine) => {
    // Always show toast
    toast(title, {
      description: body,
      action: {
        label: 'Start Now',
        onClick: () => onStartRoutine(routine),
      },
      duration: 10000,
    });

    // Also send browser notification if permitted
    if (hasNotificationPermission.current && 'Notification' in window) {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `routine-${routineId}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        onStartRoutine(routine);
        notification.close();
      };
    }
  }, [onStartRoutine]);

  const checkScheduledRoutines = useCallback(() => {
    if (!enabled) return;

    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');

    // Reset notification state at midnight
    const lastCheckedDate = format(parseISO(notificationState.lastChecked), 'yyyy-MM-dd');
    if (lastCheckedDate !== today) {
      setNotificationState({
        notifiedRoutines: {},
        lastChecked: now.toISOString(),
      });
      return;
    }

    const updatedNotifications = { ...notificationState.notifiedRoutines };

    scheduledRoutines.forEach(scheduled => {
      // Skip if already started or completed
      if (scheduled.status !== 'pending') return;

      const scheduleDate = format(parseISO(scheduled.scheduledDate), 'yyyy-MM-dd');
      if (scheduleDate !== today) return;

      if (!scheduled.scheduledTime) return;

      const [hours, minutes] = scheduled.scheduledTime.split(':').map(Number);
      const scheduledDateTime = new Date(now);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const routine = routines.find(r => r.id === scheduled.routineId);
      if (!routine) return;

      const notificationKey = `${scheduled.id}-${today}`;
      const notified = updatedNotifications[notificationKey] || {};

      // 15-minute reminder
      const reminderTime = addMinutes(scheduledDateTime, -15);
      if (
        !notified.reminderSent &&
        isAfter(now, reminderTime) &&
        isBefore(now, scheduledDateTime)
      ) {
        sendNotification(
          `${routine.icon || '📋'} Routine Starting Soon`,
          `"${routine.name}" starts in ${differenceInMinutes(scheduledDateTime, now)} minutes`,
          scheduled.id,
          scheduled
        );
        updatedNotifications[notificationKey] = { ...notified, reminderSent: true };
      }

      // Start time notification
      const startWindow = addMinutes(scheduledDateTime, 2); // 2-minute window
      if (
        !notified.startSent &&
        isAfter(now, scheduledDateTime) &&
        isBefore(now, startWindow)
      ) {
        sendNotification(
          `${routine.icon || '📋'} Time for ${routine.name}`,
          `Your routine is scheduled to start now (${formatDuration(routine.totalEstimatedMinutes)})`,
          scheduled.id,
          scheduled
        );
        updatedNotifications[notificationKey] = { ...notified, startSent: true };
      }

      // Overdue notification (5 minutes past)
      const overdueTime = addMinutes(scheduledDateTime, 5);
      if (
        !notified.overdueSent &&
        isAfter(now, overdueTime)
      ) {
        sendNotification(
          `${routine.icon || '📋'} Routine Overdue`,
          `"${routine.name}" was scheduled ${differenceInMinutes(now, scheduledDateTime)} minutes ago`,
          scheduled.id,
          scheduled
        );
        updatedNotifications[notificationKey] = { ...notified, overdueSent: true };
      }
    });

    // Also check routines with fixed anchor times
    routines.forEach(routine => {
      if (routine.anchorType !== 'fixed_start' || !routine.anchorTime) return;
      if (!routine.showNotifications) return;

      // Check if this routine should run today
      const shouldRunToday = checkRoutineSchedule(routine, now);
      if (!shouldRunToday) return;

      const [hours, minutes] = routine.anchorTime.split(':').map(Number);
      const anchorDateTime = new Date(now);
      anchorDateTime.setHours(hours, minutes, 0, 0);

      const notificationKey = `${routine.id}-${today}`;
      const notified = updatedNotifications[notificationKey] || {};

      // 15-minute reminder
      const reminderTime = addMinutes(anchorDateTime, -15);
      if (
        !notified.reminderSent &&
        isAfter(now, reminderTime) &&
        isBefore(now, anchorDateTime)
      ) {
        sendNotification(
          `${routine.icon || '📋'} Routine Starting Soon`,
          `"${routine.name}" is scheduled for ${routine.anchorTime}`,
          routine.id,
          routine
        );
        updatedNotifications[notificationKey] = { ...notified, reminderSent: true };
      }

      // Start time notification
      const startWindow = addMinutes(anchorDateTime, 2);
      if (
        !notified.startSent &&
        isAfter(now, anchorDateTime) &&
        isBefore(now, startWindow)
      ) {
        sendNotification(
          `${routine.icon || '📋'} Time for ${routine.name}`,
          `Your routine is scheduled to start now`,
          routine.id,
          routine
        );
        updatedNotifications[notificationKey] = { ...notified, startSent: true };
      }
    });

    if (JSON.stringify(updatedNotifications) !== JSON.stringify(notificationState.notifiedRoutines)) {
      setNotificationState({
        ...notificationState,
        notifiedRoutines: updatedNotifications,
        lastChecked: now.toISOString(),
      });
    }
  }, [enabled, scheduledRoutines, routines, notificationState, setNotificationState, sendNotification]);

  // Check every minute
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkScheduledRoutines();

    // Set up interval
    checkIntervalRef.current = setInterval(checkScheduledRoutines, 60000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled, checkScheduledRoutines]);

  // This component doesn't render anything
  return null;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function checkRoutineSchedule(routine: Routine, date: Date): boolean {
  if (!routine.repeatSchedule || routine.repeatSchedule.type === 'none') {
    return false;
  }

  const dayOfWeek = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  switch (routine.repeatSchedule.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'specific_days':
      return routine.repeatSchedule.days?.includes(dayNames[dayOfWeek]) || false;
    default:
      return false;
  }
}

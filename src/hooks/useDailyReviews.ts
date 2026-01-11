/**
 * Daily Reviews Hook
 * 
 * Manages daily review history, persistence, and analytics.
 * Stores review data in localStorage for pattern tracking over time.
 */

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { TomorrowIntention } from '@/types';
import { format, parseISO, differenceInDays, isAfter, isBefore, startOfDay } from 'date-fns';

// Daily Review Entry - stored for each completed review
export interface DailyReviewEntry {
  id: string;
  date: string; // YYYY-MM-DD - the date the review was completed
  reviewedAt: string; // ISO timestamp when review was completed
  completedTasks: number; // tasks completed that day
  remainingTasks: number; // tasks remaining
  overdueTasks: number; // overdue tasks
  carryingForward: string[]; // task titles being carried forward
  reflection: string; // user's reflection text
  tomorrowPriorities: TomorrowIntention[]; // priorities set for the next day
}

// Analytics summary
export interface ReviewAnalytics {
  totalReviews: number;
  currentStreak: number;
  longestStreak: number;
  averageCompletedTasks: number;
  priorityCompletionRate: number; // % of priorities that got completed
  mostCommonCarryForward: string[]; // tasks frequently carried forward
  reviewsByDayOfWeek: Record<string, number>; // which days have most reviews
}

const STORAGE_KEY = 'neurulae-daily-reviews';

export function useDailyReviews() {
  const [reviews, setReviews] = useLocalStorage<DailyReviewEntry[]>(STORAGE_KEY, []);

  /**
   * Add a new daily review entry
   */
  const addReview = useCallback((entry: Omit<DailyReviewEntry, 'id'>) => {
    const newEntry: DailyReviewEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
    
    setReviews(prev => {
      // Remove any existing review for the same date (replace instead of duplicate)
      const filtered = prev.filter(r => r.date !== entry.date);
      return [...filtered, newEntry].sort((a, b) => 
        a.date.localeCompare(b.date)
      );
    });
    
    return newEntry;
  }, [setReviews]);

  /**
   * Get review for a specific date
   */
  const getReviewForDate = useCallback((date: string): DailyReviewEntry | null => {
    return reviews.find(r => r.date === date) || null;
  }, [reviews]);

  /**
   * Get today's priorities (from yesterday's review)
   * This is what should display in the intentions banner
   */
  const getTodaysPriorities = useCallback((): TomorrowIntention[] | null => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Find the most recent review that set priorities for today
    // The review would have been completed yesterday (or earlier)
    // and the priorities were set for "tomorrow" which is now today
    
    // Look through reviews sorted by date descending
    const sortedReviews = [...reviews].sort((a, b) => 
      b.date.localeCompare(a.date)
    );
    
    for (const review of sortedReviews) {
      // Check if this review's tomorrowPriorities were for today
      // The review was done on review.date, priorities were for the next day
      const reviewDate = parseISO(review.date);
      const nextDay = format(new Date(reviewDate.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      if (nextDay === today && review.tomorrowPriorities.length > 0) {
        return review.tomorrowPriorities;
      }
    }
    
    return null;
  }, [reviews]);

  /**
   * Calculate completion streak (consecutive days with reviews)
   */
  const getCompletionStreak = useCallback((): { current: number; longest: number } => {
    if (reviews.length === 0) return { current: 0, longest: 0 };
    
    const today = startOfDay(new Date());
    const sortedDates = [...new Set(reviews.map(r => r.date))]
      .sort()
      .reverse()
      .map(d => parseISO(d));
    
    let currentStreak = 0;
    let longestStreak = 0;
    let streakCount = 0;
    let lastDate: Date | null = null;
    
    for (const date of sortedDates) {
      const dayStart = startOfDay(date);
      
      if (!lastDate) {
        // First date - check if it's today or yesterday
        const daysDiff = differenceInDays(today, dayStart);
        if (daysDiff <= 1) {
          streakCount = 1;
          currentStreak = 1;
        }
      } else {
        const daysDiff = differenceInDays(lastDate, dayStart);
        if (daysDiff === 1) {
          streakCount++;
          if (currentStreak > 0) currentStreak++;
        } else {
          // Streak broken
          longestStreak = Math.max(longestStreak, streakCount);
          streakCount = 1;
          if (currentStreak > 0) currentStreak = 0; // Current streak is broken
        }
      }
      
      lastDate = dayStart;
    }
    
    longestStreak = Math.max(longestStreak, streakCount);
    
    return { current: currentStreak, longest: longestStreak };
  }, [reviews]);

  /**
   * Get analytics summary
   */
  const getAnalytics = useCallback((): ReviewAnalytics => {
    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageCompletedTasks: 0,
        priorityCompletionRate: 0,
        mostCommonCarryForward: [],
        reviewsByDayOfWeek: {},
      };
    }

    const streak = getCompletionStreak();
    
    // Average completed tasks
    const totalCompleted = reviews.reduce((sum, r) => sum + r.completedTasks, 0);
    const averageCompletedTasks = totalCompleted / reviews.length;
    
    // Priority completion rate (how many priorities got done)
    let totalPriorities = 0;
    let completedPriorities = 0;
    reviews.forEach(r => {
      r.tomorrowPriorities.forEach(p => {
        totalPriorities++;
        if (p.completed) completedPriorities++;
      });
    });
    const priorityCompletionRate = totalPriorities > 0 
      ? (completedPriorities / totalPriorities) * 100 
      : 0;
    
    // Most common carry-forward items
    const carryForwardCounts: Record<string, number> = {};
    reviews.forEach(r => {
      r.carryingForward.forEach(task => {
        const normalized = task.toLowerCase().trim();
        carryForwardCounts[normalized] = (carryForwardCounts[normalized] || 0) + 1;
      });
    });
    const mostCommonCarryForward = Object.entries(carryForwardCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([task]) => task);
    
    // Reviews by day of week
    const reviewsByDayOfWeek: Record<string, number> = {};
    reviews.forEach(r => {
      const dayName = format(parseISO(r.date), 'EEEE');
      reviewsByDayOfWeek[dayName] = (reviewsByDayOfWeek[dayName] || 0) + 1;
    });
    
    return {
      totalReviews: reviews.length,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      averageCompletedTasks,
      priorityCompletionRate,
      mostCommonCarryForward,
      reviewsByDayOfWeek,
    };
  }, [reviews, getCompletionStreak]);

  /**
   * Get reviews for a date range
   */
  const getReviewsInRange = useCallback((startDate: string, endDate: string): DailyReviewEntry[] => {
    return reviews.filter(r => 
      r.date >= startDate && r.date <= endDate
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [reviews]);

  /**
   * Get the most recent N reviews
   */
  const getRecentReviews = useCallback((count: number = 7): DailyReviewEntry[] => {
    return [...reviews]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, count);
  }, [reviews]);

  /**
   * Check if review was completed today
   */
  const hasReviewedToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return reviews.some(r => r.date === today);
  }, [reviews]);

  /**
   * Delete a review by ID
   */
  const deleteReview = useCallback((id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
  }, [setReviews]);

  return {
    reviews,
    addReview,
    deleteReview,
    getReviewForDate,
    getTodaysPriorities,
    getCompletionStreak,
    getAnalytics,
    getReviewsInRange,
    getRecentReviews,
    hasReviewedToday,
  };
}

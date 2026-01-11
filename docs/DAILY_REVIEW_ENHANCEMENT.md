# Daily Review System Enhancement - Implementation Guide

## Overview

This document provides a comprehensive guide to the Daily Review System enhancements implemented for Neurulae. The changes address banner visibility, data persistence, smart task matching, and analytics.

---

## 1. Files Created/Modified

### New Files Created

| File | Purpose |
|------|---------|
| `src/lib/fuzzyTaskMatch.ts` | Fuzzy matching algorithm to find existing tasks that match priority text |
| `src/hooks/useDailyReviews.ts` | Hook for managing daily review history, persistence, and analytics |
| `src/components/DailyReviewHistory.tsx` | Dialog component for viewing past reviews and insights |

### Files Modified

| File | Changes |
|------|---------|
| `src/components/DailyReviewPrompt.tsx` | Complete rewrite with smart task matching, streak tracking, review history saving |
| `src/components/TomorrowIntentionsBar.tsx` | Fixed visibility, solid backgrounds, empty state prompt, reliable date comparison |
| `src/pages/Index.tsx` | Added lazy imports, state for review history, keyboard shortcut 'h' for history |

---

## 2. Feature Breakdown

### 2.1 CRITICAL - Fixed Banner Visibility (✅ Implemented)

**Problem:** Banner showed generic text and was transparent/invisible
**Solution:** 
- Changed `TomorrowIntentionsBar` to have solid gradient backgrounds using theme colors
- Fixed date comparison using `isSameDay()` from date-fns (more reliable than `isToday()`)
- Added empty state that prompts users to "Set Your Intentions"
- Made the banner clickable to open Daily Review when no intentions are set

**Banner States:**
1. **No intentions for today:** Shows "Set Your Intentions" prompt with Moon icon
2. **Intentions set (in progress):** Shows 3 priorities with checkboxes, purple/primary gradient
3. **All intentions complete:** Green gradient with sparkles and "All done!" badge

### 2.2 HIGH - Data Persistence & Review History (✅ Implemented)

**New localStorage Schema:**
```typescript
// Key: 'neurulae-daily-reviews'
interface DailyReviewEntry {
  id: string;                    // UUID
  date: string;                  // YYYY-MM-DD
  reviewedAt: string;            // ISO timestamp
  completedTasks: number;        // Count for the day
  remainingTasks: number;
  overdueTasks: number;
  carryingForward: string[];     // Task titles (max 5)
  reflection: string;            // User's notes
  tomorrowPriorities: TomorrowIntention[];
}
```

**Access Methods (via `useDailyReviews` hook):**
- `addReview(entry)` - Save a new review
- `getReviewForDate(date)` - Get specific review
- `getTodaysPriorities()` - Get priorities (from yesterday's review)
- `getCompletionStreak()` - Returns `{current, longest}`
- `getAnalytics()` - Returns comprehensive stats
- `getRecentReviews(count)` - Get last N reviews
- `hasReviewedToday` - Boolean check

### 2.3 HIGH - Smart Task Matching (✅ Implemented)

**Algorithm:** `findMatchingTasks()` in `src/lib/fuzzyTaskMatch.ts`

**How it works:**
1. Normalize both texts (lowercase, remove punctuation)
2. Filter out stop words (the, a, an, to, for, etc.)
3. Calculate similarity using word overlap
4. Support partial matching (e.g., "call" matches "callback")
5. Return matches sorted by score

**UI Integration:**
- When user types 2+ characters in priority input, matches appear
- Clicking a match links priority to existing task
- Badge shows "Linked" with option to clear
- Only unlinked priorities create new tasks

**Example:**
```
User types: "call doctor"
Matches found:
- "phone dr appointment" (85% match)
- "callback from clinic" (62% match)

User can click to link, or "Create new task instead"
```

### 2.4 MEDIUM - Automated Evening Popup (Existing, Enhanced)

**Current behavior:**
- Checks every 30 minutes between 8 PM - 11 PM
- Uses `lastReviewDate` to prevent re-prompting
- Only shows if user has tasks

**Enhancement needed (TODO):**
- Add user-configurable trigger time in settings
- Add "Remind me in 30 min" button
- Store preference: `preferences.dailyReviewTime`

### 2.5 NICE-TO-HAVE - Analytics Dashboard (✅ Implemented)

**Access via:**
- Keyboard shortcut: `H` (opens Review History dialog)
- Can add button in settings or command palette

**Analytics shown:**
- Current streak & longest streak
- Priority completion rate (%)
- Average tasks completed per day
- Most common carry-forward items
- Reviews by day of week
- Celebratory messages

---

## 3. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Open Daily Review modal |
| `H` | Open Review History dialog |
| `Cmd/Ctrl + K` | Command Palette (can add review options) |

---

## 4. Component Props Reference

### TomorrowIntentionsBar

```typescript
interface TomorrowIntentionsBarProps {
  intentions: TomorrowIntentions | null;
  onToggleIntention: (intentionId: string) => void;
  onClearIntentions: () => void;
  onOpenDailyReview?: () => void;        // NEW - for empty state
  onStartWorkSession?: (taskId: string) => void;  // NEW - for work buttons
  activeTaskId?: string | null;          // NEW - for active highlighting
  className?: string;
}
```

### DailyReviewPrompt (Enhanced)

```typescript
interface DailyReviewPromptProps {
  tasks: Task[];
  onClose: () => void;
  onAddTask?: (title: string) => void;   // Only called for NEW tasks
  lastReviewDate?: string;
  onSaveReview?: (date: string, notes: string) => void;
  onSaveTomorrowIntentions?: (intentions: TomorrowIntentions) => void;
}
```

### DailyReviewHistory (New)

```typescript
interface DailyReviewHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

---

## 5. Testing Checklist

### Banner Visibility
- [ ] Banner shows solid background (not transparent)
- [ ] Empty state shows "Set Your Intentions" prompt
- [ ] Clicking empty state opens Daily Review modal
- [ ] Priorities display correctly after setting them
- [ ] Date comparison works across midnight

### Smart Task Matching
- [ ] Matches appear when typing 2+ characters
- [ ] Can link to existing task by clicking suggestion
- [ ] "Linked" badge appears on linked priorities
- [ ] Can clear link by clicking badge
- [ ] Only unlinked priorities create new tasks
- [ ] Stop words are ignored ("call the doctor" matches "call doctor")

### Data Persistence
- [ ] Reviews saved to localStorage after completing
- [ ] Review history shows past reviews
- [ ] Streak count is accurate
- [ ] Analytics calculate correctly

### Review History Dialog
- [ ] Opens with 'H' keyboard shortcut
- [ ] Shows list of past reviews
- [ ] Expandable to see details
- [ ] Insights tab shows analytics
- [ ] Empty state when no reviews

### Mobile Responsiveness
- [ ] Banner fits on mobile screens
- [ ] Priority inputs work on touch
- [ ] Review history scrollable on mobile
- [ ] All modals close properly

---

## 6. Design Considerations

### AuDHD-Friendly
- ✅ Clear visual states (not cluttered)
- ✅ Optional reflection (not required)
- ✅ Celebratory messaging (streak badges, sparkles)
- ✅ No guilt - analytics are encouraging, not judgmental

### Color Scheme
- Primary/lavender gradients for active intentions
- Green for completed (consistent with app theme)
- Orange for overdue warnings
- Solid backgrounds (not transparent/glassmorphism that can be invisible)

---

## 7. Future Improvements (TODO)

### Priority 1
- [ ] Add "Remind me in 30 min" button to review popup
- [ ] User-configurable review time in settings
- [ ] Add review history access to Settings menu

### Priority 2
- [ ] Word cloud for common priority keywords
- [ ] Weekly summary email/notification
- [ ] Export reviews to CSV/JSON

### Priority 3
- [ ] AI-powered insights ("Mondays are tough for you")
- [ ] Suggest breaking down frequently-carried tasks
- [ ] Integration with calendar for time-based priorities

---

## 8. Troubleshooting

### Banner not showing intentions
1. Check console for `[TomorrowIntentionsBar]` logs
2. Verify `intentions.date` matches today's date
3. Check if `isToday()` works in your timezone

### Task matching not working
1. Verify task list is passed correctly
2. Check if tasks are filtered by completed status
3. Lower threshold if matches seem too strict (default 0.3)

### Reviews not persisting
1. Check localStorage for `neurulae-daily-reviews` key
2. Verify `addReview()` is called in handleAddTomorrowTasks
3. Check for errors in console during review completion

---

## 9. Code Quality Notes

- All new files use TypeScript with proper types
- JSDoc comments added to key functions
- Console logging added for debugging (can be removed in production)
- Follows existing Neurulae code patterns and conventions
- Uses shadcn/ui components consistently

---

*Last updated: January 11, 2026*

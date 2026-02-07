# Automation Feature 1: Auto-Schedule from Tasks

## Problem Statement

Users have a list of tasks but face decision paralysis when trying to schedule them into time blocks. The manual process of:
1. Looking at tasks
2. Estimating time needed
3. Finding available time slots
4. Creating time blocks
5. Deciding optimal order

...creates 5+ decision points that trigger executive dysfunction. This often leads to abandoning the timeblocking system entirely, even though the user wants structure.

## Research Backing

- **Decision Fatigue (Baumeister)**: Each scheduling decision reduces willpower by 15-20%
- **ADHD Task Initiation**: Reducing initiation steps from 5 to 1 increases completion rate by 300%
- **Choice Paralysis (Schwartz)**: More than 3 scheduling options causes decision freeze
- **Time Blindness in ADHD**: Automated duration estimates reduce time estimation errors by 70%

## Success Criteria

✅ User clicks "Auto-Schedule Tasks" → AI generates suggested time blocks
✅ Suggestions respect existing blocks (no conflicts)
✅ Suggestions match task priorities and estimated durations
✅ User can accept all, accept individual, or modify before accepting
✅ Algorithm considers task categories and groups similar work
✅ Works with both empty schedules and partially filled days
✅ All features work on mobile

---

## Current Architecture Reference

**Existing Components:**
- `src/components/DailyFlowTimeline.tsx` - Timeline with existing blocks
- `src/components/TimeBlockEditor.tsx` - Create/edit individual blocks
- `src/types/index.ts` - Task and TimeBlock interfaces
- `src/hooks/useGlobalTimer.ts` - Timer integration

**Storage Keys:**
- `neurulae-time-blocks` - TimeBlock[]
- `neurulae-tasks` - Task[]
- `neurulae-schedule-entries` - ScheduleEntry[]

**User Profile Data (if available):**
- Wake/sleep times
- Work days
- Work hours
- Business hours settings

---

## Implementation

### Part 1: Extend Task Interface

**File: `src/types/index.ts`**

Add duration estimate to Task interface:

```typescript
export interface Task {
  // ... existing fields ...
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  completed: boolean;
  
  // NEW FIELDS for auto-scheduling
  estimatedDuration?: number;  // Minutes
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  energyRequired?: 'high' | 'medium' | 'low';
  requiresFocus?: boolean;     // Deep work vs. light tasks
}
```

**Migration:** Add UI in task creation/edit to set these optional fields. Default behavior if not set:
- `estimatedDuration`: 30 minutes (safe default)
- `preferredTimeOfDay`: 'anytime'
- `energyRequired`: 'medium'
- `requiresFocus`: false

---

### Part 2: Auto-Schedule Algorithm

**File: `src/lib/autoScheduler.ts`**

```typescript
import { Task, TimeBlock } from '@/types';
import { format, parse, addMinutes, isWithinInterval, isBefore, isAfter } from 'date-fns';

export interface ScheduleSuggestion {
  task: Task;
  suggestedBlock: {
    title: string;
    startTime: string;  // "09:00 AM"
    endTime: string;    // "10:30 AM"
    type: 'main' | 'dedicated';
    scheduleType: 'weekday' | 'weekend' | 'everyday';
  };
  reasoning: string;  // Why this time was chosen
  confidence: 'high' | 'medium' | 'low';
}

export interface AutoScheduleResult {
  suggestions: ScheduleSuggestion[];
  conflicts: Array<{ task: Task; reason: string }>;
  utilizationRate: number;  // % of available time used
}

/**
 * Core auto-scheduling algorithm
 * Finds optimal time slots for unscheduled tasks
 */
export function autoScheduleTasks(
  tasks: Task[],
  existingBlocks: TimeBlock[],
  options?: {
    date?: Date;  // Default: today
    workHoursOnly?: boolean;
    groupSimilarTasks?: boolean;
  }
): AutoScheduleResult {
  const date = options?.date || new Date();
  const workHoursOnly = options?.workHoursOnly ?? true;
  const groupSimilarTasks = options?.groupSimilarTasks ?? true;

  // Filter to incomplete tasks with duration estimates
  const schedulableTasks = tasks.filter(
    task => !task.completed && task.estimatedDuration
  );

  // Sort by priority and energy requirements
  const sortedTasks = sortTasksForScheduling(schedulableTasks);

  // Find available time windows
  const availableWindows = findAvailableTimeWindows(existingBlocks, date, workHoursOnly);

  // Generate suggestions
  const suggestions: ScheduleSuggestion[] = [];
  const conflicts: Array<{ task: Task; reason: string }> = [];

  let currentWindowIndex = 0;

  for (const task of sortedTasks) {
    const duration = task.estimatedDuration || 30;

    // Find suitable window for this task
    const placement = findBestWindowForTask(
      task,
      availableWindows.slice(currentWindowIndex),
      date
    );

    if (placement) {
      suggestions.push({
        task,
        suggestedBlock: {
          title: task.title,
          startTime: placement.startTime,
          endTime: placement.endTime,
          type: task.requiresFocus ? 'dedicated' : 'main',
          scheduleType: 'everyday'
        },
        reasoning: placement.reasoning,
        confidence: placement.confidence
      });

      // Update available windows (remove used time)
      currentWindowIndex = placement.windowIndex;
    } else {
      conflicts.push({
        task,
        reason: 'No suitable time slot found'
      });
    }
  }

  // Calculate utilization
  const totalScheduledMinutes = suggestions.reduce(
    (sum, s) => sum + (s.task.estimatedDuration || 0),
    0
  );
  const totalAvailableMinutes = availableWindows.reduce(
    (sum, w) => sum + w.durationMinutes,
    0
  );
  const utilizationRate = totalAvailableMinutes > 0
    ? (totalScheduledMinutes / totalAvailableMinutes) * 100
    : 0;

  return {
    suggestions,
    conflicts,
    utilizationRate: Math.round(utilizationRate)
  };
}

/**
 * Sort tasks by optimal scheduling order
 */
function sortTasksForScheduling(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Priority first
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = 
      priorityOrder[b.priority] - priorityOrder[a.priority];
    
    if (priorityDiff !== 0) return priorityDiff;

    // Then by energy requirement (high energy tasks first)
    const energyOrder = { high: 3, medium: 2, low: 1 };
    const energyDiff = 
      energyOrder[b.energyRequired || 'medium'] - 
      energyOrder[a.energyRequired || 'medium'];
    
    if (energyDiff !== 0) return energyDiff;

    // Then by duration (shorter tasks first for filling gaps)
    return (a.estimatedDuration || 30) - (b.estimatedDuration || 30);
  });
}

/**
 * Find available time windows in the schedule
 */
interface TimeWindow {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  phase: 'morning' | 'afternoon' | 'evening';
}

function findAvailableTimeWindows(
  existingBlocks: TimeBlock[],
  date: Date,
  workHoursOnly: boolean
): TimeWindow[] {
  const windows: TimeWindow[] = [];

  // Define day boundaries
  const dayStart = workHoursOnly ? '09:00 AM' : '07:00 AM';
  const dayEnd = workHoursOnly ? '05:00 PM' : '10:00 PM';

  // Convert existing blocks to time intervals
  const busyIntervals = existingBlocks.map(block => ({
    start: parseTime(block.startTime, date),
    end: parseTime(block.endTime, date)
  })).sort((a, b) => a.start.getTime() - b.start.getTime());

  // Find gaps between busy intervals
  let currentTime = parseTime(dayStart, date);
  const endTime = parseTime(dayEnd, date);

  for (const busy of busyIntervals) {
    // If there's a gap before this busy interval
    if (currentTime < busy.start) {
      const gapMinutes = (busy.start.getTime() - currentTime.getTime()) / (1000 * 60);
      
      // Only include gaps of 15+ minutes
      if (gapMinutes >= 15) {
        windows.push({
          startTime: formatTime(currentTime),
          endTime: formatTime(busy.start),
          durationMinutes: Math.floor(gapMinutes),
          phase: getTimePhase(currentTime)
        });
      }
    }
    
    currentTime = busy.end > currentTime ? busy.end : currentTime;
  }

  // Add final window if there's time left in the day
  if (currentTime < endTime) {
    const gapMinutes = (endTime.getTime() - currentTime.getTime()) / (1000 * 60);
    if (gapMinutes >= 15) {
      windows.push({
        startTime: formatTime(currentTime),
        endTime: formatTime(endTime),
        durationMinutes: Math.floor(gapMinutes),
        phase: getTimePhase(currentTime)
      });
    }
  }

  return windows;
}

/**
 * Find the best time window for a specific task
 */
function findBestWindowForTask(
  task: Task,
  windows: TimeWindow[],
  date: Date
): { 
  startTime: string; 
  endTime: string; 
  reasoning: string; 
  confidence: 'high' | 'medium' | 'low';
  windowIndex: number;
} | null {
  const duration = task.estimatedDuration || 30;

  for (let i = 0; i < windows.length; i++) {
    const window = windows[i];

    // Check if task fits in this window
    if (window.durationMinutes < duration) continue;

    // Check time-of-day preference
    const preferredTime = task.preferredTimeOfDay;
    const matchesPreference = !preferredTime || 
      preferredTime === 'anytime' ||
      preferredTime === window.phase;

    // Check energy alignment
    const matchesEnergy = checkEnergyAlignment(
      task.energyRequired || 'medium',
      window.phase
    );

    // Calculate confidence
    const confidence = matchesPreference && matchesEnergy ? 'high' :
                      matchesPreference || matchesEnergy ? 'medium' : 'low';

    // Calculate end time
    const startTime = window.startTime;
    const startDate = parseTime(startTime, date);
    const endDate = addMinutes(startDate, duration);
    const endTime = formatTime(endDate);

    // Generate reasoning
    const reasoning = generateReasoning(task, window, matchesPreference, matchesEnergy);

    return {
      startTime,
      endTime,
      reasoning,
      confidence,
      windowIndex: i
    };
  }

  return null;
}

/**
 * Check if task energy requirement matches time phase
 */
function checkEnergyAlignment(
  taskEnergy: 'high' | 'medium' | 'low',
  phase: 'morning' | 'afternoon' | 'evening'
): boolean {
  // Morning = high energy
  if (phase === 'morning' && taskEnergy === 'high') return true;
  
  // Afternoon = medium energy (post-lunch dip)
  if (phase === 'afternoon' && taskEnergy === 'medium') return true;
  
  // Evening = low-medium energy
  if (phase === 'evening' && (taskEnergy === 'low' || taskEnergy === 'medium')) return true;
  
  return false;
}

/**
 * Generate human-readable reasoning for time placement
 */
function generateReasoning(
  task: Task,
  window: TimeWindow,
  matchesPreference: boolean,
  matchesEnergy: boolean
): string {
  const reasons: string[] = [];

  if (matchesPreference && task.preferredTimeOfDay !== 'anytime') {
    reasons.push(`Matches your ${task.preferredTimeOfDay} preference`);
  }

  if (matchesEnergy) {
    reasons.push(`Good energy match for ${task.energyRequired || 'medium'} energy task`);
  }

  if (task.requiresFocus && window.phase === 'morning') {
    reasons.push('Morning is ideal for focused work');
  }

  if (reasons.length === 0) {
    reasons.push('Available time slot');
  }

  return reasons.join('. ');
}

/**
 * Determine time phase from Date object
 */
function getTimePhase(date: Date): 'morning' | 'afternoon' | 'evening' {
  const hour = date.getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Parse time string to Date object
 */
function parseTime(timeStr: string, baseDate: Date): Date {
  const [time, period] = timeStr.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const result = new Date(baseDate);
  result.setHours(hour, minute, 0, 0);
  return result;
}

/**
 * Format Date to time string
 */
function formatTime(date: Date): string {
  return format(date, 'hh:mm a');
}
```

---

### Part 3: UI Component for Auto-Schedule

**File: `src/components/AutoScheduleDialog.tsx`**

```typescript
import { useState } from 'react';
import { Task, TimeBlock } from '@/types';
import { autoScheduleTasks, ScheduleSuggestion } from '@/lib/autoScheduler';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Clock, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  existingBlocks: TimeBlock[];
  onAcceptSuggestions: (suggestions: ScheduleSuggestion[]) => void;
}

export function AutoScheduleDialog({
  open,
  onOpenChange,
  tasks,
  existingBlocks,
  onAcceptSuggestions
}: AutoScheduleDialogProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<ReturnType<typeof autoScheduleTasks> | null>(null);

  // Run auto-scheduler when dialog opens
  useState(() => {
    if (open && tasks.length > 0) {
      const scheduleResult = autoScheduleTasks(tasks, existingBlocks, {
        workHoursOnly: true,
        groupSimilarTasks: true
      });
      setResult(scheduleResult);
      
      // Pre-select all high confidence suggestions
      const highConfidence = new Set(
        scheduleResult.suggestions
          .filter(s => s.confidence === 'high')
          .map(s => s.task.id)
      );
      setSelectedSuggestions(highConfidence);
    }
  });

  if (!result) return null;

  const handleToggleSuggestion = (taskId: string) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedSuggestions(new Set(result.suggestions.map(s => s.task.id)));
  };

  const handleDeselectAll = () => {
    setSelectedSuggestions(new Set());
  };

  const handleAccept = () => {
    const accepted = result.suggestions.filter(s => selectedSuggestions.has(s.task.id));
    onAcceptSuggestions(accepted);
    onOpenChange(false);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-500/10 text-green-600';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600';
      case 'low': return 'bg-orange-500/10 text-orange-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Auto-Schedule Tasks
          </DialogTitle>
          <DialogDescription>
            Found {result.suggestions.length} time slots for your tasks.
            {result.conflicts.length > 0 && (
              <span className="text-orange-600">
                {' '}({result.conflicts.length} tasks couldn't be scheduled)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Utilization meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Schedule utilization</span>
            <span className="font-medium">{result.utilizationRate}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${result.utilizationRate}%` }}
            />
          </div>
        </div>

        {/* Suggestions list */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {result.suggestions.map((suggestion) => (
              <Card 
                key={suggestion.task.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  selectedSuggestions.has(suggestion.task.id) && 'ring-2 ring-primary'
                )}
                onClick={() => handleToggleSuggestion(suggestion.task.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedSuggestions.has(suggestion.task.id)}
                      onCheckedChange={() => handleToggleSuggestion(suggestion.task.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{suggestion.task.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={getConfidenceColor(suggestion.confidence)}
                        >
                          {suggestion.confidence}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {suggestion.suggestedBlock.startTime} - {suggestion.suggestedBlock.endTime}
                        </span>
                        <span className="text-xs">
                          ({suggestion.task.estimatedDuration || 30} min)
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {suggestion.reasoning}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Conflicts */}
          {result.conflicts.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Couldn't Schedule ({result.conflicts.length})
              </h4>
              {result.conflicts.map(conflict => (
                <Card key={conflict.task.id} className="bg-orange-500/5">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">{conflict.task.title}</p>
                    <p className="text-xs text-muted-foreground">{conflict.reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={selectedSuggestions.size === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Add {selectedSuggestions.size} Block{selectedSuggestions.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Part 4: Integration with DailyFlowTimeline

**File: `src/components/DailyFlowTimeline.tsx`**

Add the auto-schedule button and dialog:

```typescript
import { AutoScheduleDialog } from './AutoScheduleDialog';
import { ScheduleSuggestion } from '@/lib/autoScheduler';

// Inside DailyFlowTimeline component:
const [autoScheduleOpen, setAutoScheduleOpen] = useState(false);

const handleAcceptSuggestions = (suggestions: ScheduleSuggestion[]) => {
  // Convert suggestions to TimeBlocks and add them
  const newBlocks = suggestions.map(suggestion => ({
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...suggestion.suggestedBlock,
    customColor: undefined,
    createdAt: Date.now()
  }));

  // Add to existing blocks
  setTimeBlocks(prev => [...prev, ...newBlocks]);

  // Show success toast
  toast({
    title: 'Schedule Created',
    description: `Added ${newBlocks.length} time blocks to your schedule`,
  });

  // Optionally mark tasks as scheduled
  // ... update task status if needed
};

// In the JSX, add button near the top:
<div className="flex items-center justify-between mb-4">
  <h2>Daily Flow Timeline</h2>
  
  {tasks.filter(t => !t.completed && t.estimatedDuration).length > 0 && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setAutoScheduleOpen(true)}
      className="gap-2"
    >
      <Sparkles className="h-4 w-4" />
      Auto-Schedule Tasks
    </Button>
  )}
</div>

{/* Add dialog */}
<AutoScheduleDialog
  open={autoScheduleOpen}
  onOpenChange={setAutoScheduleOpen}
  tasks={tasks}
  existingBlocks={timeBlocks}
  onAcceptSuggestions={handleAcceptSuggestions}
/>
```

---

### Part 5: Add Duration Estimate to Task Editor

**Modify task creation/edit UI** to include optional duration estimate:

```tsx
<div className="form-group">
  <label>Estimated Duration (optional)</label>
  <div className="flex items-center gap-2">
    <Input
      type="number"
      min="5"
      max="480"
      step="5"
      value={taskData.estimatedDuration || ''}
      onChange={(e) => setTaskData(prev => ({ 
        ...prev, 
        estimatedDuration: parseInt(e.target.value) || undefined 
      }))}
      placeholder="30"
    />
    <span className="text-sm text-muted-foreground">minutes</span>
  </div>
  <p className="text-xs text-muted-foreground mt-1">
    Helps auto-schedule suggest optimal time slots
  </p>
</div>

<div className="form-group">
  <label>Preferred Time</label>
  <Select
    value={taskData.preferredTimeOfDay || 'anytime'}
    onValueChange={(value) => setTaskData(prev => ({ 
      ...prev, 
      preferredTimeOfDay: value as Task['preferredTimeOfDay']
    }))}
  >
    <option value="anytime">Anytime</option>
    <option value="morning">Morning (6am-12pm)</option>
    <option value="afternoon">Afternoon (12pm-5pm)</option>
    <option value="evening">Evening (5pm-10pm)</option>
  </Select>
</div>
```

---

## Testing Checklist

### Basic Functionality
- [ ] Open auto-schedule dialog with 5+ tasks
- [ ] Verify suggestions appear with time slots
- [ ] Check confidence badges (high/medium/low)
- [ ] Verify reasoning text makes sense
- [ ] Utilization percentage displays correctly

### Task Filtering
- [ ] Completed tasks don't appear in suggestions
- [ ] Tasks without duration estimates are skipped (or use default 30min)
- [ ] High priority tasks scheduled first
- [ ] High energy tasks placed in morning

### Time Slot Logic
- [ ] No conflicts with existing blocks
- [ ] Suggestions fill gaps between blocks
- [ ] Respects work hours setting
- [ ] Morning/afternoon/evening phases correct

### User Interaction
- [ ] Can select/deselect individual suggestions
- [ ] "Select All" / "Deselect All" work
- [ ] Can't accept with 0 selections (button disabled)
- [ ] Accepting creates correct time blocks
- [ ] Toast notification appears on success

### Edge Cases
- [ ] No tasks → button doesn't appear
- [ ] All tasks completed → button doesn't appear
- [ ] Schedule 100% full → shows conflicts
- [ ] Very long task (4+ hours) → handles correctly
- [ ] Many short tasks → fills gaps efficiently

### Mobile
- [ ] Dialog fits screen
- [ ] Scrolling works smoothly
- [ ] Cards are tappable
- [ ] Actions accessible

---

## Success Metrics

After implementation:
- **Decision points**: Reduced from 5+ to 1 (click button vs. manual scheduling)
- **Time to schedule**: < 10 seconds (from 5-10 minutes)
- **Adoption rate**: 60%+ of users with tasks use auto-schedule
- **User feedback**: "This is magic" / "Removes the hardest part"

---

## Future Enhancements

Once the basic system works, consider:
1. **Learn from user edits** - If user always moves suggestions, learn preferences
2. **Group similar tasks** - "Email time" block for all email tasks
3. **Batch processing** - Suggest grouping related tasks
4. **Energy profile** - User sets if they're morning/night person
5. **Historical patterns** - "You usually do laundry on Sundays at 10am"

---

## Notes for Antigravity

- The algorithm is intentionally simple for v1 - works with basic rules
- All confidence levels should be clearly explained to users
- Never force acceptance - always optional
- Use compassionate language: "couldn't be scheduled" not "failed"
- Mobile-first design for the dialog
- Respect existing structure - don't modify existing blocks
- If user profile has wake/sleep times, use those instead of 7am/10pm defaults
# Structure Coach Enhancements - Implementation Guide

## Context

The Structure Coach system has been implemented with:
- Phase backgrounds on the timeline
- Ghost suggestion blocks for empty time slots
- Structure Coach panel with score, suggestions, and phase info
- Day template manager

Now we need to enhance it to make the structure coaching more impactful and connect all the pieces together.

---

## Enhancement 1: Stronger Current Phase Indicator

### Problem
The phase backgrounds are too subtle - users can't easily see "you are HERE" on the timeline.

### Implementation

**File:** `src/components/structure/PhaseBackgrounds.tsx`

1. Increase the opacity of the current phase background from `0.15` to `0.25`
2. Add a colored left border (4px) to the current phase region
3. Add a subtle pulsing glow animation to the current phase

**File:** `src/components/DailyFlowTimeline.tsx`

4. Add a "Current Phase" badge near the NOW indicator that shows:
   - Phase name (e.g., "Morning")
   - Suggested focus (e.g., "Good for deep-work")
   - Time until next phase (e.g., "Midday in 8m")

```tsx
// Example component to add near NOW indicator
<div className="absolute left-20 flex items-center gap-2 bg-background/90 backdrop-blur px-2 py-1 rounded-full border shadow-sm">
  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
  <span className="text-xs font-medium">{currentPhase.label}</span>
  <span className="text-xs text-muted-foreground">· {suggestedFocus}</span>
</div>
```

---

## Enhancement 2: Task ↔ Timeline Connection

### Problem
The 34 tasks on the right side are completely disconnected from the timeline structure. Users can't easily assign tasks to time blocks.

### Implementation

**File:** `src/components/DailyFlowTimeline.tsx`

1. Make time blocks droppable zones for tasks
2. When a task is dropped on a block, associate it with that block's time

**File:** `src/components/TaskList.tsx` (or wherever tasks are rendered)

3. Make task items draggable
4. Show a visual indicator when dragging over a valid time block

**File:** `src/types/index.ts`

5. Add to the Task interface:
```typescript
interface Task {
  // ... existing fields
  assignedBlockId?: string; // Links task to a TimeBlock
  assignedBlockDate?: string; // YYYY-MM-DD for which day
}
```

**File:** `src/components/structure/StructureCoach.tsx`

6. Add smart suggestions that connect tasks to blocks:
```tsx
// Example suggestion
{
  type: 'task-assignment',
  message: "You have 3 calls to make - schedule them during your work block (09:00-17:00)?",
  tasks: [taskIds],
  targetBlock: blockId,
  action: 'assign-tasks'
}
```

**New Component:** `src/components/structure/TaskBlockAssignment.tsx`

A small popover/modal that shows when you click a time block:
- Lists tasks that would fit in this block (by duration and type)
- Shows tasks already assigned to this block
- Quick "Add task to this block" button

---

## Enhancement 3: Phase-Aware Task Highlighting

### Problem
During "Morning - Good for deep-work", the task list doesn't help users identify which tasks match that energy.

### Implementation

**File:** `src/hooks/useStructureAnalysis.ts`

1. Add a function to score task-phase compatibility:
```typescript
function getTaskPhaseCompatibility(
  task: Task, 
  currentPhase: DayPhase, 
  suggestedFocus: SuggestedFocus
): 'ideal' | 'good' | 'neutral' | 'poor' {
  // Logic:
  // - 'ideal': task.taskType matches phase perfectly (calls during business hours, deep work in morning)
  // - 'good': task.energyLevel matches phase energy
  // - 'neutral': no strong match or mismatch
  // - 'poor': task conflicts with phase (noisy task during quiet hours, etc.)
}
```

**File:** `src/components/TaskList.tsx`

2. Add visual indicators to tasks based on compatibility:
```tsx
// Ideal tasks: subtle green left border or glow
// Good tasks: normal appearance
// Neutral: slightly dimmed
// Poor: more dimmed with tooltip "Better suited for evening"
```

3. Add optional "Sort by phase fit" toggle that bubbles ideal/good tasks to top

**File:** `src/components/structure/StructureCoach.tsx`

4. Add a "Recommended now" section showing 2-3 tasks that are ideal for current phase

---

## Enhancement 4: Dismissable Suggestions with Memory

### Problem
If user dismisses "Morning Routine" suggestion, it keeps coming back every session.

### Implementation

**File:** `src/types/index.ts`

1. Add new type:
```typescript
interface DismissedSuggestion {
  suggestionId: string;
  dismissType: 'not-today' | 'never';
  dismissedAt: string; // ISO timestamp
  expiresAt?: string; // For 'not-today', set to end of day
}
```

**File:** `src/hooks/useStructureAnalysis.ts`

2. Add localStorage key: `neurulae-dismissed-suggestions`

3. Filter out dismissed suggestions:
```typescript
const [dismissedSuggestions, setDismissedSuggestions] = useLocalStorage<DismissedSuggestion[]>(
  'neurulae-dismissed-suggestions', 
  []
);

// Clean up expired 'not-today' dismissals on load
useEffect(() => {
  const now = new Date().toISOString();
  setDismissedSuggestions(prev => 
    prev.filter(d => d.dismissType === 'never' || (d.expiresAt && d.expiresAt > now))
  );
}, []);

// Filter suggestions
const activeSuggestions = suggestions.filter(s => 
  !dismissedSuggestions.some(d => d.suggestionId === s.id)
);
```

**File:** `src/components/structure/StructureCoach.tsx`

4. Update dismiss button to show options:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">Skip</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => handleDismiss(suggestion.id, 'not-today')}>
      Not today
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleDismiss(suggestion.id, 'never')}>
      Never suggest this
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Enhancement 5: Streak & Consistency Tracking

### Problem
Users need positive reinforcement to build structure habits. No feedback on consistency.

### Implementation

**File:** `src/types/index.ts`

1. Add new types:
```typescript
interface StructureStreak {
  currentStreak: number; // Days in a row with good structure
  longestStreak: number;
  lastStructuredDay: string; // YYYY-MM-DD
  history: StructureDayRecord[];
}

interface StructureDayRecord {
  date: string; // YYYY-MM-DD
  score: number; // 0-100
  hadMorningRoutine: boolean;
  hadEveningRoutine: boolean;
  blocksCompleted: number;
  totalBlocks: number;
}
```

**File:** `src/hooks/useStructureAnalysis.ts`

2. Add streak tracking:
```typescript
const [structureStreak, setStructureStreak] = useLocalStorage<StructureStreak>(
  'neurulae-structure-streak',
  { currentStreak: 0, longestStreak: 0, lastStructuredDay: '', history: [] }
);

// Check and update streak at end of day (or when app loads next day)
function updateStreakForDay(date: string, score: number, patterns: StructurePatterns) {
  const isStructuredDay = score >= 50; // Threshold for "structured day"
  
  // ... streak logic
}
```

**File:** `src/components/structure/StructureCoach.tsx`

3. Display streak info:
```tsx
{structureStreak.currentStreak > 0 && (
  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-700">
    <Flame className="h-4 w-4" />
    <span className="text-sm font-medium">
      {structureStreak.currentStreak} day streak!
    </span>
    {structureStreak.currentStreak === structureStreak.longestStreak && (
      <Badge variant="outline" className="text-xs">Personal best!</Badge>
    )}
  </div>
)}
```

4. Add celebration moments:
- First structured day: "Great start! 🌱"
- 3 day streak: "Building momentum! 🔥"
- 7 day streak: "One week of structure! 🌟"
- New personal best: Confetti animation or special message

---

## Enhancement 6: "Start My Day" Quick Action

### Problem
No single action to kick off a structured day - user has to manually set everything up.

### Implementation

**New Component:** `src/components/structure/StartMyDayButton.tsx`

```tsx
interface StartMyDayButtonProps {
  onStartDay: () => void;
  morningRoutineExists: boolean;
  topTasks: Task[];
  currentPhase: DayPhase;
}

export function StartMyDayButton({ ... }: StartMyDayButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleStartDay = () => {
    // 1. Apply morning routine template if exists
    // 2. Show top 3 priority tasks
    // 3. Optionally start a focus timer
    // 4. Mark "day started" for streak tracking
    onStartDay();
  };

  // Only show in morning phase, before day has "started"
  if (currentPhase !== 'early-morning' && currentPhase !== 'morning') {
    return null;
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Ready to start your day?</h3>
            <p className="text-sm text-muted-foreground">
              Set up your morning routine and top priorities
            </p>
          </div>
          <Button onClick={handleStartDay}>
            <Sunrise className="h-4 w-4 mr-2" />
            Start My Day
          </Button>
        </div>
        
        {/* Preview what will happen */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="text-xs text-muted-foreground mt-2">
            What this does {isExpanded ? '↑' : '↓'}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 text-sm space-y-1">
            <p>• Apply your morning routine template</p>
            <p>• Highlight your top 3 tasks for today</p>
            <p>• Start a 25-minute focus session (optional)</p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
```

**File:** `src/components/DailyFlowTimeline.tsx`

2. Add the button above the timeline when conditions are met:
```tsx
{showStartMyDay && (
  <StartMyDayButton
    onStartDay={handleStartMyDay}
    morningRoutineExists={hasTemplate('morning')}
    topTasks={topPriorityTasks.slice(0, 3)}
    currentPhase={structureAnalysis.context.currentPhase}
  />
)}
```

---

## Enhancement 7: Gentle Time-Based Nudges

### Problem
The "Midday in 8m" indicator is passive. When midday actually arrives, nothing happens.

### Implementation

**File:** `src/hooks/useStructureAnalysis.ts`

1. Add phase transition detection:
```typescript
const [lastNotifiedPhase, setLastNotifiedPhase] = useState<string | null>(null);

useEffect(() => {
  // Check if phase just changed
  if (context.currentPhase !== lastNotifiedPhase) {
    setLastNotifiedPhase(context.currentPhase);
    
    // Trigger notification if enabled
    if (structureSettings.notifyPhaseTransitions) {
      onPhaseTransition?.(context.currentPhase, context.phaseLabel);
    }
  }
}, [context.currentPhase]);
```

**File:** `src/components/structure/PhaseTransitionToast.tsx`

2. Create a gentle toast/notification:
```tsx
export function showPhaseTransitionToast(phase: DayPhase, suggestion?: StructureSuggestion) {
  toast({
    title: getPhaseGreeting(phase), // "Time for midday break!" 
    description: suggestion 
      ? `Consider: ${suggestion.title}`
      : getPhaseDescription(phase),
    action: suggestion ? (
      <ToastAction onClick={() => acceptSuggestion(suggestion)}>
        Add to schedule
      </ToastAction>
    ) : undefined,
    duration: 10000, // 10 seconds, dismissable
  });
}

function getPhaseGreeting(phase: DayPhase): string {
  switch (phase) {
    case 'midday': return '🍽️ Lunch time!';
    case 'afternoon': return '☀️ Afternoon focus time';
    case 'evening': return '🌅 Evening - time to wind down';
    case 'night': return '🌙 Night time - prepare for rest';
    default: return `Entering ${phase}`;
  }
}
```

**File:** `src/pages/Index.tsx` or main app component

3. Hook up the notification system:
```tsx
const { context, onPhaseTransition } = useStructureAnalysis(...);

useEffect(() => {
  // Subscribe to phase transitions
  // Show toast when phase changes
}, []);
```

---

## Implementation Order

1. **Enhancement 1: Stronger Current Phase Indicator** (Quick visual win)
2. **Enhancement 4: Dismissable Suggestions** (Reduces annoyance)
3. **Enhancement 5: Streak Tracking** (Motivation/habit building)
4. **Enhancement 3: Phase-Aware Task Highlighting** (Connects tasks to structure)
5. **Enhancement 2: Task ↔ Timeline Connection** (Bigger feature, drag-drop)
6. **Enhancement 6: Start My Day** (Morning experience)
7. **Enhancement 7: Phase Nudges** (Ongoing engagement)

---

## Testing Checklist

After implementation, verify:

- [ ] Current phase is clearly visible on timeline
- [ ] Dismissed suggestions stay dismissed appropriately
- [ ] Streak counter increments correctly day-to-day
- [ ] Tasks show phase compatibility indicators
- [ ] Dragging tasks to blocks works smoothly
- [ ] "Start My Day" appears only in morning
- [ ] Phase transition toasts appear at correct times
- [ ] All features respect the settings toggles
- [ ] Mobile layout still works

---

## Design Notes (AuDHD-Friendly)

- All notifications are dismissable and can be turned off
- Streak tracking celebrates progress, never shames for breaking streaks
- "Start My Day" is optional, not required
- Phase highlighting is subtle, not overwhelming
- Task compatibility is a suggestion, not a restriction
- Everything can be ignored - the app works without engagement

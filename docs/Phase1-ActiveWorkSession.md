# Phase 1: Active Work Session Integration - Complete Implementation

## Project Context

**App:** Neurulae - Productivity app for AuDHD individuals
**Tech Stack:** React 18.3, TypeScript, Vite, Tailwind CSS, shadcn/ui
**Current Issue:** Timer, Tasks, and Timeline operate as three disconnected systems
**Goal:** Create unified "Active Work Session" that makes starting work feel like ONE action

---

## Current State Analysis

### What Already Exists

**Global Timer Hook** (`src/hooks/useGlobalTimer.ts`):
- Tracks elapsed time
- Can link to a task (but it's optional)
- Saves sessions to localStorage
- Has pause/resume functionality

**Timeline Component** (`src/components/DailyFlowTimeline.tsx`):
- Shows scheduled TimeBlocks visually
- Has weekday/weekend toggle
- Displays NOW indicator
- Already has drag-and-drop from tasks
- Receives `activeTimerState` prop but doesn't fully use it

**Task List** (`src/components/tasks/TaskList.tsx` and related):
- Displays all tasks
- Has completion toggles
- Category filtering
- Can be dragged to timeline

**Data Flow:**
```
Timer: localStorage 'neurulae-global-timer'
Tasks: localStorage 'neurulae-tasks' 
Timeline: localStorage 'neurulae-time-blocks'
```

### The Problem

These three systems don't talk to each other in real-time:

1. You can start the timer without linking it to anything
2. You can click a timeline block but it doesn't start work on it
3. You can see all tasks but not which one is "active right now"
4. No single source of truth for "what am I currently working on?"

---

## What You Need to Build

### 1. Create Active Work Session Hook

**New File:** `src/hooks/useActiveWorkSession.ts`

**Purpose:** Single source of truth for "what am I working on right now?"

**Interface:**
```typescript
interface ActiveWorkSession {
  // What am I working on?
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  
  // Where did this start from?
  source: 'timer' | 'timeline-block' | 'task-list' | 'quick-capture';
  timelineBlockId?: string;  // If started from timeline
  
  // Time tracking
  startedAt: string;  // ISO timestamp
  estimatedDuration?: number;  // minutes
  actualElapsed: number;  // seconds (syncs with global timer)
  
  // Context (from existing temporal context)
  phase: DayPhase;  // 'morning' | 'midday' | 'afternoon' | 'evening' etc
  
  // Momentum tracking (for future phases, but include now)
  isFirstSessionOfDay: boolean;
  consecutiveSessions: number;
}

interface UseActiveWorkSessionReturn {
  // Current session (null if not working on anything)
  session: ActiveWorkSession | null;
  
  // Start work from anywhere in the app
  startWorkOn: (
    task: Task, 
    source: 'timer' | 'timeline-block' | 'task-list',
    options?: {
      blockId?: string;
      estimatedDuration?: number;
    }
  ) => void;
  
  // Pause current session
  pauseSession: () => void;
  
  // Resume current session
  resumeSession: () => void;
  
  // Complete current session
  completeSession: () => void;
  
  // Switch to different task
  switchTask: (newTask: Task, source: WorkSource) => void;
  
  // Is this task currently active?
  isTaskActive: (taskId: string) => boolean;
  
  // Is this timeline block currently active?
  isBlockActive: (blockId: string) => boolean;
}
```

**Implementation Requirements:**

1. **Integrate with existing useGlobalTimer:**
   - When `startWorkOn` is called, it should start/update the global timer
   - Sync `actualElapsed` with timer's elapsed time
   - When timer pauses, session pauses
   - When timer resumes, session resumes

2. **Use Custom Events for cross-component sync:**
   ```typescript
   // Dispatch events when session changes
   window.dispatchEvent(new CustomEvent('work-session-started', { 
     detail: session 
   }));
   
   window.dispatchEvent(new CustomEvent('work-session-paused', { 
     detail: session 
   }));
   
   window.dispatchEvent(new CustomEvent('work-session-completed', { 
     detail: { session, completedAt: new Date() }
   }));
   ```

3. **Persist to localStorage:**
   - Key: `neurulae-active-work-session`
   - Save current session so it persists across page refreshes
   - Clear when session completes

4. **Get temporal context:**
   - Import from `src/lib/temporalContext.ts` (already exists)
   - Use `getTemporalContext()` to get current phase
   - Store phase when session starts

5. **Session lifecycle:**
   ```
   Start → Active → [Pause/Resume]* → Complete
                  ↓
              Switch Task (end current, start new)
   ```

**Key Logic:**

```typescript
const startWorkOn = (task: Task, source: WorkSource, options?) => {
  // 1. End previous session if exists
  if (session) {
    completeSession();
  }
  
  // 2. Start global timer with this task
  startTimer({ 
    taskId: task.id, 
    label: task.title,
    estimatedDuration: options?.estimatedDuration || task.estimatedMinutes 
  });
  
  // 3. Create new session
  const newSession: ActiveWorkSession = {
    taskId: task.id,
    taskTitle: task.title,
    source,
    timelineBlockId: options?.blockId,
    startedAt: new Date().toISOString(),
    actualElapsed: 0,
    phase: getTemporalContext().currentPhase,
    isFirstSessionOfDay: !hasWorkedToday(), // Check if first session
    consecutiveSessions: calculateStreak(),
  };
  
  setSession(newSession);
  saveToLocalStorage(newSession);
  
  // 4. Dispatch event
  window.dispatchEvent(new CustomEvent('work-session-started', {
    detail: newSession
  }));
  
  // 5. Show toast
  toast({
    title: "🚀 Work started",
    description: task.title,
  });
};
```

---

### 2. Make Timeline Interactive

**File to Modify:** `src/components/DailyFlowTimeline.tsx`

**Changes Needed:**

#### A. Import and use the new hook

```typescript
import { useActiveWorkSession } from '@/hooks/useActiveWorkSession';

// Inside component
const { session, startWorkOn, isBlockActive } = useActiveWorkSession();
```

#### B. Make TimeBlock components clickable

Currently they're just visual. Make them interactive:

```typescript
// For each time block in the timeline
<div
  className={cn(
    "time-block",
    isBlockActive(block.id) && "active-block"
  )}
  onClick={() => handleBlockClick(block)}
  style={{ cursor: 'pointer' }}
>
  {/* existing block content */}
  
  {/* Add visual indicator if active */}
  {isBlockActive(block.id) && (
    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-green-500 animate-pulse" />
  )}
</div>
```

#### C. Implement click handler

```typescript
const handleBlockClick = (block: TimeBlock) => {
  // Find task associated with this block (if any)
  const associatedTask = scheduledTasks.find(st => 
    st.blockId === block.id && st.date === format(new Date(), 'yyyy-MM-dd')
  );
  
  if (!associatedTask) {
    // No task scheduled - show quick add dialog
    toast({
      title: "No task scheduled",
      description: "Want to add a task to this time block?",
      action: (
        <ToastAction onClick={() => openTaskPicker(block)}>
          Add Task
        </ToastAction>
      ),
    });
    return;
  }
  
  // Get full task details
  const task = tasks.find(t => t.id === associatedTask.taskId);
  if (!task) return;
  
  // Start work on this task
  startWorkOn(task, 'timeline-block', {
    blockId: block.id,
    estimatedDuration: block.duration || task.estimatedMinutes,
  });
};
```

#### D. Add visual feedback for active block

Add CSS for active state:

```typescript
// In component or separate CSS file
const activeBlockStyles = {
  border: 'border-l-4 border-l-green-500',
  background: 'bg-green-50 dark:bg-green-900/20',
  shadow: 'shadow-lg',
  ring: 'ring-2 ring-green-500 ring-opacity-50',
};
```

Apply conditionally:

```typescript
<div className={cn(
  "relative p-3 rounded-lg border transition-all",
  isBlockActive(block.id) && [
    activeBlockStyles.border,
    activeBlockStyles.background,
    activeBlockStyles.shadow,
    activeBlockStyles.ring,
  ]
)}>
```

#### E. Show quick actions on hover

```typescript
{/* Quick actions menu - shows on hover */}
<div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => handleBlockClick(block)}>
        <Play className="h-4 w-4 mr-2" />
        Start Work
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => rescheduleBlock(block)}>
        <Calendar className="h-4 w-4 mr-2" />
        Reschedule
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => markBlockDone(block)}>
        <Check className="h-4 w-4 mr-2" />
        Mark Done
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

#### F. Listen for session events

```typescript
// Update timeline when session changes
useEffect(() => {
  const handleSessionStart = (e: CustomEvent) => {
    // Force re-render to show active state
    setForceUpdate(prev => prev + 1);
  };
  
  window.addEventListener('work-session-started', handleSessionStart);
  window.addEventListener('work-session-completed', handleSessionStart);
  
  return () => {
    window.removeEventListener('work-session-started', handleSessionStart);
    window.removeEventListener('work-session-completed', handleSessionStart);
  };
}, []);
```

---

### 3. Integrate with Task List

**Files to Modify:**
- `src/components/tasks/TaskItem.tsx`
- `src/components/tasks/TaskList.tsx`

#### A. Add "Start" Button to TaskItem

**In TaskItem.tsx:**

```typescript
import { useActiveWorkSession } from '@/hooks/useActiveWorkSession';

export function TaskItem({ task, onToggle, onEdit, onDelete }: Props) {
  const { startWorkOn, isTaskActive } = useActiveWorkSession();
  const isActive = isTaskActive(task.id);
  
  return (
    <div className={cn(
      "task-item p-3 border rounded-lg transition-all",
      isActive && "border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500/50"
    )}>
      {/* Existing checkbox */}
      <Checkbox 
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
      />
      
      {/* Task title */}
      <div className="flex-1">
        <span className={cn(
          "text-sm",
          task.completed && "line-through text-muted-foreground",
          isActive && "font-semibold text-green-700 dark:text-green-300"
        )}>
          {task.title}
        </span>
        
        {/* Active indicator */}
        {isActive && (
          <Badge variant="outline" className="ml-2 border-green-500 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
            Active
          </Badge>
        )}
      </div>
      
      {/* Start button (only if not completed and not active) */}
      {!task.completed && !isActive && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => startWorkOn(task, 'task-list')}
          className="text-xs"
        >
          <Play className="h-3 w-3 mr-1" />
          Start
        </Button>
      )}
      
      {/* If active, show elapsed time */}
      {isActive && (
        <span className="text-xs text-green-600 font-mono">
          {formatElapsedTime(session.actualElapsed)}
        </span>
      )}
      
      {/* Existing edit/delete buttons */}
    </div>
  );
}
```

#### B. Auto-sort tasks to show active first

**In TaskList.tsx:**

```typescript
const { session } = useActiveWorkSession();

// Sort tasks: active first, then by priority/due date
const sortedTasks = useMemo(() => {
  return [...tasks].sort((a, b) => {
    // Active task always first
    if (session?.taskId === a.id) return -1;
    if (session?.taskId === b.id) return 1;
    
    // Then by scheduled for now (if on timeline)
    const aScheduled = isScheduledNow(a);
    const bScheduled = isScheduledNow(b);
    if (aScheduled && !bScheduled) return -1;
    if (bScheduled && !aScheduled) return 1;
    
    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    // Then by due date
    if (a.dueDate && !b.dueDate) return -1;
    if (b.dueDate && !a.dueDate) return 1;
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    
    return 0;
  });
}, [tasks, session]);
```

#### C. Listen for session events

```typescript
// Re-render when session changes
useEffect(() => {
  const handleSessionChange = () => {
    // Force re-render to update active states
    setForceUpdate(prev => prev + 1);
  };
  
  window.addEventListener('work-session-started', handleSessionChange);
  window.addEventListener('work-session-completed', handleSessionChange);
  window.addEventListener('work-session-paused', handleSessionChange);
  
  return () => {
    window.removeEventListener('work-session-started', handleSessionChange);
    window.removeEventListener('work-session-completed', handleSessionChange);
    window.removeEventListener('work-session-paused', handleSessionChange);
  };
}, []);
```

---

### 4. Update Global Timer Component

**File to Modify:** Component that uses `useGlobalTimer` (likely in TimerHub or similar)

**Changes:**

```typescript
import { useActiveWorkSession } from '@/hooks/useActiveWorkSession';

export function TimerDisplay() {
  const { session } = useActiveWorkSession();
  const timer = useGlobalTimer();
  
  return (
    <div className="timer-display">
      {/* Show linked task prominently */}
      {session && (
        <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Working on:</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {session.taskTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            Started from: {formatSource(session.source)}
          </p>
        </div>
      )}
      
      {/* Rest of timer UI */}
      {/* ... */}
    </div>
  );
}
```

---

## Implementation Checklist

### Step 1: Create the Hook
- [ ] Create `src/hooks/useActiveWorkSession.ts`
- [ ] Implement `startWorkOn` function
- [ ] Implement `pauseSession` function
- [ ] Implement `resumeSession` function
- [ ] Implement `completeSession` function
- [ ] Implement `switchTask` function
- [ ] Implement `isTaskActive` checker
- [ ] Implement `isBlockActive` checker
- [ ] Add localStorage persistence
- [ ] Add custom event dispatching
- [ ] Integrate with existing `useGlobalTimer`
- [ ] Get temporal context from existing system
- [ ] Add proper TypeScript types

### Step 2: Timeline Integration
- [ ] Import `useActiveWorkSession` in DailyFlowTimeline.tsx
- [ ] Make time blocks clickable (add onClick handlers)
- [ ] Implement `handleBlockClick` logic
- [ ] Add active block styling (green border, glow, pulse)
- [ ] Add quick actions dropdown on hover
- [ ] Add event listeners for session changes
- [ ] Test: Click block → starts timer + highlights task
- [ ] Test: Active block shows visual indicator
- [ ] Test: Multiple devices/tabs stay in sync

### Step 3: Task List Integration
- [ ] Import `useActiveWorkSession` in TaskItem.tsx
- [ ] Add "Start" button to each task
- [ ] Add active indicator (badge with pulsing dot)
- [ ] Add active task styling (green border, background)
- [ ] Show elapsed time for active task
- [ ] Implement auto-sort (active task first)
- [ ] Add event listeners in TaskList.tsx
- [ ] Test: Click "Start" → timer starts + timeline highlights
- [ ] Test: Active task sorts to top
- [ ] Test: Active indicator shows correctly

### Step 4: Timer Component Update
- [ ] Import `useActiveWorkSession` in timer component
- [ ] Show linked task info prominently
- [ ] Show source of work session
- [ ] Test: Timer shows task details when linked
- [ ] Test: Timer updates when session changes

### Step 5: Cross-Component Sync
- [ ] Test: Start from timeline → task list updates
- [ ] Test: Start from task → timeline updates
- [ ] Test: Pause timer → all components reflect pause
- [ ] Test: Complete session → all components clear active state
- [ ] Test: Switch tasks → old task deactivates, new activates
- [ ] Test: Page refresh → session persists

---

## Testing Scenarios

### Scenario 1: Start from Timeline
1. Open app with scheduled tasks
2. Click a timeline block with a task
3. **Expected:**
   - Timer starts
   - Task in task list shows "Active" badge
   - Task sorts to top of list
   - Timeline block has green border/glow
   - Toast shows "Work started"

### Scenario 2: Start from Task List
1. Open app
2. Click "Start" button on any task
3. **Expected:**
   - Timer starts
   - Task shows "Active" badge
   - Task moves to top
   - If task is scheduled on timeline, that block highlights
   - Toast shows "Work started"

### Scenario 3: Switch Tasks
1. Start working on Task A
2. Click "Start" on Task B
3. **Expected:**
   - Task A loses active state
   - Task B becomes active
   - Timer switches to Task B
   - Timeline updates if applicable
   - Toast shows task switch

### Scenario 4: Complete Session
1. Start working on a task
2. Complete the task (check it off)
3. **Expected:**
   - Active session ends
   - Timer stops
   - All active indicators clear
   - Task moves to completed section
   - Celebration toast

### Scenario 5: Page Refresh
1. Start working on a task
2. Refresh the page
3. **Expected:**
   - Session restores from localStorage
   - Timer continues (or shows paused state)
   - Active indicators reappear
   - Elapsed time accurate

---

## Code Quality Requirements

1. **TypeScript:** All new code must be fully typed, no `any`
2. **Error Handling:** Graceful failures if timer hook not available
3. **Accessibility:** All buttons have aria-labels
4. **Performance:** Use `useMemo` and `useCallback` for expensive operations
5. **Mobile:** All interactive elements have 44px minimum tap target
6. **Dark Mode:** All new UI works in both light and dark themes

---

## File Structure Reference

```
src/
├── hooks/
│   ├── useGlobalTimer.ts          [EXISTS - integrate with this]
│   ├── useActiveWorkSession.ts    [CREATE NEW]
│   └── useLocalStorage.ts         [EXISTS - use for persistence]
├── components/
│   ├── DailyFlowTimeline.tsx      [MODIFY - make interactive]
│   ├── tasks/
│   │   ├── TaskItem.tsx           [MODIFY - add Start button]
│   │   └── TaskList.tsx           [MODIFY - add sorting]
│   └── timer-hub/
│       └── [timer components]     [MODIFY - show session info]
├── lib/
│   └── temporalContext.ts         [EXISTS - use for phase detection]
└── types/
    └── index.ts                   [EXISTS - add new types here]
```

---

## Success Criteria

**This implementation is complete when:**

1. ✅ Starting work feels like ONE action (click anywhere → everything syncs)
2. ✅ There's a single source of truth for "what am I working on"
3. ✅ Timer, tasks, and timeline all show the same active state
4. ✅ Clicking a timeline block starts work on that task
5. ✅ Task list shows which task is active with visual indicator
6. ✅ Active task automatically sorts to top
7. ✅ Custom events keep all components in sync
8. ✅ Session persists across page refreshes
9. ✅ Mobile users can easily tap to start work
10. ✅ All existing functionality still works (no regressions)

---

## Additional Notes

- **Preserve existing features:** Don't break drag-and-drop, schedule entries, or any current timeline functionality
- **AuDHD-friendly:** All interactions should be low-friction (one click to start work)
- **Visual feedback:** Immediate visual response to all actions (no waiting/confusion)
- **Forgiving:** If something fails (no task found, etc), show helpful message, don't crash
- **Compassionate language:** Use "Start" not "Begin", "Active" not "Running", friendly tones in toasts

---

## Questions for Implementation

If you encounter any ambiguity:

1. **Timer behavior:** Should pausing the timer also pause the session, or keep session active?
   - **Answer:** Yes, pause both. Resume both. Keep them in sync.

2. **Multiple scheduled tasks in one block:** What if a timeline block has multiple tasks?
   - **Answer:** Show a picker dialog. Let user choose which task to start.

3. **Completing a task mid-session:** Should it auto-switch to next task?
   - **Answer:** No. End the session, show completion toast, let user decide what's next.

4. **Session duration limits:** Should sessions auto-end after X minutes?
   - **Answer:** Not in Phase 1. We'll add hyperfocus detection in Phase 2.

---

## Final Reminders

- Read the existing code first (especially useGlobalTimer and DailyFlowTimeline)
- Test each change incrementally
- Check both light and dark mode
- Test on mobile viewport
- Keep the codebase clean and well-commented
- Follow existing patterns and conventions in the codebase

**Good luck! This is the foundation that makes everything else possible.**
FixIntegration; claude

Let me analyze your app's structure and identify the disconnection issues:

## The Core Disconnection Issues

After reviewing your codebase, here's what's creating that "separate pieces" feeling:

### 1. **Timer-Task Linking is Optional, Not Natural**
Your timer system CAN link to tasks, but it doesn't feel like a natural flow. The hierarchical interval timer has the best integration (saves sessions to tasks automatically), but your standard timer requires manual task selection each time.

**The Problem:** Users have to explicitly choose to connect timer → task. It should feel like "I'm working on this task" automatically creates that connection.

### 2. **Timeline is Display-Only, Not Interactive**
Your DailyFlowTimeline shows scheduled tasks and time blocks beautifully, but it's mostly passive. You have `activeTimerState` props ready to show what's running, but there's no "click a timeline block to start working on it" flow.

**The Problem:** Timeline shows your structure, timer tracks your work, tasks list what needs doing—but they don't talk to each other in real-time.

### 3. **Three Separate "Current Focus" Systems**
- Timer knows what you're working on NOW
- Timeline shows what you PLANNED for now
- Tasks list shows EVERYTHING you need to do

None of these three systems automatically sync with each other in the moment.

### 4. **Intentions Bar Missing = No Daily Throughline**
You mentioned this isn't showing up—this is actually a critical integration piece because it was meant to be the "connective tissue" between daily planning and execution.

### 5. **Drag-and-Drop Works, But Doesn't "Connect"**
You can drag tasks to the timeline, but once they're there, starting work on them requires going back to the timer separately.

---

## How to Fix Integration: The "Current Focus" Paradigm

Here's the architectural shift needed:

### Create a Single Source of Truth: "Active Work Session"

```typescript
// New: src/hooks/useActiveWorkSession.ts
interface ActiveWorkSession {
  // What am I working on?
  taskId: string;
  taskTitle: string;
  
  // Where is this happening?
  source: 'timer' | 'timeline-block' | 'task-list' | 'intentions';
  timelineBlockId?: string; // If started from timeline
  
  // Time tracking
  startedAt: string;
  estimatedDuration?: number;
  actualElapsed: number;
  
  // Context
  phase: DayPhase; // from your temporal context
  energyLevel?: 'high' | 'medium' | 'low';
}
```

This becomes the bridge that makes everything talk to each other.

---

## Integration Patterns You Need

### Pattern 1: "Start Work" From Anywhere

**From Timeline:**
```typescript
// Click a timeline block → starts timer + marks task active
<TimelineBlock onClick={() => startWorkSession({
  taskId: block.taskId,
  source: 'timeline-block',
  timelineBlockId: block.id,
  estimatedDuration: block.duration
})} />
```

**From Task List:**
```typescript
// Click "Start" on a task → starts timer + shows in timeline
<TaskItem>
  <Button onClick={() => startWorkSession({
    taskId: task.id,
    source: 'task-list',
    estimatedDuration: task.estimatedDuration
  })}>Start</Button>
</TaskItem>
```

**From Timer:**
```typescript
// Timer already running? Attach to a task retroactively
<TimerView>
  {!activeSession.taskId && (
    <TaskPicker onChange={(task) => linkTimerToTask(task.id)} />
  )}
</TimerView>
```

### Pattern 2: Visual Sync Across All Components

When you start work on Task A:
- **Timer:** Shows Task A is running
- **Timeline:** Highlights current time + Task A block (if scheduled)
- **Task List:** Shows Task A with "🔴 Active" indicator
- **Intentions Bar:** If Task A is an intention, show progress ring

### Pattern 3: "Suggested Next Action" Based on Context

```typescript
function getSuggestedAction(context: TemporalContext, timeline, tasks) {
  const now = context.currentTime;
  const currentBlock = timeline.find(block => isHappeningNow(block, now));
  
  if (currentBlock) {
    return {
      type: 'scheduled-task',
      message: `You have "${currentBlock.title}" scheduled now`,
      action: () => startWorkSession({ taskId: currentBlock.taskId })
    };
  }
  
  if (context.currentPhase === 'morning' && !hasCompletedMorningRoutine) {
    return {
      type: 'routine',
      message: 'Start your morning routine?',
      action: () => startPlaybook('morning-routine')
    };
  }
  
  // ... etc
}
```

---

## Specific Implementation Guide

### Step 1: Create Active Work Session Hook
```typescript
// src/hooks/useActiveWorkSession.ts
export function useActiveWorkSession() {
  const globalTimer = useGlobalTimer();
  const [session, setSession] = useState<ActiveWorkSession | null>(null);
  
  const startWorkSession = useCallback((config: {
    taskId: string;
    source: ActiveWorkSession['source'];
    timelineBlockId?: string;
    estimatedDuration?: number;
  }) => {
    // Start timer if not running
    if (!globalTimer.isRunning) {
      globalTimer.startTimer({
        taskId: config.taskId,
        durationSeconds: config.estimatedDuration || 25 * 60
      });
    } else {
      // Switch task on running timer
      globalTimer.switchTask({ id: config.taskId });
    }
    
    // Create session object
    setSession({
      ...config,
      startedAt: new Date().toISOString(),
      actualElapsed: 0
    });
    
    // Notify all subscribed components
    window.dispatchEvent(new CustomEvent('work-session-started', {
      detail: config
    }));
  }, [globalTimer]);
  
  return { session, startWorkSession, endWorkSession };
}
```

### Step 2: Make Timeline Interactive
```typescript
// In DailyFlowTimeline.tsx
const { startWorkSession } = useActiveWorkSession();

// Add click handler to timeline blocks
const handleBlockClick = (block: TimeBlock) => {
  if (block.taskId) {
    startWorkSession({
      taskId: block.taskId,
      source: 'timeline-block',
      timelineBlockId: block.id,
      estimatedDuration: block.duration
    });
  }
};
```

### Step 3: Show Active State Everywhere
```typescript
// In TaskItem component
const { session } = useActiveWorkSession();
const isActive = session?.taskId === task.id;

return (
  <div className={cn(
    "task-item",
    isActive && "ring-2 ring-green-500 bg-green-50"
  )}>
    {isActive && <Badge>🔴 Active</Badge>}
    {/* rest of task */}
  </div>
);
```

### Step 4: Smart "Continue Where You Left Off"
```typescript
// On app load or dashboard mount
useEffect(() => {
  const lastSession = getLastWorkSession();
  if (lastSession && wasWithinLast30Minutes(lastSession.endedAt)) {
    showToast({
      title: "Continue working?",
      description: `You were working on "${lastSession.taskTitle}"`,
      action: <Button onClick={() => resumeSession(lastSession)}>Continue</Button>
    });
  }
}, []);
```

---

## Prompt for Antigravity

```
I need to create a unified "Active Work Session" system that connects timers, tasks, and timeline together so they feel like one cohesive tool instead of three separate features.

CURRENT PROBLEM:
- Timer can run independently OR link to a task (disconnected)
- Timeline shows scheduled blocks but can't start work from them
- Task list shows everything but doesn't reflect what's actively being worked on
- No single source of truth for "what am I doing right now?"

GOAL:
Create a central hook `useActiveWorkSession` that becomes the bridge between all three systems.

CORE CONCEPT:
When a user starts work (from anywhere), it should:
1. Start/update the global timer with that task
2. Highlight the task in the task list with "🔴 Active" badge
3. Highlight the current timeline block (if work was scheduled)
4. Store session metadata (when started, from where, estimated duration)
5. Dispatch events so all components can react

IMPLEMENTATION REQUIREMENTS:

1. NEW HOOK: `src/hooks/useActiveWorkSession.ts`
   - Manages ActiveWorkSession state
   - Integrates with existing useGlobalTimer
   - Provides startWorkSession() method
   - Handles session transitions (start, pause, end, switch task)
   - Emits events for cross-component sync

2. TIMELINE INTEGRATION:
   - Make timeline blocks clickable
   - Clicking scheduled block starts work session for that task
   - Show "pulse" animation on active timeline block
   - If timer running but no matching timeline block, show "unscheduled work" indicator

3. TASK LIST INTEGRATION:
   - Add "Start" button to each task
   - Show active indicator (colored ring, badge, icon) on active task
   - Tasks with running timers get priority sort position
   - Completed tasks during session get celebration animation

4. TIMER INTEGRATION:
   - Timer shows linked task info prominently
   - If timer started without task, show quick task picker
   - Switching tasks updates active session
   - Completing timer saves session data to task

5. CROSS-COMPONENT VISUAL SYNC:
   - When session starts: all components update instantly
   - Use event bus or context to broadcast changes
   - No component should be "source of truth" alone

6. SMART SUGGESTIONS:
   - If timeline shows scheduled task for current time, suggest starting it
   - If morning and no work active, suggest morning routine
   - If evening and tasks remain, suggest evening planning

EXISTING CODE TO INTEGRATE WITH:
- useGlobalTimer (src/hooks/useGlobalTimer.ts) - already manages timer state
- DailyFlowTimeline component - needs onClick handlers
- Task components - need active state styling
- TimerHub - needs session awareness

DATA STRUCTURE:
```typescript
interface ActiveWorkSession {
  taskId: string;
  taskTitle: string;
  source: 'timer' | 'timeline-block' | 'task-list' | 'intentions';
  timelineBlockId?: string;
  startedAt: string;
  estimatedDuration?: number;
  actualElapsed: number;
  phase: DayPhase;
}
```

Please provide:
1. Complete useActiveWorkSession hook implementation
2. Timeline integration code (making blocks clickable)
3. Task list active state handling
4. Event system for cross-component sync
5. Visual feedback patterns (CSS classes, animations)

The goal is to make it feel like "starting work" is a single action that updates the entire app, not three disconnected systems.
```


---

## PROMPT 1: Active Work Session - Core Integration System

```
I need to create a unified "Active Work Session" system that connects timers, tasks, and timeline together so they feel like one cohesive tool instead of three separate features.

CURRENT PROBLEM:
- Timer can run independently OR link to a task (disconnected)
- Timeline shows scheduled blocks but can't start work from them
- Task list shows everything but doesn't reflect what's actively being worked on
- No single source of truth for "what am I doing right now?"

GOAL:
Create a central hook `useActiveWorkSession` that becomes the bridge between all three systems.

CORE CONCEPT:
When a user starts work (from anywhere), it should:
1. Start/update the global timer with that task
2. Highlight the task in the task list with "🔴 Active" badge
3. Highlight the current timeline block (if work was scheduled)
4. Store session metadata (when started, from where, estimated duration)
5. Dispatch events so all components can react

IMPLEMENTATION REQUIREMENTS:

1. NEW HOOK: `src/hooks/useActiveWorkSession.ts`
   - Manages ActiveWorkSession state
   - Integrates with existing useGlobalTimer
   - Provides startWorkSession() method
   - Handles session transitions (start, pause, end, switch task)
   - Emits events for cross-component sync

2. TIMELINE INTEGRATION:
   - Make timeline blocks clickable
   - Clicking scheduled block starts work session for that task
   - Show "pulse" animation on active timeline block
   - If timer running but no matching timeline block, show "unscheduled work" indicator

3. TASK LIST INTEGRATION:
   - Add "Start" button to each task
   - Show active indicator (colored ring, badge, icon) on active task
   - Tasks with running timers get priority sort position
   - Completed tasks during session get celebration animation

4. TIMER INTEGRATION:
   - Timer shows linked task info prominently
   - If timer started without task, show quick task picker
   - Switching tasks updates active session
   - Completing timer saves session data to task

5. CROSS-COMPONENT VISUAL SYNC:
   - When session starts: all components update instantly
   - Use event bus or context to broadcast changes
   - No component should be "source of truth" alone

6. SMART SUGGESTIONS:
   - If timeline shows scheduled task for current time, suggest starting it
   - If morning and no work active, suggest morning routine
   - If evening and tasks remain, suggest evening planning

EXISTING CODE TO INTEGRATE WITH:
- useGlobalTimer (src/hooks/useGlobalTimer.ts) - already manages timer state
- DailyFlowTimeline component - needs onClick handlers
- Task components - need active state styling
- TimerHub - needs session awareness

DATA STRUCTURE:
```typescript
interface ActiveWorkSession {
  taskId: string;
  taskTitle: string;
  source: 'timer' | 'timeline-block' | 'task-list' | 'intentions';
  timelineBlockId?: string;
  startedAt: string;
  estimatedDuration?: number;
  actualElapsed: number;
  phase: DayPhase;
}
```

Please provide:
1. Complete useActiveWorkSession hook implementation
2. Timeline integration code (making blocks clickable)
3. Task list active state handling
4. Event system for cross-component sync
5. Visual feedback patterns (CSS classes, animations)

The goal is to make it feel like "starting work" is a single action that updates the entire app, not three disconnected systems.
```

---

## PROMPT 2: Intentions Bar Implementation & Active Work Sync

```
I need to implement the missing Intentions Bar feature that connects daily planning (from evening review) to execution (during the day). This is a critical integration piece that creates a throughline from "what I planned to do" to "what I'm actually doing."

CURRENT PROBLEM:
- Intentions bar isn't rendering on dashboard
- No connection between evening planning and morning execution
- Users lose sight of their 3 priority tasks for the day
- No visual feedback when working on an intention vs random task

GOAL:
Create an Intentions Bar that displays the 3 priority tasks set during daily review, syncs with active work sessions, and provides motivation through progress tracking.

FEATURE SPECIFICATIONS:

1. LOCATION & DESIGN:
   - Position: Top of right panel, directly under greeting, above Daily Goals
   - Visual style: Clean card with subtle emphasis (perhaps light border, soft background)
   - Layout: 3 horizontal slots, each showing one intention
   - Mobile: Stack vertically on small screens

2. INTENTION SLOT DESIGN:
   Each slot shows:
   - Checkbox (larger than normal tasks - 20px)
   - Task title (truncated if too long)
   - Optional: tiny estimated time badge
   - Active indicator (pulsing ring) if currently being worked on
   - Completion celebration (checkmark animation, confetti?)

3. EMPTY STATE:
   When no intentions set:
   ```
   ✨ Set Your Intentions
   Choose 3 priority tasks for tomorrow in Daily Review
   [Go to Daily Review] button (optional)
   ```

4. DATA FLOW:

   **Setting Intentions (Daily Review):**
   ```typescript
   // During daily review flow
   interface DailyReview {
     id: string;
     userId: string;
     date: string; // Tomorrow's date
     intentions: string[]; // Array of 3 task IDs
     completedAt: string;
   }
   
   // When user completes evening review:
   - Select exactly 3 tasks for tomorrow
   - Save to daily_reviews table
   - These become visible on dashboard next day
   ```

   **Displaying Intentions (Dashboard):**
   ```typescript
   // On dashboard load:
   - Check for today's date in daily_reviews
   - Load the 3 intention task IDs
   - Fetch full task details
   - Render in Intentions Bar
   ```

   **Syncing with Active Work:**
   ```typescript
   // When work session starts (from useActiveWorkSession):
   - Check if active task ID matches any intention
   - If yes, add visual indicator (pulse, highlight, glow)
   - Track time spent on intentions vs non-intentions
   - Update progress ring around intention
   ```

5. COMPLETION HANDLING:
   - When intention task is checked off → celebration animation
   - Update completion percentage (e.g., "2/3 intentions complete")
   - Completed intentions stay visible but show checkmark
   - Don't remove until next daily review

6. MID-DAY EDITING:
   - Allow users to swap intentions if plans change
   - Show "Edit Intentions" button (gear icon)
   - Opens modal with task picker
   - Save updated intentions
   - Maintain history for learning/analytics later

7. INTEGRATION WITH ACTIVE WORK SESSION:
   ```typescript
   // In IntentionsBar component
   const { session } = useActiveWorkSession();
   
   intentions.map(intention => ({
     ...intention,
     isActive: session?.taskId === intention.id,
     timeSpent: getTimeSpentOnTask(intention.id, today),
     progress: (timeSpent / intention.estimatedDuration) * 100
   }))
   ```

8. VISUAL STATES:
   - **Not started**: Gray checkbox, normal text
   - **Active (working on it now)**: Green pulsing ring, bold text, progress ring
   - **Completed**: Green checkmark, strikethrough, celebration emoji
   - **Abandoned (day ended, not done)**: Subtle fade, no shame

9. DATABASE SCHEMA:
   ```sql
   CREATE TABLE daily_reviews (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users NOT NULL,
     date DATE NOT NULL,
     intentions JSONB, -- Array of 3 task IDs
     reflection TEXT,
     completed_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     
     UNIQUE(user_id, date)
   );
   
   -- Example data:
   {
     "user_id": "...",
     "date": "2026-01-11",
     "intentions": ["task-id-1", "task-id-2", "task-id-3"],
     "completed_at": "2026-01-10T21:30:00Z"
   }
   ```

10. DAILY REVIEW INTEGRATION:
    - In daily review flow, add step: "Choose 3 priorities for tomorrow"
    - Show task list filtered by: not completed, realistic for tomorrow
    - User selects exactly 3 (enforce limit)
    - Preview: "These will appear as your intentions tomorrow"
    - Save to daily_reviews table with tomorrow's date

COMPONENT STRUCTURE:
```
IntentionsBar/
├── IntentionsBar.tsx (main container)
├── IntentionSlot.tsx (individual intention display)
├── IntentionEditor.tsx (modal for mid-day editing)
├── useIntentions.ts (hook for fetching/updating)
└── EmptyIntentionsState.tsx (when none set)
```

IMPLEMENTATION CHECKLIST:
□ Create daily_reviews table in Supabase
□ Add intentions selection to daily review flow
□ Create IntentionsBar component
□ Create useIntentions hook (fetch today's intentions)
□ Integrate with useActiveWorkSession for sync
□ Add visual states (active, completed, empty)
□ Add completion animations
□ Add mid-day editing capability
□ Mobile responsive design
□ Test data persistence across days

EDGE CASES TO HANDLE:
- User doesn't do daily review (no intentions set) → show empty state
- User deletes a task that was an intention → remove from intentions, show 2/3
- User completes intention outside of app → still shows as complete
- Multiple devices → sync intentions in real-time
- Midnight transition → clear yesterday's intentions, load today's

Please provide complete implementation including:
1. Database schema/migration
2. IntentionsBar component with all visual states
3. useIntentions hook
4. Integration points with useActiveWorkSession
5. Daily review selection interface
6. CSS for animations and active states
```

---

## PROMPT 3: Task List Layout Optimization with Active States

```
I need to redesign the task list layout to reduce visual bulk, improve information density, and clearly show active work states. Currently it feels "puffy" with too much scrolling, yet paradoxically underutilizes space.

CURRENT PROBLEMS:
- Each task takes too much vertical space (feels "puffy")
- Category headers add bulk
- "34 tasks remaining" feels disconnected
- Requires excessive scrolling to see all tasks
- No visual indication of which task is actively being worked on
- Completed tasks take up same space as incomplete

DESIGN GOALS:
1. Show more tasks in same space without feeling cramped
2. Make active task immediately obvious
3. Reduce vertical padding while maintaining tap targets
4. Better integrate task count with category
5. Improve visual hierarchy (priority tasks should pop)
6. Maintain AuDHD-friendly clarity

PROPOSED SOLUTIONS:

### OPTION A: Compact Density Mode
```
Key changes:
- Reduce task row height from 64px to 44px
- Tighter line-height on task text
- Smaller checkbox (16px instead of 20px)
- Category header becomes single line with count badge
- Collapse completed tasks by default

Visual mockup:
┌─────────────────────────────────────┐
│ Personal • 12 remaining ▼          │ ← Collapsible header
├─────────────────────────────────────┤
│ □ Clean bathroom              5min │ ← Compact row
│ □ Sunroom/Workshop Figuring   2hr  │
│ 🔴 Cricut Work               45min │ ← Active (colored ring)
│ ⭐ Make graphic labels        1hr  │ ← Priority (star)
│ □ Figure out room layout     30min │
│ ✓ 5 completed ▼                    │ ← Collapsed section
└─────────────────────────────────────┘

Benefits:
- ~40% more tasks visible
- Clear active indicator
- Still readable on mobile
```

### OPTION B: Two-Column for Quick Tasks
```
Key changes:
- Tasks under 15min go in 2-column grid
- Longer tasks stay single-column
- Active task always gets full width + emphasis
- Auto-reflow based on task duration

Visual mockup:
┌──────────────────┬──────────────────┐
│ □ Clean bathroom │ □ Repot flowers  │ ← Quick tasks
│ □ Message Jason  │ □ Cricut         │
├──────────────────┴──────────────────┤
│ 🔴 Sunroom/Workshop Figuring   2hr  │ ← Active (full width)
├─────────────────────────────────────┤
│ □ Figure out Art room logistics 1hr │ ← Longer tasks
│ □ Make Signs & print action plan 2hr│
└─────────────────────────────────────┘

Benefits:
- Better space utilization
- Quick tasks feel less overwhelming
- Active task gets spotlight
```

### OPTION C: Smart Priority Grouping
```
Key changes:
- Auto-group into: Now | Today | Later
- "Now" shows only: scheduled for current time, active, or high priority
- Collapse other sections by default
- Active task always in "Now" section

Visual mockup:
┌─────────────────────────────────────┐
│ ⚡ Now (3)                           │ ← Always expanded
├─────────────────────────────────────┤
│ 🔴 Cricut Work               45min  │ ← Active
│ ⏰ Workshop Figuring (2pm)     2hr  │ ← Scheduled soon
│ ⭐ Make graphic labels         1hr  │ ← High priority
├─────────────────────────────────────┤
│ 📅 Today (8) ▼                      │ ← Collapsible
├─────────────────────────────────────┤
│ 📥 Later (23) ▼                     │ ← Collapsible
└─────────────────────────────────────┘

Benefits:
- Reduced cognitive load
- Focus on what matters now
- Still see full picture when needed
```

ACTIVE STATE VISUAL DESIGN:

**Primary Active Indicator:**
- 3px green border on left side
- Subtle green background tint (green-50)
- Pulsing animation (subtle, 2s cycle)
- "🔴 Active" badge in corner
- Slightly elevated (shadow-md)

**Secondary Active Indicators:**
- Task title becomes bold
- Timer progress ring (circular, small, top-right)
- Time spent counter "23m elapsed"
- Quick action: [+5m] [Complete] [Pause]

**CSS Example:**
```css
.task-item {
  @apply border-l-0 bg-background transition-all;
}

.task-item.active {
  @apply border-l-4 border-l-green-500 bg-green-50 shadow-md;
  animation: gentle-pulse 2s ease-in-out infinite;
}

@keyframes gentle-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.95; }
}
```

CATEGORY HEADER IMPROVEMENTS:

**Before:**
```
┌─────────────────────────────────────┐
│ 👤 Personal                          │
│                                      │ ← Wasted space
│ 34 tasks remaining                   │ ← Separate line
└─────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────┐
│ 👤 Personal • 34 remaining • 12h ▼  │ ← One line, collapsible
└─────────────────────────────────────┘
```

COMPLETED TASKS HANDLING:

1. **Collapse by default**
   - Show count: "✓ 5 completed today"
   - Click to expand
   - Fade out after expansion

2. **Auto-hide after 5 minutes**
   - Celebrate immediately when checked
   - After 5min, move to collapsed section
   - Keep satisfaction, reduce clutter

3. **Separate "Done" section**
   - At bottom of task list
   - Expandable
   - Shows only today's completions

MOBILE OPTIMIZATION:

- Ensure 44px minimum tap target (iOS guideline)
- Swipe gestures: right=complete, left=delete
- Active task gets sticky positioning at top
- Double-tap task to start work session
- Long-press for quick actions menu

IMPLEMENTATION REQUIREMENTS:

1. **Task Item Component Refactor:**
   ```typescript
   interface TaskItemProps {
     task: Task;
     isActive: boolean;
     displayMode: 'compact' | 'comfortable' | 'spacious';
     showDuration: boolean;
     onStartWork: () => void;
   }
   ```

2. **Display Mode Toggle:**
   - User preference saved to localStorage
   - Quick toggle button in header
   - Icons: [≡ Compact] [= Comfortable] [≡ Spacious]

3. **Auto-Sorting Logic:**
   ```typescript
   function sortTasks(tasks, activeTaskId) {
     return tasks.sort((a, b) => {
       // Active task always first
       if (a.id === activeTaskId) return -1;
       if (b.id === activeTaskId) return 1;
       
       // Then scheduled for now
       if (isScheduledNow(a)) return -1;
       if (isScheduledNow(b)) return 1;
       
       // Then priority
       if (a.priority > b.priority) return -1;
       if (b.priority > a.priority) return 1;
       
       // Then by due date
       return compareDates(a.dueDate, b.dueDate);
     });
   }
   ```

4. **Active State Integration:**
   ```typescript
   // In TaskList component
   const { session } = useActiveWorkSession();
   
   tasks.map(task => ({
     ...task,
     isActive: session?.taskId === task.id,
     elapsedTime: session?.taskId === task.id 
       ? session.actualElapsed 
       : 0
   }))
   ```

COMPONENT FILES TO MODIFY:
- src/components/tasks/TaskItem.tsx (add active states)
- src/components/tasks/CategorySection.tsx (compact header)
- src/components/tasks/TaskList.tsx (add display modes)
- src/components/tasks/CompletedTasksSection.tsx (new component)

DESIGN SYSTEM ADDITIONS:
```typescript
// Add to theme config
const taskItemSpacing = {
  compact: 'py-2',      // 44px row
  comfortable: 'py-3',  // 56px row
  spacious: 'py-4',     // 64px row (current)
};

const activeTaskStyles = {
  border: 'border-l-4 border-l-green-500',
  background: 'bg-green-50 dark:bg-green-950',
  shadow: 'shadow-md',
  animation: 'animate-pulse-gentle'
};
```

TESTING CHECKLIST:
□ Active task always visible (doesn't scroll off)
□ Tap targets minimum 44px on mobile
□ Display mode persists across sessions
□ Active indicator clear in both light/dark mode
□ Smooth transitions between display modes
□ Performance with 100+ tasks
□ Completed tasks collapse automatically
□ Category counts update in real-time

Please provide:
1. Mockup code for all 3 layout options (A, B, C)
2. TaskItem component with active state styling
3. Display mode toggle implementation
4. Category header redesign
5. Completed tasks section component
6. Mobile swipe gesture handlers
7. Performance optimizations for long lists

I want to see all three options working so I can choose which feels best.
```

---

## PROMPT 4: Suggested Next Action Intelligence

```
I need to add intelligent "suggested next action" logic that proactively guides users on what to do based on time of day, scheduled blocks, energy patterns, and task priorities. This transforms the app from passive tool to active coach.

CURRENT PROBLEM:
- App shows everything but doesn't guide users on what to do NOW
- Users open app and feel overwhelmed by choices
- No connection between current time/context and suggested actions
- Timeline shows schedule but doesn't prompt action
- Energy levels and phases are tracked but not used for recommendations

GOAL:
Create a smart recommendation engine that suggests the most appropriate next action based on:
1. Current time and phase of day
2. Scheduled timeline blocks
3. Active intentions
4. Task priorities and deadlines
5. Recent work patterns
6. Energy levels (if tracked)

CORE CONCEPT: "What Should I Do Right Now?"

The app should be able to answer this question instantly with a single, clear suggestion.

RECOMMENDATION ENGINE LOGIC:

### Priority Hierarchy:
```typescript
function getSuggestedNextAction(context: {
  currentTime: Date;
  phase: DayPhase;
  timeline: TimeBlock[];
  intentions: Task[];
  tasks: Task[];
  recentSessions: WorkSession[];
  energyLevel?: 'high' | 'medium' | 'low';
  lastActionTaken?: WorkSession;
}) {
  // 1. URGENT: Currently scheduled block (highest priority)
  const currentBlock = timeline.find(block => 
    isHappeningNow(block, context.currentTime)
  );
  if (currentBlock && !currentBlock.isComplete) {
    return {
      type: 'scheduled-now',
      priority: 'urgent',
      message: `You have "${currentBlock.title}" scheduled right now`,
      action: () => startWorkSession(currentBlock.taskId),
      icon: '⏰',
      color: 'red'
    };
  }
  
  // 2. HIGH: Scheduled block starting within 15 minutes
  const upcomingBlock = timeline.find(block =>
    startsWithinMinutes(block, context.currentTime, 15)
  );
  if (upcomingBlock) {
    return {
      type: 'scheduled-soon',
      priority: 'high',
      message: `"${upcomingBlock.title}" starts in ${getMinutesUntil(upcomingBlock)}m`,
      action: () => startWorkSession(upcomingBlock.taskId),
      secondaryAction: () => prepareForTask(upcomingBlock.taskId),
      icon: '🔜',
      color: 'orange'
    };
  }
  
  // 3. HIGH: Uncompleted intention for the day
  const nextIntention = intentions.find(i => !i.isComplete);
  if (nextIntention) {
    return {
      type: 'intention',
      priority: 'high',
      message: `Work on today's priority: "${nextIntention.title}"`,
      action: () => startWorkSession(nextIntention.id),
      icon: '⭐',
      color: 'purple'
    };
  }
  
  // 4. MEDIUM: Phase-appropriate routine
  if (context.phase === 'morning' && !hasCompletedMorningRoutine()) {
    return {
      type: 'routine',
      priority: 'medium',
      message: 'Start your morning routine?',
      action: () => startPlaybook('morning-routine'),
      icon: '🌅',
      color: 'blue'
    };
  }
  
  if (context.phase === 'evening' && !hasCompletedEveningReview()) {
    return {
      type: 'routine',
      priority: 'medium',
      message: 'Time for evening review and planning',
      action: () => openDailyReview(),
      icon: '🌙',
      color: 'indigo'
    };
  }
  
  // 5. MEDIUM: Overdue tasks
  const overdueTask = tasks.find(t => 
    !t.isComplete && isPastDue(t.dueDate)
  );
  if (overdueTask) {
    return {
      type: 'overdue',
      priority: 'medium',
      message: `"${overdueTask.title}" is overdue`,
      action: () => startWorkSession(overdueTask.id),
      secondaryAction: () => rescheduleTask(overdueTask.id),
      icon: '⚠️',
      color: 'red'
    };
  }
  
  // 6. LOW: Energy-matched tasks
  if (context.energyLevel) {
    const matchedTask = findEnergyMatchedTask(
      tasks, 
      context.energyLevel
    );
    if (matchedTask) {
      return {
        type: 'energy-matched',
        priority: 'low',
        message: `Good time for: "${matchedTask.title}" (${context.energyLevel} energy)`,
        action: () => startWorkSession(matchedTask.id),
        icon: getEnergyIcon(context.energyLevel),
        color: 'green'
      };
    }
  }
  
  // 7. LOW: Continue previous work
  if (context.lastActionTaken && wasWithinLast30Minutes(context.lastActionTaken.endedAt)) {
    return {
      type: 'continue-previous',
      priority: 'low',
      message: `Continue "${context.lastActionTaken.taskTitle}"?`,
      action: () => resumeWorkSession(context.lastActionTaken),
      icon: '▶️',
      color: 'gray'
    };
  }
  
  // 8. LOW: Next priority task
  const nextTask = getNextPriorityTask(tasks);
  if (nextTask) {
    return {
      type: 'next-priority',
      priority: 'low',
      message: `Work on: "${nextTask.title}"`,
      action: () => startWorkSession(nextTask.id),
      icon: '📋',
      color: 'blue'
    };
  }
  
  // 9. FALLBACK: Free time suggestion
  return {
    type: 'free-time',
    priority: 'low',
    message: getPhaseAppropriateMessage(context.phase),
    action: () => openTaskPicker(),
    icon: '✨',
    color: 'purple'
  };
}
```

PHASE-APPROPRIATE MESSAGES:
```typescript
function getPhaseAppropriateMessage(phase: DayPhase): string {
  const messages = {
    'early-morning': 'Good morning! Start with your morning routine?',
    'morning': 'Great time for focused work on important tasks',
    'midday': 'Take a break or handle quick admin tasks',
    'afternoon': 'Good time for meetings and collaborative work',
    'evening': 'Wrap up loose ends and plan for tomorrow',
    'night': 'Wind down with light tasks or personal projects',
    'sleep-hours': 'Time to rest! Sleep is productive too 😴'
  };
  return messages[phase];
}
```

ENERGY-MATCHED TASK SELECTION:
```typescript
function findEnergyMatchedTask(
  tasks: Task[], 
  energyLevel: 'high' | 'medium' | 'low'
): Task | null {
  const energyRequirements = {
    high: ['deep-work', 'creative', 'problem-solving'],
    medium: ['admin', 'communication', 'planning'],
    low: ['organizing', 'reviewing', 'small-tasks']
  };
  
  return tasks
    .filter(t => !t.isComplete)
    .filter(t => energyRequirements[energyLevel].includes(t.energyType))
    .sort((a, b) => b.priority - a.priority)[0] || null;
}
```

UI IMPLEMENTATION:

### Location 1: Floating Action Button (Primary)
```
┌─────────────────────────────────────┐
│                                     │
│         [App Content]               │
│                                     │
│                                     │
│                              ┌────┐ │
│                              │ ⏰ │ │ ← Floating button
│                              └────┘ │   with icon/color
└─────────────────────────────────────┘

On click → expands to show suggestion card:
┌─────────────────────────────────────┐
│ ⏰ You have "Workshop Figuring"     │
│    scheduled right now              │
│                                     │
│ [Start Working]  [Snooze 10m]      │
└─────────────────────────────────────┘
```

### Location 2: Top Banner (Non-intrusive)
```
┌─────────────────────────────────────┐
│ ⭐ Suggested: Work on "Make labels" │
│ (Today's priority) [Start] [Dismiss]│
├─────────────────────────────────────┤
│         Regular Dashboard           │
└─────────────────────────────────────┘
```

### Location 3: Dashboard Card (Subtle)
```
┌─────────────────────────────────────┐
│ 🎯 What Should I Do Next?           │
├─────────────────────────────────────┤
│ ⏰ Currently Scheduled:              │
│    Workshop Figuring (2 hours)      │
│                                     │
│ [Start Now] [View Schedule]         │
└─────────────────────────────────────┘
```

SMART SNOOZE FEATURE:
```typescript
interface SnoozeOption {
  duration: number; // minutes
  label: string;
  rescheduleLogic?: () => void;
}

const snoozeOptions: SnoozeOption[] = [
  { duration: 5, label: '5 minutes' },
  { duration: 10, label: '10 minutes' },
  { duration: 30, label: '30 minutes' },
  { 
    duration: 60, 
    label: 'After lunch',
    rescheduleLogic: () => rescheduleToNextPhase('midday')
  },
  {
    duration: 0,
    label: 'Pick new time',
    rescheduleLogic: () => openReschedulePicker()
  }
];
```

DISMISSAL & LEARNING:
```typescript
interface SuggestionDismissal {
  suggestionId: string;
  reason: 'not-now' | 'not-interested' | 'already-done' | 'reschedule';
  timestamp: Date;
}

// Track dismissals to improve future suggestions
function learnFromDismissal(dismissal: SuggestionDismissal) {
  // If user consistently dismisses morning routine suggestions,
  // reduce frequency or change timing
  
  // If user always reschedules deep work suggestions,
  // learn their preferred deep work times
}
```

NOTIFICATION INTEGRATION:
```typescript
// When user is away from app
function sendProactiveSuggestion(context) {
  const suggestion = getSuggestedNextAction(context);
  
  if (suggestion.priority === 'urgent' || suggestion.priority === 'high') {
    sendNotification({
      title: '⏰ Time for: ' + suggestion.message,
      body: 'Tap to start',
      action: suggestion.action
    });
  }
}
```

COMPONENT STRUCTURE:
```
SuggestedAction/
├── SuggestedActionEngine.ts (logic)
├── SuggestedActionButton.tsx (FAB)
├── SuggestedActionBanner.tsx (top banner)
├── SuggestedActionCard.tsx (dashboard card)
├── useSuggestedAction.ts (hook)
└── SnoozeDialog.tsx (snooze options)
```

IMPLEMENTATION CHECKLIST:
□ Create getSuggestedNextAction logic
□ Add useSuggestedAction hook
□ Create FloatingActionButton component
□ Add top banner option
□ Create dashboard card option
□ Implement smart snooze
□ Add dismissal tracking
□ Integrate with notifications
□ Add user preferences (enable/disable, preferred UI)
□ Test all priority scenarios
□ Mobile optimization

CONFIGURATION OPTIONS:
```typescript
interface SuggestedActionSettings {
  enabled: boolean;
  displayStyle: 'fab' | 'banner' | 'card' | 'all';
  notificationsEnabled: boolean;
  snoozeDefaults: number[]; // minutes
  autoStartScheduled: boolean; // Start scheduled blocks automatically
  showOnLaunch: boolean; // Show suggestion when app opens
}
```

EDGE CASES:
- Multiple equally important suggestions → show most time-sensitive
- All intentions complete → congratulate, suggest planning tomorrow
- No scheduled blocks → use phase + energy + priority
- User is in middle of something → don't interrupt unless urgent
- Suggestion becomes invalid (task completed elsewhere) → update immediately

Please provide:
1. Complete getSuggestedNextAction function with all priority logic
2. useSuggestedAction hook
3. FloatingActionButton component with expansion
4. Banner and Card UI variants
5. Snooze dialog with smart defaults
6. Dismissal tracking system
7. Settings panel for configuration
8. Integration with existing useActiveWorkSession
9. Notification trigger logic

Goal: User opens app → immediately knows what to do next, no thinking required.
```

---

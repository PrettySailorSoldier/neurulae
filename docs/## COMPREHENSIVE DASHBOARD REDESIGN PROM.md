## COMPREHENSIVE DASHBOARD REDESIGN PROMPT FOR ANTIGRAVITY

### Context & Problem Statement

The current Neurulae dashboard has poor visual hierarchy and information architecture that creates decision paralysis for neurodivergent users. Multiple components compete equally for attention, priorities are repeated 3 times in different places, and the visual weight doesn't match functional priority.

**CRITICAL DESIGN PRINCIPLE**: For AuDHD users, the default state should be **maximally calm** - showing ONE clear next action with everything else accessible but "put away" mentally.

**Theme Note**: User has custom theme enabled. All styling MUST use CSS custom properties.

---

## New Dashboard Architecture

### Design Philosophy

```
HIERARCHY OF ATTENTION:
1. Hero Zone (75% of viewport) → What to do RIGHT NOW
2. Context Zone (15% of viewport) → Where you are in the day
3. Tools Zone (10% of viewport) → Actions available
4. Library Zone (Drawer/Hidden) → Everything else
```

### Layout Specification

#### Desktop (≥768px)

```
┌─ DASHBOARD ────────────────────────────────────────────────┐
│                                                             │
│  ┌─ HERO SECTION (Primary Focus) ────────────────────────┐ │
│  │                                                         │ │
│  │  Good Afternoon, astro.naught3    Tuesday, January 13  │ │
│  │                                                         │ │
│  │  🎯 Focus Right Now                                    │ │
│  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ │
│  │  ┃  ☐ mental health phone calls                      ┃ │ │
│  │  ┃                                                    ┃ │ │
│  │  ┃  [▶ Start 25min Focus]  [✓ Mark Complete]        ┃ │ │
│  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ │
│  │                                                         │ │
│  │  ┌─ Remaining Today ──────────────────────── [▼] ────┐ │ │
│  │  │ ☐ Call first advantage / Walmart                  │ │ │
│  │  │ ☐ unemployment stuff                              │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ TIMELINE (Visual Day Context) ────────────────────────┐ │
│  │ Morning ═══════ Afternoon ■══════ Evening              │ │
│  │ 1:05 PM | Business Hours                               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ QUICK ACTIONS ─────────────────────────────────────────┐ │
│  │ [⏱ Open Timer] [+ Add Task] [📚 Browse All (37) →]    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile (<768px)

```
┌─ DASHBOARD ──────────────┐
│                          │
│  Good Afternoon          │
│  astro.naught3           │
│  Tuesday, Jan 13         │
│                          │
│  ┏━━━━━━━━━━━━━━━━━━━━┓ │
│  ┃ 🎯 Right Now       ┃ │
│  ┃                    ┃ │
│  ┃ ☐ mental health    ┃ │
│  ┃   phone calls      ┃ │
│  ┃                    ┃ │
│  ┃ [▶ Start]  [✓]    ┃ │
│  ┗━━━━━━━━━━━━━━━━━━━━┛ │
│                          │
│  Next: Call first adv... │
│  Then: unemployment...   │
│  [▼ Show All (3)]        │
│                          │
│  ─────────────────────   │
│  Timeline (compact)      │
│  ─────────────────────   │
│                          │
│  [⏱] [+] [📚 All→]      │
│                          │
└──────────────────────────┘
```

---

## Component Architecture

### New Components to Create

#### 1. `HeroFocusCard.tsx`
**Location**: `src/components/dashboard/HeroFocusCard.tsx`

**Purpose**: Display the single current priority task with prominent actions

**Props**:
```typescript
interface HeroFocusCardProps {
  currentTask: Task | null;
  userName: string;
  onStartTimer: (task: Task) => void;
  onCompleteTask: (taskId: string) => void;
  onNextTask: () => void;
}
```

**Layout**:
```typescript
<Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/80">
  {/* Greeting Section */}
  <CardHeader>
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-semibold">
        Good {timeOfDay}, {userName}
      </h1>
      <span className="text-muted-foreground">
        {format(new Date(), 'EEEE, MMMM d')}
      </span>
    </div>
  </CardHeader>

  <CardContent className="space-y-6">
    {/* Current Priority - THE HERO ELEMENT */}
    <div className="space-y-3">
      <h2 className="text-lg font-medium text-muted-foreground">
        🎯 Focus Right Now
      </h2>
      
      {currentTask ? (
        <div className="p-6 rounded-lg border-2 border-primary bg-primary/5">
          <div className="flex items-start gap-3">
            <Checkbox 
              checked={currentTask.completed}
              onCheckedChange={() => onCompleteTask(currentTask.id)}
              className="mt-1"
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-4">
                {currentTask.title}
              </h3>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  size="lg"
                  onClick={() => onStartTimer(currentTask)}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start 25min Focus
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => onCompleteTask(currentTask.id)}
                >
                  <Check className="h-4 w-4" />
                  Mark Complete
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-muted-foreground">
          <p>No priority set for today</p>
          <Button variant="link" onClick={/* open task selector */}>
            Choose a task to focus on →
          </Button>
        </div>
      )}
    </div>

    {/* Remaining Tasks - Collapsible */}
    <RemainingTasksCollapsible tasks={remainingTasks} />
  </CardContent>
</Card>
```

#### 2. `RemainingTasksCollapsible.tsx`
**Location**: `src/components/dashboard/RemainingTasksCollapsible.tsx`

**Purpose**: Show remaining priority tasks in a collapsible section

**Props**:
```typescript
interface RemainingTasksCollapsibleProps {
  tasks: Task[]; // The other 2 priority tasks
  onTaskClick?: (task: Task) => void;
}
```

**Layout**:
```typescript
<Collapsible defaultOpen={true}>
  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg">
    <span className="text-sm font-medium text-muted-foreground">
      {tasks.length > 0 ? `Next Up (${tasks.length} more)` : 'All done! 🎉'}
    </span>
    <ChevronDown className="h-4 w-4 transition-transform" />
  </CollapsibleTrigger>
  
  <CollapsibleContent className="space-y-2 mt-2">
    {tasks.map((task, idx) => (
      <div 
        key={task.id}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
        onClick={() => onTaskClick?.(task)}
      >
        <Checkbox checked={task.completed} />
        <span className="text-muted-foreground">
          {idx === 0 ? 'Next:' : 'Then:'}
        </span>
        <span>{task.title}</span>
      </div>
    ))}
  </CollapsibleContent>
</Collapsible>
```

#### 3. `CompactTimeline.tsx`
**Location**: `src/components/dashboard/CompactTimeline.tsx`

**Purpose**: Minimal timeline showing current day phase

**Props**:
```typescript
interface CompactTimelineProps {
  currentPhase: 'morning' | 'afternoon' | 'evening';
  currentTime: string;
  scheduleType: 'weekday' | 'weekend';
}
```

**Layout** (horizontal bar with current position):
```typescript
<Card className="bg-card/50">
  <CardContent className="py-4">
    <div className="space-y-2">
      {/* Phase indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className={cn(
          "font-medium",
          currentPhase === 'morning' && "text-primary"
        )}>
          Morning
        </span>
        <span className={cn(
          "font-medium",
          currentPhase === 'afternoon' && "text-primary"
        )}>
          Afternoon
        </span>
        <span className={cn(
          "font-medium",
          currentPhase === 'evening' && "text-primary"
        )}>
          Evening
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-primary transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Current time */}
      <div className="text-center text-sm text-muted-foreground">
        {currentTime} | {scheduleType === 'weekday' ? 'Business Hours' : 'Weekend'}
      </div>
    </div>
  </CardContent>
</Card>
```

#### 4. `QuickActionBar.tsx`
**Location**: `src/components/dashboard/QuickActionBar.tsx`

**Purpose**: Main action buttons without overwhelming the view

**Props**:
```typescript
interface QuickActionBarProps {
  onOpenTimer: () => void;
  onAddTask: () => void;
  onOpenLibrary: () => void;
  totalTaskCount: number;
}
```

**Layout**:
```typescript
<div className="flex gap-3 justify-center flex-wrap">
  <Button 
    variant="outline" 
    size="lg"
    onClick={onOpenTimer}
    className="gap-2"
  >
    <Timer className="h-5 w-5" />
    Timer
  </Button>
  
  <Button 
    size="lg"
    onClick={onAddTask}
    className="gap-2"
  >
    <Plus className="h-5 w-5" />
    Add Task
  </Button>
  
  <Button 
    variant="outline"
    size="lg"
    onClick={onOpenLibrary}
    className="gap-2"
  >
    <Library className="h-5 w-5" />
    Browse All
    <Badge variant="secondary" className="ml-2">
      {totalTaskCount}
    </Badge>
  </Button>
</div>
```

#### 5. `TimerDrawer.tsx`
**Location**: `src/components/dashboard/TimerDrawer.tsx`

**Purpose**: Slide-out drawer containing the timer interface

**Props**:
```typescript
interface TimerDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedTask?: Task;
}
```

**Layout**: Use Sheet component from shadcn/ui
```typescript
<Sheet open={open} onOpenChange={onClose}>
  <SheetContent side="right" className="w-full sm:w-[400px]">
    <SheetHeader>
      <SheetTitle>Focus Timer</SheetTitle>
      <SheetDescription>
        {selectedTask ? `Working on: ${selectedTask.title}` : 'Select a task to track time'}
      </SheetDescription>
    </SheetHeader>
    
    <div className="mt-6">
      {/* Existing TimerHub component goes here */}
      <TimerHub selectedTask={selectedTask} />
    </div>
  </SheetContent>
</Sheet>
```

---

## State Management & Data Flow

### In `Index.tsx`

```typescript
// Priority task management
const [currentPriorityIndex, setCurrentPriorityIndex] = useState(0);
const dailyPriorities = useMemo(() => {
  // Get the 3 priority tasks from daily review
  const priorityIds = dailyReview?.priorities || [];
  return tasks.filter(t => priorityIds.includes(t.id)).slice(0, 3);
}, [tasks, dailyReview]);

const currentPriorityTask = dailyPriorities[currentPriorityIndex] || null;
const remainingPriorityTasks = dailyPriorities.slice(currentPriorityIndex + 1);

// UI state
const [timerDrawerOpen, setTimerDrawerOpen] = useState(false);
const [libraryDrawerOpen, setLibraryDrawerOpen] = useState(false);

// Handlers
const handleStartTimer = (task: Task) => {
  setSelectedTaskForTimer(task);
  setTimerDrawerOpen(true);
};

const handleCompleteTask = (taskId: string) => {
  // Mark task complete
  handleTaskUpdate(taskId, { completed: true });
  
  // Move to next priority
  if (currentPriorityIndex < dailyPriorities.length - 1) {
    setCurrentPriorityIndex(prev => prev + 1);
    toast.success("Great work! Moving to next priority...");
  } else {
    toast.success("All priorities complete! 🎉");
  }
};

const handleNextTask = () => {
  if (currentPriorityIndex < dailyPriorities.length - 1) {
    setCurrentPriorityIndex(prev => prev + 1);
  }
};
```

---

## Updated Dashboard Layout in `Index.tsx`

### Replace Current Dashboard Tab Content With:

```typescript
<TabsContent value="dashboard" className="space-y-4 mt-0">
  {/* HERO SECTION */}
  <HeroFocusCard
    currentTask={currentPriorityTask}
    userName={userProfile?.display_name || user?.email?.split('@')[0] || 'there'}
    remainingTasks={remainingPriorityTasks}
    onStartTimer={handleStartTimer}
    onCompleteTask={handleCompleteTask}
    onNextTask={handleNextTask}
  />

  {/* TIMELINE - Compact View */}
  <CompactTimeline
    currentPhase={getCurrentDayPhase()}
    currentTime={format(new Date(), 'h:mm a')}
    scheduleType={isWeekend(new Date()) ? 'weekend' : 'weekday'}
  />

  {/* QUICK ACTIONS */}
  <QuickActionBar
    onOpenTimer={() => setTimerDrawerOpen(true)}
    onAddTask={() => setShowQuickAdd(true)}
    onOpenLibrary={() => setLibraryDrawerOpen(true)}
    totalTaskCount={tasks.filter(t => !t.completed).length}
  />

  {/* Optional: Daily Goals Widget - MUCH smaller */}
  {showDailyGoals && (
    <Card className="bg-card/30">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Daily Progress</span>
          <Badge variant="outline">
            {completedToday.length} / {dailyPriorities.length}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )}
</TabsContent>

{/* TIMER DRAWER */}
<TimerDrawer
  open={timerDrawerOpen}
  onClose={() => setTimerDrawerOpen(false)}
  selectedTask={selectedTaskForTimer}
/>

{/* TASK LIBRARY DRAWER */}
<TaskLibrary
  open={libraryDrawerOpen}
  onClose={() => setLibraryDrawerOpen(false)}
  tasks={tasks}
  projects={projects}
  onTaskClick={(task) => {
    // Handle task selection
    setLibraryDrawerOpen(false);
  }}
/>
```

---

## Components to Remove/Modify

### REMOVE:
1. ❌ The bare numbered list at the top (lines showing "1. mental health phone calls", "2. Call first advantage", etc.)
2. ❌ `TomorrowIntentionsBar` component from dashboard tab
3. ❌ Purple "Work on today's priority" banner

### MODIFY:
1. **MobileTaskView** → Becomes `TaskLibrary` (drawer/panel component)
2. **Existing Timer components** → Move into `TimerDrawer`
3. **Daily Goals widget** → Make much smaller or remove from default view

---

## Helper Functions Needed

```typescript
// src/utils/timeHelpers.ts

export function getCurrentDayPhase(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function getTimeOfDayGreeting(): string {
  const phase = getCurrentDayPhase();
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}

export function calculateDayProgress(): number {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(6, 0, 0, 0); // Assuming 6am start
  
  const endOfDay = new Date(now);
  endOfDay.setHours(22, 0, 0, 0); // Assuming 10pm end
  
  const totalMinutes = (endOfDay.getTime() - startOfDay.getTime()) / 1000 / 60;
  const elapsedMinutes = (now.getTime() - startOfDay.getTime()) / 1000 / 60;
  
  return Math.max(0, Math.min(100, (elapsedMinutes / totalMinutes) * 100));
}
```

---

## Styling Guidelines (Theme-Safe)

### Color Hierarchy:
```css
/* Hero/Primary Focus */
.hero-focus {
  border: 2px solid hsl(var(--primary) / 0.2);
  background: linear-gradient(
    135deg, 
    hsl(var(--card)), 
    hsl(var(--card) / 0.8)
  );
}

.current-task-card {
  border: 2px solid hsl(var(--primary));
  background-color: hsl(var(--primary) / 0.05);
}

/* Timeline */
.timeline-active-phase {
  color: hsl(var(--primary));
  font-weight: 600;
}

.timeline-progress-bar {
  background-color: hsl(var(--muted));
}

.timeline-progress-fill {
  background-color: hsl(var(--primary));
}

/* Quick Action Buttons */
.action-button-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.action-button-secondary {
  border: 1px solid hsl(var(--border));
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

---

## Implementation Order

1. **Phase 1: Create new components**
   - [ ] Create `HeroFocusCard.tsx`
   - [ ] Create `RemainingTasksCollapsible.tsx`
   - [ ] Create `CompactTimeline.tsx`
   - [ ] Create `QuickActionBar.tsx`
   - [ ] Create `TimerDrawer.tsx`
   - [ ] Create helper functions in `timeHelpers.ts`

2. **Phase 2: Modify Index.tsx**
   - [ ] Add state for current priority index
   - [ ] Add drawer state management
   - [ ] Add handlers for timer, complete, next task
   - [ ] Remove old components (numbered list, TomorrowIntentionsBar, purple banner)
   - [ ] Replace dashboard content with new layout

3. **Phase 3: Test & Refine**
   - [ ] Test task completion flow
   - [ ] Test moving between priorities
   - [ ] Test timer integration
   - [ ] Test drawer behaviors
   - [ ] Test responsive breakpoints
   - [ ] Test with custom theme

---

## Testing Checklist

### Functionality:
- [ ] Hero card displays current priority correctly
- [ ] Completing a task moves to next priority
- [ ] "Next Task" button skips to next priority
- [ ] Timer drawer opens with correct task selected
- [ ] Task library drawer opens and shows all tasks
- [ ] Remaining tasks collapsible expands/collapses
- [ ] Timeline shows correct current phase
- [ ] Quick action buttons all work
- [ ] No duplicate task displays

### Visual:
- [ ] Clear visual hierarchy (hero → timeline → actions)
- [ ] Hero card is prominent and inviting
- [ ] Custom theme colors respected throughout
- [ ] Text readable against all backgrounds
- [ ] Buttons have appropriate visual weight
- [ ] Spacing feels calm and organized
- [ ] No visual clutter or competing elements

### Responsive:
- [ ] Desktop layout uses appropriate spacing
- [ ] Mobile layout is compact but readable
- [ ] Drawers work smoothly on mobile
- [ ] Touch targets are appropriately sized
- [ ] No horizontal scrolling

### UX Flow:
- [ ] Default view is calm (only 1 task visible)
- [ ] Clear what to do first
- [ ] Easy to access timer
- [ ] Easy to access full task list
- [ ] Completing tasks feels rewarding
- [ ] Moving between tasks is smooth

---

## Success Criteria

After implementation, the dashboard should:

1. ✅ **Land your eye immediately** on the ONE current priority
2. ✅ **Feel calm** - no competing visual elements
3. ✅ **Show clear next steps** without overwhelming
4. ✅ **Make tools accessible** without them dominating the view
5. ✅ **Respect the theme** - all colors via CSS custom properties
6. ✅ **Scale well** from mobile to desktop
7. ✅ **Support the workflow** - focus on one thing while keeping context available

The overall feeling should be: **"I know exactly what to do right now, and I feel capable of doing it."**

---

Would you like me to adjust anything in this prompt before you send it to Antigravity?
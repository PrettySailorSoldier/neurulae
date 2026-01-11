# ANTIGRAVITY PROMPT: Fix Playbook Timer Integration
# ANTIGRAVITY PROMPT: Fix Playbook Timer Integration

## Problem Statement

The playbook timer integration is currently broken. When users click "Start Timer" on a playbook step, nothing happens. The timer should start with the step's estimated time and display in the Focus Timer, but there's a disconnect between the PlaybookViewer/RoutineTemplate components and the global timer system.

## Current Situation Analysis

### What Currently Exists:

1. **PlaybookViewer.tsx** and **RoutineTemplate.tsx** components have an `onStartTimer` prop with signature: `(stepTitle: string, minutes: number) => void`

2. Each **PlaybookStep** has an `estimatedMinutes` field that contains the duration

3. `handleStartTimerForStep` function exists in both viewer components:
```tsx
const handleStartTimerForStep = (step: typeof playbook.steps[0]) => {
  if (onStartTimer && step.estimatedMinutes) {
    onStartTimer(step.title, step.estimatedMinutes);
  }
};
```

4. **FocusTimer** component uses `useTimerContext()` hook for managing global timer state

5. **PlaybooksTab** receives `onStartTimer` prop but it's NOT properly connected to the actual timer system

### What's Broken:

❌ The `onStartTimer` callback in PlaybooksTab is undefined or not connected to timer system
❌ When clicking "Start Timer" button in playbook steps, nothing happens
❌ No bridge exists between playbook components and the `useTimerContext()` hook
❌ Timer doesn't start, no visual feedback, no integration with Focus Timer

## Required Implementation

### STEP 1: Update Index.tsx to Connect Timer System

**File:** `src/pages/Index.tsx`

**Action:** Add timer context integration and create handler function

```tsx
// At the top of Index.tsx, add this import:
import { useTimerContext } from '@/contexts/TimerContext';

// Inside the Index component function (after other hooks), add:
const { startTimer } = useTimerContext();

// Create handler function for playbook timer starts:
const handleStartPlaybookTimer = (stepTitle: string, minutes: number) => {
  // Start timer with the step details
  startTimer({
    taskId: null, // No specific task ID - this is a playbook step
    taskTitle: stepTitle, // Use the step title
    duration: minutes * 60, // Convert minutes to seconds (timer uses seconds internally)
    source: 'playbook' // Identify source as playbook
  });
  
  // Provide user feedback
  toast.success(`Timer started: ${stepTitle}`, {
    description: `${minutes} minute${minutes !== 1 ? 's' : ''}`,
  });
};

// Find where PlaybooksTab is rendered in the component (search for <PlaybooksTab)
// Update it to include the onStartTimer prop:
<PlaybooksTab
  playbooks={playbooks}
  onAddPlaybook={handleAddPlaybook}
  onUpdatePlaybook={handleUpdatePlaybook}
  onDeletePlaybook={handleDeletePlaybook}
  onReorderPlaybooks={handleReorderPlaybooks}
  onStartTimer={handleStartPlaybookTimer} // ← ADD THIS LINE
/>
```

**Important Notes:**
- If `TimerContext` doesn't exist at that path, check `src/hooks/useTimerState.ts` or similar
- The `startTimer` function signature might be slightly different - adjust accordingly
- The timer system uses seconds, not minutes, so multiply by 60

---

### STEP 2: Verify PlaybooksTab Passes Props Correctly

**File:** `src/components/PlaybooksTab.tsx`

**Action:** Ensure `onStartTimer` is passed to viewer components

```tsx
// Find where PlaybookViewer is rendered and verify it includes onStartTimer:
<PlaybookViewer
  open={viewerOpen}
  onOpenChange={setViewerOpen}
  playbook={viewingPlaybook}
  onUpdatePlaybook={handleUpdateViewingPlaybook}
  onStartTimer={onStartTimer} // ← VERIFY THIS LINE EXISTS
/>

// If RoutineTemplate is also used, make sure it gets the prop too:
<RoutineTemplate
  open={routineOpen}
  onOpenChange={setRoutineOpen}
  playbook={viewingPlaybook}
  onUpdatePlaybook={handleUpdateViewingPlaybook}
  onStartTimer={onStartTimer} // ← ADD IF MISSING
/>
```

---

### STEP 3: Verify PlaybookViewer Implementation

**File:** `src/components/PlaybookViewer.tsx`

**Action:** Confirm the timer button and handler are correctly implemented

**Verify this function exists:**
```tsx
const handleStartTimerForStep = (step: typeof playbook.steps[0]) => {
  if (onStartTimer && step.estimatedMinutes) {
    onStartTimer(step.title, step.estimatedMinutes);
  }
};
```

**Verify the button exists in the step accordion:**
```tsx
{onStartTimer && step.estimatedMinutes && (
  <Button
    onClick={() => handleStartTimerForStep(step)}
    variant="outline"
    size="sm"
  >
    <Play className="h-3 w-3 mr-2" />
    Start Timer
  </Button>
)}
```

---

### STEP 4: Verify RoutineTemplate Implementation

**File:** `src/components/RoutineTemplate.tsx`

**Action:** Confirm the timer button and handler exist for routine-style playbooks

**Verify this function exists:**
```tsx
const handleStartTimerForStep = (step: typeof playbook.steps[0]) => {
  if (onStartTimer && step.estimatedMinutes) {
    onStartTimer(step.title, step.estimatedMinutes);
    if (step.timerEnabled) {
      // Auto-mark as started (optional)
      handleToggleStep(step.id);
    }
  }
};
```

**Verify the timer button exists:**
```tsx
{onStartTimer && currentStep.estimatedMinutes && !currentStep.completed && (
  <Button
    onClick={() => handleStartTimerForStep(currentStep)}
    variant="default"
    className="w-full"
  >
    <Play className="h-4 w-4 mr-2" />
    Start Timer for This Step
  </Button>
)}
```

---

### STEP 5: Add Enhanced Visual Feedback (Optional Enhancement)

**Enhancement:** Make it clearer when a timer has been started from a playbook

**In PlaybookViewer.tsx or RoutineTemplate.tsx:**

```tsx
const handleStartTimerForStep = (step: typeof playbook.steps[0]) => {
  if (onStartTimer && step.estimatedMinutes) {
    onStartTimer(step.title, step.estimatedMinutes);
    
    // Optional: Provide visual indication that step has started
    // Could mark step with a visual indicator or badge
    
    // Optional: Auto-scroll to timer section
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
```

---

## Testing Checklist

After implementing the fix, test the following:

### Basic Functionality:
- [ ] Open any playbook from the Playbooks tab
- [ ] Click on a playbook step to expand it
- [ ] Click the "Start Timer" button on the step
- [ ] **Expected:** Timer immediately starts with correct duration
- [ ] **Expected:** Timer shows the step title in Focus Timer component
- [ ] **Expected:** Toast notification appears confirming timer started

### Timer Integration:
- [ ] Focus Timer displays the running timer with step title
- [ ] Timer countdown works correctly (counts down from estimated minutes)
- [ ] Timer can be paused/resumed from Focus Timer
- [ ] Timer appears in Timer Hub when opened
- [ ] Timer completion triggers properly

### Multiple Playbook Types:
- [ ] Test with regular PlaybookViewer (list of all steps)
- [ ] Test with RoutineTemplate (step-by-step guided view)
- [ ] Test with steps of different durations (5 min, 15 min, 30 min, etc.)

### Edge Cases:
- [ ] What happens if timer is already running and you start another?
- [ ] What happens if step has no `estimatedMinutes`? (button should not appear)
- [ ] Can you start timer from multiple steps in sequence?

---

## Implementation Priority

1. **HIGH PRIORITY:** Step 1 (Index.tsx timer connection) - This is the core fix
2. **HIGH PRIORITY:** Step 2 (PlaybooksTab props) - Required for prop passing
3. **MEDIUM PRIORITY:** Steps 3 & 4 (Verify viewer implementations) - Likely already correct
4. **LOW PRIORITY:** Step 5 (Visual enhancements) - Nice to have, not critical

---

## Key Code Locations

```
src/
├── pages/
│   └── Index.tsx                    ← MAIN FIX HERE: Add timer handler
├── components/
│   ├── PlaybooksTab.tsx             ← Verify: Pass onStartTimer prop
│   ├── PlaybookViewer.tsx           ← Verify: Button calls handler
│   ├── RoutineTemplate.tsx          ← Verify: Button calls handler
│   └── FocusTimer.tsx               ← Reference: Uses useTimerContext
├── contexts/
│   └── TimerContext.tsx             ← Reference: Timer state management
└── types/
    └── index.ts                     ← Reference: Playbook & PlaybookStep types
```

---

## Expected Behavior After Fix

### User Flow:
1. **User opens a playbook** → Sees list of steps with estimated times
2. **User clicks "Start Timer" on Step 1** → Timer immediately starts
3. **Focus Timer shows:** "Step 1: Gather Cleaning Supplies - 10:00"
4. **Timer counts down:** 10:00 → 9:59 → 9:58...
5. **User can:** Pause, resume, or stop timer from Focus Timer
6. **When timer completes:** Optional - mark step as done automatically

### Visual Feedback:
- Toast notification: "Timer started: Step 1: Gather Cleaning Supplies" (10 minutes)
- Focus Timer shows active countdown
- Timer Hub shows active timer if opened
- Step button could change state (optional enhancement)

---

## Troubleshooting

### If timer still doesn't start:

1. **Check console for errors:**
   - Open browser dev tools (F12)
   - Look for errors when clicking "Start Timer"
   - Common issues: undefined `startTimer` function, missing context

2. **Verify TimerContext exists:**
   - Check if `src/contexts/TimerContext.tsx` exists
   - If not, timer state might be in `src/hooks/useTimerState.ts`
   - Adjust import path accordingly

3. **Check startTimer function signature:**
   - It might expect different parameters
   - Look at how FocusTimer.tsx calls startTimer
   - Match that signature in handleStartPlaybookTimer

4. **Verify prop drilling:**
   - Use React DevTools to inspect PlaybookViewer
   - Check if `onStartTimer` prop is defined (not undefined)
   - If undefined, prop is not being passed correctly

---

## Additional Context

### TypeScript Interfaces (from types/index.ts):

```typescript
interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  estimatedMinutes?: number;  // ← Used for timer duration
  completed: boolean;
  tips?: string[];
  // ... other fields
}

interface Playbook {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: PlaybookStep[];
  isTemplate?: boolean;
  // ... other fields
}
```

### Timer System Notes:
- Timer uses **seconds** internally, not minutes
- Always convert: `minutes * 60`
- Timer can be linked to a task (taskId) or standalone (taskId: null)
- Source tracking helps identify where timer was started from

---

## Success Criteria

✅ Clicking "Start Timer" in playbook step starts the timer
✅ Focus Timer displays with correct duration and step title
✅ Timer countdown works properly
✅ User receives visual feedback (toast notification)
✅ Timer can be controlled from Focus Timer
✅ Implementation doesn't break existing timer functionality for tasks
✅ Works in both PlaybookViewer and RoutineTemplate components

---

## Final Notes

- This fix primarily requires changes in **Index.tsx** (Step 1)
- Other files likely already have correct implementation
- Test thoroughly with different playbooks and step durations
- Consider adding visual indicator when step timer is active
- Document any deviations from this implementation plan

---

**Created:** January 2025
**For:** Neurulae App - Playbook Timer Integration Fix
**Priority:** High - Core feature is broken
**Estimated Fix Time:** 15-30 minutes
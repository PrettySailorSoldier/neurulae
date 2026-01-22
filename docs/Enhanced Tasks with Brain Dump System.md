
## COMPLETE IMPLEMENTATION GUIDE: Enhanced Tasks with Brain Dump System

### Project Overview
Enhance the Neurulae Tasks interface with a futuristic slide-out brain dump panel for frictionless task capture, bulk operations, and hierarchical subtask management with task details. The design should feel slick and minimal while providing powerful organizational capabilities without losing any user work.

---

## DESIGN DECISIONS (FINALIZED)

1. **Subtask Completion Behavior:** Independent - completing parent does not auto-complete subtasks. Subtasks can be completed independently for maximum flexibility.

2. **Brain Dump Persistence:** Items stay in brain dump panel even after closing. State persists across sessions (localStorage). Clear button available but no automatic clearing. Work is never lost unless explicitly cleared by user.

3. **Subtask Depth Limit:** Maximum 2 levels (parent → child only). Each task (parent or child) has a **Details section** for notes, phone numbers, links, etc. Details are collapsible and connected to specific task.

4. **Default Panel State:** Panel remembers captured items until user organizes them. State persists across browser sessions.

5. **Bulk Action Feedback:** Brief toast notification (2 seconds) with operation summary: "5 tasks moved to Work" or "3 subtasks created under 'Project Planning'"

---

## CORE COMPONENTS TO BUILD

### 1. Brain Dump Slide-Out Panel

**Visual Design:**
- Slides in from **right side** of screen (overlays tasks view)
- **Glassmorphic/frosted glass effect** background: `rgba(20, 20, 30, 0.95)` with `backdrop-filter: blur(10px)`
- Width: **400px** on desktop, **full-width** on mobile (< 768px)
- Smooth slide animation: **300ms** with `cubic-bezier(0.4, 0, 0.2, 1)` easing
- Close button (X) top-right corner
- Backdrop click to close (with confirmation if items uncategorized)
- Panel has subtle **shadow with offset hue** (color-shifted from primary)

**Header Section:**
- Animated cycling title (see Dynamic Label Rotation section)
- Item count badge: "12 items captured"
- Clear All button (icon: trash) - shows confirmation dialog before clearing

**Quick Capture Interface:**
- Large **textarea** at top of panel
- Placeholder: "Quick capture... (press Enter to add)"
- Auto-focus when panel opens
- **Enter key** creates new task item below and clears textarea
- Shift+Enter for multi-line within single task
- Character counter (subtle, bottom-right of textarea): shows at 200+ chars
- Visual feedback on capture: **subtle pulse/glow animation** (200ms)

**Captured Items Display:**
- Vertical stack below textarea
- Reorderable via **drag-and-drop** (drag handle: ⋮⋮ icon left side)
- Each item card includes:
  - Checkbox (for bulk selection)
  - Text content (click to edit inline)
  - Drag handle (left edge)
  - Delete icon (trash, appears on hover, right edge)
- Items have **staggered entrance animation** (50ms delay between each)
- Selected items have highlighted background (category color at 20% opacity)
- Hover effect: subtle lift (`transform: translateY(-2px)`, 150ms transition)

**Bulk Actions Bar:**
- Floats at **bottom of panel** (sticky position)
- Only appears when 1+ items selected
- Glassmorphic background matching panel
- Shows selection count: "3 items selected"
- Action buttons (horizontal layout):
  - **Assign to Category** (dropdown with collection icons + names)
  - **Set Due Date** (date picker inline or modal)
  - **Create as Subtasks of...** (searchable task selector)
  - **Add to [Quick Categories]** (buttons for Work, Personal, Home with icons)
  - **Clear Selection** (X icon)
  - **Delete Selected** (trash icon, requires confirmation)
- Buttons have **holographic-style glow effects** on hover
- Actions trigger **toast notification** on completion

**Panel Trigger (FAB - Floating Action Button):**
- Fixed position: **bottom-right** of Tasks view
- Offset: 24px from bottom, 24px from right
- Size: 56x56px (desktop), 48x48px (mobile)
- Icon: **lightning bolt** or **brain icon**
- Background: Primary accent color with **pulsing glow animation** (2s loop, subtle)
- Label tooltip on hover: cycles through label array (see Dynamic Label section)
- Keyboard shortcut: **Ctrl/Cmd + Shift + B**
- Z-index: ensures always on top

---

### 2. Dynamic Label Rotation (Cycling Text)

**Label Array:**
```javascript
const brainDumpLabels = [
  "Brain Dump",
  "Data Dump",
  "Knowledge Transfer",
  "Information Offload",
  "Mental Download",
  "Comprehensive Listing",
  "Thorough Compilation",
  "Exhaustive Record",
  "Detailed Inventory"
];
```

**Implementation:**
- Labels cycle every **3.5 seconds** automatically
- **Fade cross-dissolve transition:**
  - Current label fades to 0 opacity (200ms)
  - Text changes at 0 opacity
  - New label fades to 1 opacity (200ms)
- Cycle applies to:
  1. FAB tooltip/label
  2. Panel header title
  3. Bulk add button label (if separate from panel)
- Animation pauses when user is actively typing in panel
- Resets to index 0 when panel opens fresh
- State persists: remembers current label index between opens

**Technical Pattern:**
```javascript
const [labelIndex, setLabelIndex] = useState(0);

useEffect(() => {
  if (!isTyping && isPanelOpen) {
    const interval = setInterval(() => {
      setLabelIndex((prev) => (prev + 1) % brainDumpLabels.length);
    }, 3500);
    return () => clearInterval(interval);
  }
}, [isTyping, isPanelOpen]);
```

**Accessibility:**
- Stable ARIA label: `aria-label="Quick task capture panel"`
- Cycling is visual only, not announced to screen readers
- Ensure text remains readable during transition (no half-faded text)

---

### 3. Subtask System with Task Details

**Data Model Updates:**
```typescript
interface Task {
  id: string;
  title: string;
  completed: boolean;
  categoryId: string;
  dueDate?: string;
  parentId?: string | null;        // NEW: null for top-level, id for subtask
  subtasks?: Task[];               // NEW: array of child tasks (max depth 1)
  details?: string;                // NEW: notes, phone numbers, links, etc.
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

**Task Item Rendering (Hierarchical):**
- **Parent tasks:** Full opacity, bold text
- **Subtasks:** 80% opacity, regular weight, indented **24px** from parent
- Connecting lines: vertical line from parent to last subtask (1px, 30% opacity)
- Expand/collapse arrow (chevron) next to parent checkbox:
  - Only shows if task has subtasks
  - Points right when collapsed, down when expanded
  - Smooth rotation animation (200ms)
- **Subtask count badge** on parent: "2/5" (completed/total)
  - Circular badge, small font (10px)
  - Position: right side of task title
  - Color: category color at 60% opacity

**Collapsible Subtasks:**
- Click chevron or parent task title to expand/collapse
- Smooth **height animation** with `overflow: hidden`
- Expansion state persists in localStorage (keyed by taskId)
- Collapsed preview: shows first line of first 2 subtasks (faded, italic)

**Task Details Section:**
- Every task (parent or child) can have details
- **Details toggle button** (icon: note/document) appears on task hover
- Click to expand details panel below task
- Details panel includes:
  - **Rich textarea** for notes (markdown support optional)
  - Auto-grows height based on content
  - Placeholder: "Add notes, phone numbers, links..."
  - Character count at 500+ characters
  - Last edited timestamp (subtle, bottom-right)
- Details have subtle **background color** (5% category color)
- Collapsible with smooth animation
- Details icon **shows indicator dot** when task has content

**Creating Subtasks:**
- **Method 1:** Right-click parent task → "Add subtask"
- **Method 2:** Select task, press **Tab key**, enter subtask title
- **Method 3:** Drag task onto another task to nest it
- **Method 4:** From bulk actions bar - select items → "Create as subtasks of..." → select parent
- **Method 5:** In brain dump panel - select items → bulk action → "Add as subtasks"
- Maximum depth enforced: cannot create subtask of subtask (shows warning toast)

**Subtask Completion Behavior:**
- **Independent completion:** Parent and subtasks complete separately
- Completing parent does NOT auto-complete subtasks
- Subtask count badge updates when child completed
- Completing all subtasks does NOT auto-complete parent
- Visual indicator: parent with all subtasks done shows "✓ All done" badge (optional)

---

### 4. Bulk Operations System

**Multi-Selection:**
- **Individual checkboxes:** Click to toggle selection
- **Shift+click:** Range selection (first clicked → shift+clicked)
- **Ctrl/Cmd+click:** Add/remove from selection (non-contiguous)
- **Select All button** (appears in header when viewing filtered/searched tasks)
- Selected items have **highlighted background** with category color tint

**Bulk Actions Available:**
1. **Assign Category**
   - Dropdown shows all collections with icons
   - Hover preview shows category color
   - Click to assign all selected tasks
   - Toast: "5 tasks moved to Work"

2. **Set Due Date**
   - Date picker appears (inline or modal)
   - Applies same date to all selected
   - Toast: "3 tasks due date set to Jan 25"

3. **Create as Subtasks**
   - Opens task selector (searchable)
   - Selected items become subtasks of chosen parent
   - Validates: no nesting depth > 2
   - Toast: "4 subtasks added to 'Project Planning'"

4. **Add to Quick Category**
   - One-click buttons for Work, Personal, Home
   - Faster than dropdown for common categories
   - Toast: "2 tasks moved to Personal"

5. **Delete Selected**
   - Confirmation dialog: "Delete 5 tasks? This cannot be undone."
   - Confirm → removes tasks
   - Toast: "5 tasks deleted"

6. **Clear Selection**
   - Deselects all without action
   - No toast (silent)

**Bulk Actions Bar Behavior:**
- Slides up from bottom when items selected (200ms)
- Slides down when selection cleared
- Stays visible while user makes selection changes
- Dismisses on Escape key

---

### 5. Toast Notification System

**Toast Specifications:**
- Position: **Top-right** of viewport (or bottom-right on mobile)
- Duration: **2 seconds** default
- Auto-dismiss with fade-out
- Dismissible: X button or click to dismiss
- Queue system: multiple toasts stack vertically (max 3 visible)

**Toast Styling:**
- Background: Semi-transparent dark (`rgba(20, 20, 30, 0.95)`)
- Border: 1px solid with 20% white
- Backdrop blur: 5px
- Text: White, 14px
- Icon on left (✓ for success, ⓘ for info, ⚠ for warning)
- Slide-in animation from right (300ms)

**Toast Messages:**
- Success: "5 tasks moved to Work"
- Subtask creation: "3 subtasks added to 'Project Planning'"
- Bulk delete: "5 tasks deleted"
- Due date: "3 tasks due date set to Jan 25"
- Error: "Could not move tasks. Try again."

---

### 6. Futuristic UI Enhancements

**Micro-interactions:**
- **Task hover:** Subtle lift effect (`translateY(-2px)`, 150ms)
- **Checkbox completion:** Particle burst animation (5-8 particles, 400ms fade-out)
- **Category color flow:** Animated gradient along left border on hover (2s loop)
- **FAB pulse:** Subtle scale + glow animation (2s loop)
- **Panel slide:** Smooth entrance with slight overshoot for premium feel

**Visual Effects:**
- **Glassmorphism:** Frosted glass panels with backdrop blur
- **Glow effects:** Category colors at 40% opacity on hover states
- **Color-shifted shadows:** Shadow hue offset slightly from element color
- **Scanline overlay:** Subtle horizontal lines on panel (5% opacity, optional)
- **Aurora gradients:** Slow-moving gradient backgrounds on active elements

**Loading States:**
- **Skeleton screens** with shimmer effect for async data
- **Holographic spinner** for operations (rotating gradient ring)
- Smooth transitions: skeleton → actual content (no pop-in)

**Sound Effects (Optional Toggle in Settings):**
- Soft click for checkbox (subtle)
- Whoosh for panel slide-in
- Gentle chime for bulk operation success
- All sounds < 0.5 seconds duration

---

### 7. Mobile Optimization

**Brain Dump Panel - Mobile:**
- Full-width (100vw)
- Slides in from right (or bottom on very small screens)
- **Swipe right to close** (touch gesture)
- Header sticky at top when scrolling captured items
- Bulk actions bar **sticky above keyboard** when active
- FAB positioned for **thumb reach** (bottom-right, 16px offset)

**Touch Interactions:**
- Touch target sizes: **minimum 44x44px**
- Drag handles larger on mobile (easier to grab)
- Checkbox larger on mobile (24x24px vs 18x18px desktop)
- Long-press on task opens context menu (Edit, Delete, Add subtask)
- Double-tap task to quick-complete

**Responsive Breakpoints:**
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

**Mobile-Specific Adjustments:**
- Collections sidebar collapses to hamburger menu
- Task list simplified (fewer visible actions until tap)
- Details section full-width when expanded
- Subtask indent reduced to 16px (instead of 24px)

---

### 8. Keyboard Shortcuts & Accessibility

**Global Shortcuts:**
- `Ctrl/Cmd + Shift + B` - Open/close brain dump panel
- `Ctrl/Cmd + K` - Focus search (if search exists)
- `Escape` - Close panel or clear selection

**Within Brain Dump Panel:**
- `Enter` - Capture current textarea content as item
- `Shift + Enter` - New line within current item
- `Ctrl/Cmd + A` - Select all captured items
- `Escape` - Close panel (with confirmation if items exist)
- `Tab` - Navigate through interactive elements
- `Arrow keys` - Navigate item list
- `Space` - Toggle checkbox on focused item

**Within Task List:**
- `Tab` (on selected task) - Create subtask
- `Enter` (on task) - Edit task inline
- `Space` - Toggle completion
- `Delete/Backspace` - Delete focused task (with confirmation)

**Screen Reader Support:**
- **ARIA labels** on all interactive elements
- Panel announces: "Brain dump panel opened" / "Brain dump panel closed"
- Selection announces: "3 items selected"
- Bulk action announces: "5 tasks moved to Work category"
- Subtask hierarchy: "Task level 1" / "Task level 2, child of [parent]"
- Details section: "Notes and details for [task title]"
- Focus management: returns to trigger element on panel close

**Focus Indicators:**
- Visible outline on all focused elements
- High contrast outline: 2px solid, category color or white
- Skip to main content link (accessibility best practice)

---

## TECHNICAL IMPLEMENTATION

### State Management

**Global/Context State:**
```typescript
interface BrainDumpState {
  isOpen: boolean;
  capturedItems: BrainDumpItem[];
  selectedItemIds: string[];
  labelIndex: number;
}

interface BrainDumpItem {
  id: string;
  text: string;
  order: number;
  createdAt: string;
}
```

**Key Hooks to Create:**
- `useBrainDump()` - manages panel state, captured items, operations
- `useBulkActions()` - handles multi-select, bulk operations
- `useSubtasks()` - manages hierarchy, expansion state
- `useToast()` - shows/dismisses toast notifications
- `useLabelCycle()` - cycles through label array

**LocalStorage Keys:**
```
neurulae_brain_dump_items          // Persisted captured items
neurulae_subtask_expansion_state   // Which parents are expanded
neurulae_task_details_expansion    // Which task details are open
```

### Core Functions

```typescript
// Brain Dump Panel
openBrainDumpPanel(): void
closeBrainDumpPanel(force?: boolean): void  // force bypasses confirmation
captureQuickTask(text: string): void
reorderCapturedItems(fromIndex: number, toIndex: number): void
clearAllCapturedItems(): void

// Bulk Operations
selectItem(id: string): void
selectRange(startId: string, endId: string): void
clearSelection(): void
bulkAssignCategory(itemIds: string[], categoryId: string): void
bulkSetDueDate(itemIds: string[], date: string): void
bulkCreateSubtasks(itemIds: string[], parentId: string): void
bulkDelete(itemIds: string[]): void

// Subtask Management
createSubtask(parentId: string, subtaskData: Partial<Task>): void
nestTask(taskId: string, newParentId: string): void  // drag to nest
unnestTask(taskId: string): void  // promote subtask to top-level
toggleSubtasks(taskId: string): void  // expand/collapse
getSubtaskProgress(taskId: string): { completed: number, total: number }

// Task Details
saveTaskDetails(taskId: string, details: string): void
toggleDetailsExpansion(taskId: string): void

// Toast Notifications
showToast(message: string, type: 'success' | 'info' | 'warning' | 'error'): void
dismissToast(id: string): void
```

### Component Structure

```
components/
├── BrainDump/
│   ├── BrainDumpPanel.tsx          // Main panel container
│   ├── BrainDumpFAB.tsx            // Floating action button
│   ├── QuickCaptureInput.tsx       // Textarea for input
│   ├── CapturedItemsList.tsx       // List of captured items
│   ├── CapturedItem.tsx            // Individual item card
│   ├── BulkActionsBar.tsx          // Bottom action bar
│   └── CyclingLabel.tsx            // Animated text component
├── Tasks/
│   ├── TaskItem.tsx                // Enhanced with subtasks + details
│   ├── SubtaskList.tsx             // Renders child tasks
│   ├── TaskDetails.tsx             // Expandable details section
│   └── TaskHierarchy.tsx           // Connecting lines visual
├── UI/
│   ├── Toast.tsx                   // Toast notification
│   ├── ToastContainer.tsx          // Toast queue manager
│   └── ConfirmDialog.tsx           // Confirmation modals
└── hooks/
    ├── useBrainDump.ts
    ├── useBulkActions.ts
    ├── useSubtasks.ts
    ├── useToast.ts
    └── useLabelCycle.ts
```

---

## STYLING GUIDELINES

### CSS Custom Properties

```css
:root {
  /* Brain Dump Panel */
  --panel-bg: rgba(20, 20, 30, 0.95);
  --panel-backdrop-blur: 10px;
  --panel-width: 400px;
  --panel-border: 1px solid rgba(255, 255, 255, 0.2);
  
  /* Animations */
  --slide-duration: 300ms;
  --slide-easing: cubic-bezier(0.4, 0, 0.2, 1);
  --micro-duration: 150ms;
  --label-cycle-duration: 3500ms;
  
  /* Glow Effects */
  --glow-spread: 8px;
  --glow-opacity: 0.4;
  
  /* Spacing */
  --subtask-indent: 24px;
  --fab-offset: 24px;
}

@media (max-width: 768px) {
  :root {
    --panel-width: 100vw;
    --subtask-indent: 16px;
    --fab-offset: 16px;
  }
}
```

### Key Animation Classes

```css
/* Panel Slide-In */
.brain-dump-panel {
  animation: slideInRight var(--slide-duration) var(--slide-easing);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Item Entrance (staggered) */
.captured-item {
  animation: fadeSlideIn 300ms ease-out forwards;
  opacity: 0;
}

.captured-item:nth-child(1) { animation-delay: 0ms; }
.captured-item:nth-child(2) { animation-delay: 50ms; }
.captured-item:nth-child(3) { animation-delay: 100ms; }
/* ... continue pattern */

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* FAB Pulse Glow */
.fab-pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--accent-color);
  }
  50% {
    box-shadow: 0 0 var(--glow-spread) calc(var(--glow-spread) / 2) 
                var(--accent-color);
  }
}

/* Checkbox Particle Burst */
.particle {
  animation: burstParticle 400ms ease-out forwards;
}

@keyframes burstParticle {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) scale(0);
  }
}

/* Label Cycle Fade */
.label-cycle {
  animation: labelFade 400ms ease-in-out;
}

@keyframes labelFade {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

---

## TESTING CHECKLIST

### Automated/Quick Tests

**1. Rapid Capture Test**
- [ ] Open brain dump panel (Ctrl+Shift+B)
- [ ] Enter rapidly 20 times with different text
- [ ] Verify all items captured without lag or dropped inputs
- [ ] Verify items appear in correct order (newest at bottom)
- [ ] Check DevTools: no memory leaks, no console errors

**2. Bulk Operations Test**
- [ ] Select 5 items with individual checkboxes
- [ ] Shift-click for range selection (first → last)
- [ ] Ctrl/Cmd-click for non-contiguous selection
- [ ] Assign to "Work" category → verify all updated
- [ ] Set due date to "tomorrow" → verify all have date
- [ ] Delete 2 selected items → verify removal + toast

**3. Subtask Creation Test**
- [ ] Create parent task "Project Planning"
- [ ] Add 3 subtasks via Tab key method
- [ ] Add 2 more via brain dump bulk action
- [ ] Verify hierarchy renders with proper indentation
- [ ] Verify connecting lines display
- [ ] Toggle collapse/expand → smooth animation
- [ ] Complete 2 subtasks → verify badge shows "2/5"

**4. Subtask Depth Limit Test**
- [ ] Create parent with subtask
- [ ] Try to create subtask of subtask (should fail)
- [ ] Verify warning toast appears: "Maximum nesting depth reached"
- [ ] Drag subtask onto another subtask → should not nest

**5. Task Details Test**
- [ ] Add details to parent task (notes, phone number)
- [ ] Verify details save on blur
- [ ] Verify indicator dot appears on details icon
- [ ] Add details to subtask → verify independent from parent
- [ ] Toggle details expansion → smooth animation
- [ ] Close and reopen app → verify details persist

**6. Brain Dump Persistence Test**
- [ ] Add 5 items to brain dump
- [ ] Close panel without organizing
- [ ] Refresh page
- [ ] Open panel → verify 5 items still there
- [ ] Clear browser localStorage
- [ ] Refresh → verify panel starts empty

**7. Drag-Drop Test**
- [ ] Reorder items within brain dump (drag handles)
- [ ] Drag task onto another task to nest
- [ ] Drag subtask out to top-level (unnest)
- [ ] Move tasks between categories via drag
- [ ] Verify ghost preview shows during drag

**8. Label Cycling Test**
- [ ] Open panel → note starting label
- [ ] Wait 3.5 seconds → verify label changes
- [ ] Verify smooth fade transition
- [ ] Type in textarea → verify cycling pauses
- [ ] Stop typing → verify cycling resumes after 3.5s

### Manual Verification

**1. Visual Polish Check**
- [ ] Glassmorphic effect: backdrop blur visible and smooth
- [ ] Animations: 60fps (check DevTools Performance tab)
- [ ] FAB pulse glow: premium look, not garish
- [ ] Label cycling: smooth, readable throughout transition
- [ ] Particle burst: fires on checkbox click, looks satisfying
- [ ] Task hover lift: smooth, not jarring
- [ ] Category colors: visible and consistent throughout UI
- [ ] Shadows: proper color shift, not plain black/gray

**2. Animation Quality Check**
- [ ] Panel slide in/out: exactly 300ms, smooth easing
- [ ] Item entrance: staggered (not all at once)
- [ ] Subtask expand/collapse: height animates smoothly
- [ ] Checkbox animation: crisp, satisfying feedback
- [ ] Toast slide-in: smooth from right
- [ ] No animation jank on lower-end devices

**3. Mobile Responsiveness (< 768px)**
- [ ] Panel full-width on mobile
- [ ] Swipe right to close works
- [ ] Touch targets minimum 44x44px (test with finger)
- [ ] FAB positioned for thumb (bottom-right, not obscured)
- [ ] Bulk actions bar sticky above keyboard
- [ ] No horizontal scroll on any screen size
- [ ] Long-press task opens context menu

**4. Keyboard Accessibility**
- [ ] Ctrl/Cmd + Shift + B opens panel
- [ ] Tab navigates through all interactive elements in order
- [ ] Escape closes panel from anywhere inside
- [ ] Enter in textarea captures item
- [ ] Arrow keys navigate captured items list
- [ ] Space toggles checkbox when item focused
- [ ] All interactive elements have visible focus outline

**5. Screen Reader Accessibility (test with VoiceOver/NVDA)**
- [ ] Panel open/close announced
- [ ] Selection count announced: "3 items selected"
- [ ] Bulk action results announced
- [ ] Task hierarchy communicated: "Level 1" / "Level 2"
- [ ] Details section properly labeled
- [ ] Toast messages announced
- [ ] Cycling label does NOT spam screen reader (stable ARIA label)

**6. Edge Cases**
- [ ] Empty brain dump: helpful message or visual
- [ ] 100+ items in brain dump: still performant
- [ ] Very long task titles: ellipsis, no text overflow
- [ ] Special characters: `<>&"'`, emoji, unicode display correctly
- [ ] Rapid open/close panel: no React errors
- [ ] Offline mode: graceful handling (show message)

**7. Integration Points**
- [ ] Tasks from brain dump appear in main Tasks view immediately
- [ ] Category assignment syncs with Collections sidebar
- [ ] Completed tasks update collection counts
- [ ] Task search includes organized brain dump tasks
- [ ] Due dates visible if timeline/calendar integrated
- [ ] Details saved across all views (Task list, brain dump)

### Performance Benchmarks

**Target Metrics:**
- [ ] Panel open time: **< 100ms**
- [ ] Item capture (Enter → visible): **< 50ms**
- [ ] Bulk operation (10 items): **< 200ms**
- [ ] Render 50 tasks: **< 16ms per frame** (60fps)
- [ ] Drag operation: maintain **60fps throughout**
- [ ] Memory usage: **< 50MB increase** for 200 tasks

**Tools:** Chrome DevTools Performance tab, React DevTools Profiler

### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, including iOS Safari)
- [ ] Chrome Android
- [ ] Samsung Internet (if targeting Android users)

---

## IMPLEMENTATION PHASES

| Phase | Components | Duration | Checkpoint |
|-------|-----------|----------|------------|
| **1** | `useBrainDump` hook<br>`BrainDumpPanel`<br>`BrainDumpFAB`<br>Quick capture with Enter | 2 days | Can rapidly capture 20 items, panel persists on close |
| **2** | `BulkActionsBar`<br>Multi-select (checkbox, shift, ctrl)<br>Category assignment<br>Toast system | 2 days | Can select 5 items and assign to category with toast feedback |
| **3** | Subtask data model<br>`SubtaskList` component<br>Hierarchical rendering<br>Expand/collapse<br>2-level depth enforcement | 3 days | Can create parent with 5 subtasks, toggle expansion |
| **4** | `TaskDetails` component<br>Details textarea<br>Save/load details<br>Expansion state | 1 day | Can add notes to any task, details persist |
| **5** | Glassmorphic styling<br>Label cycling animation<br>Particle effects<br>Hover micro-interactions<br>Glow effects | 2 days | All animations smooth at 60fps, looks premium |
| **6** | Keyboard shortcuts<br>Mobile responsive adjustments<br>ARIA labels<br>Focus management<br>Error handling | 2 days | All tests passing, fully accessible |

**Total Estimated Duration:** 12 days

---

## PRE-IMPLEMENTATION CHECKLIST

Before starting, ensure:
- [ ] Current Tasks system stable (no breaking changes planned)
- [ ] localStorage available and tested
- [ ] Toast notification system exists OR will be built in Phase 2
- [ ] Category/collection system accessible via context/props
- [ ] Drag-drop library chosen (react-beautiful-dnd, dnd-kit, or native)
- [ ] Date picker library chosen (if not using native input)
- [ ] Icon library includes: lightning, brain, trash, chevron, note icons

---

## COMMON PITFALLS TO AVOID

1. **Animation Performance:**
   - Use `transform` and `opacity` only (GPU accelerated)
   - Avoid animating `height` directly (use `max-height` or scale)
   - Add `will-change` hint for animations

2. **State Management:**
   - Don't mutate captured items array directly (use immutable updates)
   - Sync localStorage after every state change (debounce if needed)
   - Handle race conditions in async bulk operations

3. **Accessibility:**
   - Don't rely on color alone for state (use icons too)
   - Ensure sufficient contrast (WCAG AA minimum)
   - Test with actual screen reader, not just ARIA validator

4. **Mobile:**
   - Test on real devices, not just browser DevTools
   - Account for iOS Safari bottom bar (use `env(safe-area-inset-bottom)`)
   - Prevent body scroll when panel open (modal behavior)

5. **Data Persistence:**
   - Handle localStorage quota exceeded errors
   - Provide export/backup option for power users
   - Clear corrupted data gracefully (don't crash app)

---

## SUCCESS CRITERIA

This implementation is considered complete when:

✅ User can rapidly capture 20+ items without any dropped inputs or lag  
✅ Brain dump items persist across sessions and browser refreshes  
✅ Bulk operations work smoothly with visual feedback (toasts)  
✅ Subtask hierarchy renders correctly with 2-level depth limit  
✅ Task details system fully functional and persistent  
✅ Label cycling animation smooth and readable  
✅ All animations run at 60fps on mid-range devices  
✅ Keyboard navigation works throughout (no mouse required)  
✅ Screen reader can use all features effectively  
✅ Mobile experience optimized (touch targets, gestures)  
✅ No console errors or warnings in production build  
✅ All tests in checklist passing

---

## FINAL NOTES

- **Iterate in small steps:** Build one phase at a time, test thoroughly before moving forward
- **User feedback loop:** Test with real users (especially neurodivergent folks) early and often
- **Keep it simple:** If a feature feels too complex, simplify or defer to later version
- **Performance first:** 60fps is non-negotiable for premium feel
- **Accessibility is not optional:** WCAG AA compliance minimum

This is a **substantial feature set**. Estimate ~2 weeks for full implementation with polish. Prioritize core functionality (Phases 1-3) before visual polish (Phases 4-5) if timeline is tight.

---

**Ready to paste into Antigravity!** 🚀

This prompt is comprehensive, unambiguous, and includes all your design decisions. Antigravity should be able to build this systematically without needing much clarification. The phased approach lets you validate each piece before moving forward.
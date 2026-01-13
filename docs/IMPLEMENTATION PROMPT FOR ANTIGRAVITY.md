IMPLEMENTATION PROMPT FOR ANTIGRAVITY
-fixesContext
Neurulae is a neurodivergent-friendly productivity app with a dashboard that currently has duplicate display issues and needs better task organization. IMPORTANT: User has a custom theme enabled - all styling must properly respect CSS custom properties and not hardcode colors or transparency values.
Problems to Fix
1. Duplicate Priority Tasks Display
Current Issue: The 3 priority tasks from the daily review are showing TWICE:

Once at the very top of the page as a numbered list (1, 2, 3)
Again in the "Today's Intentions" section on the dashboard card

Required Fix:

Remove the numbered list at the top of the page completely OR move it to be part of the dashboard card
Keep only ONE display of the 3 priority tasks
Whichever display you keep should be visually prominent and easy to access

2. Task List Organization Enhancement
Current Issue: All tasks are shown in categories (like "Personal" with 37 tasks), but there's no clear way to focus on just today's priorities vs browsing all tasks.
Required Enhancement:
Add a toggle or tab system in the task view area that allows switching between:

"Focus Mode" - Shows only today's 3 priority tasks + any other tasks marked for today
"All Tasks" - Shows the full category view with all tasks (current behavior)

The toggle should be:

Visually clear and easy to switch
Remember the last selected mode (localStorage)
Default to "Focus Mode" for new users

Technical Requirements
Theme Compatibility (CRITICAL):
typescript// All components MUST use CSS custom properties for colors/backgrounds
// DO NOT hardcode any color values or opacity
// Examples of CORRECT usage:
style={{
  backgroundColor: 'hsl(var(--card))',
  color: 'hsl(var(--card-foreground))',
  borderColor: 'hsl(var(--border))'
}}

// Available CSS custom properties to use:
// --background, --foreground
// --card, --card-foreground
// --primary, --primary-foreground
// --secondary, --secondary-foreground
// --muted, --muted-foreground
// --accent, --accent-foreground
// --border, --input, --ring
File Locations:

Main dashboard: src/pages/Index.tsx
Daily review components: Look for DailyReview or similar component
Task list components: src/components/TaskList.tsx and related category components
Use existing shadcn/ui components for tabs/toggles
Store view mode preference in localStorage with key neurulae-task-view-mode

Component Requirements:

Use existing Button, Tabs, or Toggle components from shadcn/ui
Maintain all existing functionality (task completion, editing, etc.)
Ensure proper responsive behavior for mobile
Use Tailwind utility classes with the cn() helper for consistent styling

Implementation Steps

Remove Duplicate Priority Display:

Locate where the top-level numbered priority list is rendered
Either remove it entirely OR integrate it into the dashboard card
Ensure the remaining display is visually prominent


Add Focus/All Tasks Toggle:

Add state management for view mode:



typescript     const [taskViewMode, setTaskViewMode] = useLocalStorage<'focus' | 'all'>(
       'neurulae-task-view-mode',
       'focus'
     );

Create toggle UI using shadcn/ui Tabs or custom Button group
Filter task display based on mode:

Focus: Show only priority tasks + tasks with dueDate === today
All: Show existing category view




Style Considerations:

Ensure toggle/tab component respects custom theme colors
Test that text remains readable against themed backgrounds
Verify border and accent colors work with custom theme
DO NOT use fixed opacity values - let theme control transparency



Testing Checklist

 Priority tasks appear only once on the page
 Toggle switches between Focus and All Tasks views
 Focus mode shows only relevant tasks
 All Tasks mode shows full category breakdown
 View mode persists after page refresh
 Custom theme colors are properly respected
 Text remains readable in both light and custom themes
 Mobile responsive behavior works correctly
 Existing task interactions (complete, edit, delete) still work

Design Notes

Keep the overall dashboard layout clean and uncluttered
Focus mode should feel calming and manageable (max 3-10 tasks visible)
All Tasks mode can be more comprehensive but should remain organized
Use visual hierarchy to make priority tasks stand out in Focus mode
Consider adding a subtle indicator showing which mode is active
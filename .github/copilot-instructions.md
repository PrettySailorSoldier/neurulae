# Copilot Instructions for Neurulae

This document guides AI agents in contributing to Neurulae, an AI-powered productivity platform for managing complex schedules with variable commitments (classes, work, flexible tasks).

## Architecture Overview

**Neurulae** is a full-stack React + Supabase application with AI-powered task scheduling and coaching.

### Tech Stack
- **Frontend**: React 18.3 + TypeScript, Vite, Tailwind CSS, shadcn/ui (30+ Radix UI components)
- **Backend**: Supabase PostgreSQL + Edge Functions (Deno)
- **AI**: Gemini 2.5 Flash via Lovable Cloud
- **State**: React Context (Auth, Premium), React Query, localStorage with Supabase sync

### Key Files Structure
```
src/
├── pages/Index.tsx           # Main dashboard (1400+ lines, handles all app state)
├── components/AIAssistant.tsx # AI chat with action execution (800+ lines)
├── contexts/AuthContext.tsx   # Supabase auth + session management
├── contexts/PremiumContext.tsx # Subscription/role checks
├── hooks/
│   ├── useSyncedStorage.ts   # localStorage + Supabase bidirectional sync
│   ├── useAIChat.ts          # AI message handling + action parsing (500 lines)
│   └── useLocalStorage.ts    # Core state persistence
├── services/syncService.ts   # Cloud sync queue + conflict resolution
└── integrations/supabase/
    ├── client.ts             # Auto-generated Supabase client
    └── types.ts              # Auto-generated DB types (650+ lines)
supabase/functions/
├── ai-assistant/             # Main AI chat endpoint (Gemini 2.5)
├── organize-tasks/           # AI task scheduling with constraints
├── parse-schedule/           # PDF parsing → schedule entries
└── manage-time-blocks/       # CRUD for recurring time blocks
```

## Critical Data Flows

### 1. **State Hierarchy** (localStorage → Supabase)
- `useLocalStorage()` wraps all major state (tasks, timeBlocks, playbooks, etc.)
- `useSyncedStorage()` extends it with Supabase sync for authenticated users
- Changes auto-sync to `user_data` table (debounced via `syncService.queueSync()`)
- **Key enums in types.ts**: `data_type_enum` lists all syncable types (tasks, projects, reminderWidgets, etc.)

### 2. **AI Action Execution Pipeline**
User message → `useAIChat.sendMessage()` → `/ai-assistant` Edge Function → AI parses context:
- Available time blocks, tasks, playbooks
- User profile (coaching style, wake/sleep times, living situation)
- Today's schedule from `get_todays_schedule()` SQL function

AI response includes JSON action blocks like:
```json
{"action": "create_task", "data": {"title": "...", "priority": "high", ...}}
```
Actions are **extracted and executed** in `useAIChat()`, then propagated to component callbacks.

### 3. **Schedule & Time Management**
- **`recurring_time_blocks`** table: Weekly repeating (classes, work shifts) with `day_of_week` (0-6) + `start_time`/`end_time` (HH:MM)
- **`schedule_entries`** table: One-time events with full ISO 8601 datetimes + optional recurrence patterns
- AI uses available time windows to recommend task slots (see `calculateAvailableWindows()` in AIAssistant.tsx)
- **No naive task scheduling**: Respect fixed commitments from recurring blocks

## Development Workflows

### Build & Serve
```bash
npm run dev          # Start Vite on port 8080 (http://localhost:8080)
npm run build        # Production build to dist/
npm run build:dev    # Dev build (keeps source maps)
npm run lint         # ESLint check (lenient config, many rules off)
npm run preview      # Test production build locally
```

### Database Access
```bash
# Supabase types auto-generate from migrations
# Edit migrations in supabase/migrations/
# After pushing, rebuild:
supabase link           # Connect to project
supabase db pull        # Generate types.ts from schema
```

### Environment Setup
- Uses Lovable for automatic CI/CD commits
- `.env.local` required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Auto-confirm email signups in development mode

## Code Patterns & Conventions

### Component Structure
- **Root page component** (pages/Index.tsx) manages all application state and passes callbacks down
- **Controlled components**: Widgets accept data + callbacks (`onUpdate`, `onAdd`, `onDelete`)
- **No global Redux**: Only Context (Auth, Premium) for cross-cutting concerns
- **shadcn/ui**: Always use existing component library (Button, Card, Dialog, Tabs, etc.)

### Data Types (types/index.ts)
All major entities have strict TypeScript interfaces:
- `Task`: `id, name, status, priority, estimatedMinutes, dueDate, type, createdAt`
- `TimeBlock`: `id, title, startTime, endTime, category, createdAt`
- `Playbook`: `id, title, description, category, steps[], createdAt`
- See `src/types/index.ts` for full definitions

### AI & Edge Functions
- **All AI calls go through `/ai-assistant` Edge Function** (don't call Gemini API directly)
- Context passed as JSON: `{tasks, timeBlocks, playbooks, userProfile, todaySchedule, availableWindows}`
- Function handles date formatting (uses `Today is Nov 28, 2025` convention) and action parsing
- **Advisory mode**: Response-only chat (no action parsing) when `is_advisory=true`

### Form & Validation
- **react-hook-form** + **zod** for validation
- Example pattern in ProfileSetupDialog.tsx
- Always validate before API calls

### Premium Features
- Check `usePremium()` hook: `isPremium`, `plan`, `isAdmin`
- Feature limits enforced in `useFeatureLimit()` hook
- Free tier limits specified per feature (e.g., max 5 playbooks)

### Syncing & Conflicts
- **Device-aware**: Each user session gets `device_id`
- `sync_metadata` tracks `last_sync_timestamp` per device
- `user_data` table stores JSON blobs with `sync_version` for conflict detection
- Order: local edits → queueSync → debounced batch upload → success response

## Component Categories

### Dashboard & Layout
- **DashboardHeader**: Title, auth, settings links
- **TaskSection**: Today's task view with Eisenhower Matrix
- **ScheduleSection**: Calendar + scheduled task cards
- **WidgetPanel**: Grid of productivity widgets (mood garden, energy tracker, sound signature)

### Data Input
- **ScheduleManager**: Upload PDF schedule or manually enter time blocks
- **TaskList**: Add/edit/delete tasks with drag-drop support
- **PlaybookEditor/Viewer**: Create workflow templates with steps
- **ProfileSetupDialog**: Onboarding (coaching style, living situation, wake/sleep times)

### AI & Smart Features
- **AIAssistant**: Chat sidebar with context-aware coaching
- **EisenhowerMatrix**: Drag-to-prioritize tasks (Urgent/Important 2x2)
- **CalendarScheduler**: Drag-drop task scheduling respecting fixed time blocks
- **FocusTimer**: Pomodoro-style timer with interrupt tracking

### Widget Editors
All follow pattern: `<WidgetEditor>` component with props:
- `widget`: Current state (or undefined for new)
- `onSave`: Callback with updated widget
- `onDelete`: Callback to remove widget
- Examples: ReminderWidget, EnergyTaskWidget, MoodGardenWidget

## Common Mistakes to Avoid

1. **Syncing**: Don't modify `user_data` directly—always use `useSyncedStorage()` in components
2. **Time handling**: Use `date-fns` for all date operations (not native Date methods)
3. **Time blocks**: Remember they repeat weekly (0-6 = Sun-Sat), not absolute dates
4. **Lovable tag conflicts**: Don't remove `componentTagger()` from Vite config—Lovable uses it
5. **Supabase types**: Always regenerate after schema changes (`supabase db pull`)
6. **AI context**: Don't hardcode user data—fetch from current state in useAIChat

## Testing & Debugging

- **No unit tests**: Debug via browser DevTools + console logs
- **localStorage**: Open DevTools → Application → localStorage to inspect synced state
- **Supabase logs**: View in Supabase dashboard under Functions
- **Lint warnings**: ESLint config is lenient; focus on type safety instead

## Deployment Notes

- Lovable auto-commits changes to GitHub
- Vercel deployment: builds from this repo, reads env vars from dashboard
- Database migrations must be applied before shipping (`supabase migrations up`)
- Promo codes & subscription status verified server-side in edge functions

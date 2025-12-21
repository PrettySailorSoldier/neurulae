# CLAUDE.md - AI Assistant Guide for Neurulae (FocusFlow)

**Last Updated:** December 20, 2025
**Project:** Neurulae - AI-Powered Productivity Platform
**Version:** 1.0.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Core Data Models](#core-data-models)
5. [Development Workflows](#development-workflows)
6. [Code Patterns & Conventions](#code-patterns--conventions)
7. [Critical Systems](#critical-systems)
8. [AI Integration](#ai-integration)
9. [Database Schema](#database-schema)
10. [Common Tasks](#common-tasks)
11. [Testing & Debugging](#testing--debugging)
12. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
13. [Deployment](#deployment)

---

## Project Overview

**Neurulae** (branded as FocusFlow) is an AI-powered productivity and time management application designed for college students, working professionals, and anyone managing complex schedules with variable commitments.

### Core Value Proposition

- **AI Coach That Knows Your Life**: Personalized productivity coaching that adapts to schedule, energy levels, and living situation
- **Schedule-Aware Planning**: Import class schedules and work shifts, get task recommendations that fit around fixed commitments
- **Effortless Organization**: Upload PDFs of schedules and let AI parse them automatically
- **Flexible Yet Structured**: Balance between planned time blocks and spontaneous productivity

### Key Features

1. **AI Assistant**: Context-aware coaching with 3 personality modes (supportive, direct, analytical)
2. **Schedule Management**: PDF parsing, recurring time blocks, one-time events
3. **Task Management**: Eisenhower Matrix, energy-based organization, drag-and-drop scheduling
4. **Focus Tools**: Multiple timer types (Pomodoro, Flowtime, Interval, Sequencer)
5. **Playbooks**: Workflow templates with AI generation
6. **Productivity Widgets**: Mood Garden, Future Self Messenger, Energy Task Harmony, Brain Dump, etc.
7. **Premium Features**: Stripe integration, feature limits for free tier

---

## Architecture & Tech Stack

### Frontend

- **Framework**: React 18.3 + TypeScript
- **Build Tool**: Vite 5.4 (SWC compiler)
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui (30+ Radix UI components)
- **State Management**:
  - React Context (Auth, Premium)
  - React Query (@tanstack/react-query 5.83)
  - localStorage with Supabase sync
- **Routing**: React Router DOM 6.30
- **Forms**: react-hook-form + zod validation
- **Date Handling**: date-fns 4.1
- **Drag & Drop**: @hello-pangea/dnd 18.0

### Backend

- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password, JWT)
- **Edge Functions**: Deno runtime on Supabase
- **AI**: Gemini 2.5 Flash via Lovable AI Gateway
- **Payments**: Stripe Checkout & Customer Portal
- **Security**: Row Level Security (RLS) policies

### Build Configuration

- **TypeScript**: Lenient config (noImplicitAny: false, strictNullChecks: false)
- **Path Aliases**: `@/*` → `./src/*`
- **Dev Server**: Port 8080, host `::`
- **Code Splitting**: Manual chunks for react, ui, forms, charts, date, supabase
- **Special Plugin**: lovable-tagger (DO NOT REMOVE - required for Lovable integration)

---

## Project Structure

```
neurulae/
├── src/
│   ├── App.tsx                      # Root app component with routing
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Global styles + theme tokens
│   │
│   ├── pages/
│   │   ├── Index.tsx                # Main dashboard (1400+ lines, central state)
│   │   ├── Landing.tsx              # Public homepage
│   │   ├── Auth.tsx                 # Login/signup
│   │   └── Settings.tsx             # User settings + schedule manager
│   │
│   ├── components/
│   │   ├── AIAssistant.tsx          # AI chat sidebar (800+ lines)
│   │   ├── ScheduleManager.tsx      # PDF upload + manual entry
│   │   ├── ProfileSetupDialog.tsx   # Onboarding wizard
│   │   ├── TaskList.tsx             # Main task management
│   │   ├── CalendarScheduler.tsx    # Drag-and-drop calendar
│   │   ├── EisenhowerMatrix.tsx     # Task prioritization
│   │   ├── TimerHub.tsx             # Focus timer collection
│   │   ├── PlaybooksTab.tsx         # Workflow templates
│   │   ├── WidgetPanel.tsx          # Dashboard widgets
│   │   │
│   │   ├── auth/                    # Auth-related components
│   │   ├── dashboard/               # Dashboard-specific components
│   │   ├── premium/                 # Premium feature components
│   │   ├── sync/                    # Sync status/force sync
│   │   ├── timer-hub/               # Timer implementations
│   │   └── ui/                      # shadcn/ui components (50+ files)
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Supabase auth state + session
│   │   └── PremiumContext.tsx       # Subscription status + role checks
│   │
│   ├── hooks/
│   │   ├── useSyncedStorage.ts      # localStorage + Supabase bidirectional sync (500 lines)
│   │   ├── useAIChat.ts             # AI message handling + action parsing (500 lines)
│   │   ├── useLocalStorage.ts       # Core state persistence
│   │   ├── useFeatureLimit.ts       # Free tier enforcement
│   │   ├── useTimerState.ts         # Timer state management
│   │   ├── useDatabaseWrite.ts      # Database mutations
│   │   ├── useSyncStatus.ts         # Sync status tracking
│   │   ├── useDeviceInfo.tsx        # Device ID generation
│   │   ├── useUserPreferences.ts    # User preferences management
│   │   └── use-*.ts                 # shadcn/ui hooks (toast, mobile)
│   │
│   ├── services/
│   │   └── syncService.ts           # Cloud sync queue + conflict resolution
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts                # Auto-generated Supabase client
│   │   └── types.ts                 # Auto-generated DB types (650+ lines)
│   │
│   ├── types/
│   │   └── index.ts                 # Core TypeScript interfaces (320+ lines)
│   │
│   ├── lib/
│   │   └── utils.ts                 # Utility functions (cn, clsx, etc.)
│   │
│   └── data/
│       └── *.ts                     # Static data (theme presets, etc.)
│
├── supabase/
│   ├── functions/
│   │   ├── ai-assistant/            # Main AI chat endpoint (Gemini 2.5)
│   │   ├── organize-tasks/          # AI task scheduling with constraints
│   │   ├── parse-schedule/          # PDF parsing → schedule entries
│   │   ├── parse-assignment-screenshot/ # Image → assignment data
│   │   ├── generate-playbook/       # AI workflow generation
│   │   ├── generate-smart-plan/     # AI planning assistance
│   │   ├── manage-time-blocks/      # CRUD for recurring time blocks
│   │   ├── create-checkout/         # Stripe checkout session
│   │   ├── check-subscription/      # Verify premium status
│   │   ├── customer-portal/         # Stripe billing portal
│   │   ├── redeem-promo/            # Promo code redemption
│   │   ├── claim-admin/             # Admin role assignment
│   │   ├── verify-admin/            # Admin verification
│   │   └── deno.json                # Deno dependencies
│   │
│   ├── migrations/                  # Database schema migrations
│   └── config.toml                  # Supabase config
│
├── docs/
│   └── PRD.md                       # Product Requirements Document (850+ lines)
│
├── .github/
│   └── copilot-instructions.md      # GitHub Copilot guidance (174 lines)
│
├── public/                          # Static assets
├── .vscode/                         # VS Code workspace settings
├── .claude/                         # Claude Code configuration
│
├── vite.config.ts                   # Vite build configuration
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── components.json                  # shadcn/ui configuration
├── package.json                     # Dependencies & scripts
└── neurulae.code-workspace          # VS Code workspace file
```

### File Count
- **151 TypeScript files** in src/
- **50+ UI components** in src/components/ui/
- **14 Edge Functions** in supabase/functions/
- **11 Custom Hooks** in src/hooks/

---

## Core Data Models

### TypeScript Interfaces (src/types/index.ts)

#### Task
```typescript
interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  projectId?: string;
  focusTimeMinutes?: number;
  estimatedMinutes?: number;
  recurring?: 'none' | 'daily' | 'weekly';
  colorTag?: string;
  createdAt: string;
  linkedPlaybookId?: string;
  subtasks?: SubTask[];
  notes?: string;
  eisenhowerQuadrant?: 'urgent-important' | 'not-urgent-important' |
                       'urgent-not-important' | 'not-urgent-not-important';
  course?: string;
  type?: 'daily' | 'ongoing';
  taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other';
}
```

#### TimeBlock
```typescript
interface TimeBlock {
  id: string;
  title: string;
  startTime: string;  // "HH:MM" format (e.g., "07:00")
  endTime: string;    // "HH:MM" format (e.g., "21:00")
  type: 'main' | 'dedicated';
  scheduleType: 'weekday' | 'weekend' | 'everyday';
  color?: string;
  createdAt: string;
}
```

#### Playbook
```typescript
interface Playbook {
  id: string;
  title: string;
  description?: string;
  category: string;
  steps: PlaybookStep[];
  isTemplate: boolean;
  linkedTaskIds: string[];
  resetOnRecurrence: boolean;
  createdAt: string;
  order?: number;
}

interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  estimatedMinutes?: number;
  completed: boolean;
  order: number;
  tips?: string[];
}
```

#### Widget Types
- `ReminderWidget`: Checklist with reset schedules
- `EnergyTaskWidget`: Energy tracking + task matching
- `FutureSelfMessengerWidget`: Time-delayed messages
- `MoodGardenWidget`: Mood tracking with plant metaphor
- `ParallelUniverseWidget`: Decision tracking + alternative outcomes
- `SoundSignatureWidget`: Sound session tracking + playlist recommendations
- `BrainDumpWidget`: Quick thought capture
- `PotionInventoryWidget`: Gamified health tracker
- `SunlightAnchorWidget`: Visual time awareness

### Database Schema (Supabase)

#### Key Tables

1. **user_profiles**
   - Extended user info beyond auth
   - Fields: ai_coaching_style, living_situation, wake_time, sleep_time
   - Purpose: Personalizes AI responses

2. **recurring_time_blocks**
   - Weekly repeating schedule (work shifts, classes)
   - Fields: day_of_week (0-6), start_time, end_time, title, block_type
   - Purpose: Fixed commitments that tasks must schedule around

3. **schedule_entries**
   - One-time events (homework deadlines, meetings)
   - Fields: start_time, end_time (ISO 8601), category, source, location
   - Purpose: Non-recurring obligations

4. **conversations** + **chat_messages**
   - AI assistant chat history
   - Purpose: Persistent coaching conversations

5. **user_data**
   - JSON blob storage for synced localStorage data
   - Fields: user_id, data_type (enum), data (jsonb), sync_version, device_id
   - Types: tasks, projects, timeBlocks, playbooks, widgets, etc.

6. **sync_metadata**
   - Tracks last sync timestamp per device
   - Purpose: Conflict detection and resolution

7. **promo_codes** + **promo_redemptions**
   - Premium feature unlocking
   - Purpose: Marketing and user acquisition

### localStorage Schema

**Rationale**: Core user data stored client-side for instant UI updates. Backend sync for authenticated users.

**Keys** (all prefixed with `focusflow-`):
- `focusflow-tasks` → Array<Task>
- `focusflow-projects` → Array<Project>
- `focusflow-timeBlocks` → Array<TimeBlock>
- `focusflow-widgets` → Array<Widget>
- `focusflow-playbooks` → Array<Playbook>
- `focusflow-theme` → Theme name or 'custom'
- `focusflow-customTheme` → CustomTheme object
- `focusflow-onboarding-completed` → boolean

---

## Development Workflows

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd neurulae

# Install dependencies
npm install

# Set up environment variables
# Create .env.local with:
VITE_SUPABASE_URL=https://pjypjjcqxlgroohoofua.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>

# Start development server
npm run dev
# Server runs on http://localhost:8080
```

### Available Scripts

```bash
npm run dev          # Start Vite dev server (port 8080)
npm run build        # Production build to dist/
npm run build:dev    # Dev build (keeps source maps)
npm run lint         # ESLint check (lenient config)
npm run preview      # Test production build locally
```

### Database Development

```bash
# Link to Supabase project
supabase link --project-ref pjypjjcqxlgroohoofua

# Pull latest schema and generate types
supabase db pull

# Generate TypeScript types from schema
# This updates src/integrations/supabase/types.ts
supabase gen types typescript --project-id pjypjjcqxlgroohoofua > src/integrations/supabase/types.ts

# Create new migration
supabase migration new <migration-name>

# Apply migrations locally
supabase db reset

# Push migrations to remote
supabase db push
```

### Git Workflow

**Branch Convention**: `claude/claude-md-<session-id>`

```bash
# Develop on feature branch
git checkout -b claude/claude-md-<session-id>

# Make changes, then commit
git add .
git commit -m "feat: add feature description"

# Push to remote
git push -u origin claude/claude-md-<session-id>
```

**Commit Message Format**:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `docs:` Documentation
- `style:` Formatting
- `test:` Tests
- `chore:` Maintenance

---

## Code Patterns & Conventions

### Component Structure

**Pattern**: Root page component (Index.tsx) manages all state, passes callbacks to children.

```typescript
// pages/Index.tsx - Central state management
const [tasks, setTasks] = useSyncedStorage<Task[]>("tasks", []);
const [projects, setProjects] = useSyncedStorage<Project[]>("projects", []);
const [timeBlocks, setTimeBlocks] = useSyncedStorage<TimeBlock[]>("timeBlocks", []);

// Pass to children
<TaskList
  tasks={tasks}
  onUpdate={handleTaskUpdate}
  onDelete={handleTaskDelete}
/>
```

**Controlled Components**: All widgets/components accept data + callbacks:
- `data`: Current state
- `onUpdate`: Modification handler
- `onDelete`: Removal handler
- `onAdd`: Creation handler (if applicable)

### State Management

**Hierarchy**:
1. `useLocalStorage()` - Core state persistence
2. `useSyncedStorage()` - Extends with Supabase sync for authenticated users
3. React Context - Only for cross-cutting concerns (Auth, Premium)

**NO global Redux** - Keep state local or lifted to Index.tsx

### Data Syncing

**Critical Pattern**: Use `useSyncedStorage()` for all user data, NOT direct Supabase mutations.

```typescript
// ✅ CORRECT
const [tasks, setTasks] = useSyncedStorage<Task[]>("tasks", []);
setTasks([...tasks, newTask]); // Auto-syncs to Supabase

// ❌ WRONG
supabase.from('user_data').insert({ data_type: 'tasks', data: newTask });
```

**How Sync Works**:
1. Component updates state via `setTasks()`
2. `useSyncedStorage` updates localStorage immediately
3. `syncService.queueSync()` debounces and batches
4. Syncs to `user_data` table with `sync_version` for conflict detection
5. `sync_metadata` tracks last sync timestamp per device

**Conflict Resolution**: Server wins on conflicts (higher `sync_version`)

### shadcn/ui Components

**Always use existing components** from `src/components/ui/`:
- Button, Card, Dialog, Dropdown Menu, Select, Tabs, Toast, Tooltip
- Form components: Input, Textarea, Checkbox, Radio Group, Switch, Slider
- Data display: Table, Badge, Avatar, Separator, Progress
- Advanced: Command, Calendar, Carousel, Collapsible, Popover, Scroll Area

**Import Pattern**:
```typescript
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
```

**Styling**: Use Tailwind utility classes + `cn()` helper:
```typescript
import { cn } from "@/lib/utils";

<Button className={cn("bg-primary", isActive && "ring-2")} />
```

### Form Handling

**Pattern**: react-hook-form + zod validation

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  duration: z.number().min(1).max(480),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { title: "", duration: 25 }
});

const onSubmit = (data: z.infer<typeof schema>) => {
  // Handle form data
};
```

### Date Handling

**Always use date-fns**, not native Date methods:

```typescript
import { format, addDays, isAfter, startOfDay } from "date-fns";

const formattedDate = format(new Date(), "yyyy-MM-dd");
const tomorrow = addDays(new Date(), 1);
```

### Error Handling

**Pattern**: Try-catch with toast notifications

```typescript
import { toast } from "sonner";

try {
  const result = await edgeFunction();
  toast.success("Operation successful");
} catch (error) {
  console.error("Error:", error);
  toast.error("Operation failed: " + error.message);
}
```

---

## Critical Systems

### 1. State Hierarchy (localStorage → Supabase)

**Core Hook**: `useSyncedStorage()` in `src/hooks/useSyncedStorage.ts`

```typescript
// Wraps localStorage with Supabase sync
const [tasks, setTasks] = useSyncedStorage<Task[]>("tasks", []);

// Behind the scenes:
// 1. Reads from localStorage on mount
// 2. Writes to localStorage on change
// 3. Queues sync to Supabase (debounced)
// 4. Handles incoming sync updates from other devices
```

**Syncable Data Types** (from `data_type_enum`):
- tasks
- projects
- timeBlocks
- playbooks
- reminderWidgets
- energyTaskWidgets
- futureSelfWidgets
- moodGardenWidgets
- parallelUniverseWidgets
- soundSignatureWidgets
- brainDumpWidgets
- potionInventoryWidgets
- sunlightAnchorWidgets

### 2. AI Action Execution Pipeline

**Flow**:
1. User message → `useAIChat.sendMessage()`
2. Edge Function `/ai-assistant` called with context:
   - Available time blocks
   - Tasks (all or filtered)
   - Playbooks
   - User profile (coaching style, wake/sleep times, living situation)
   - Today's schedule (from `get_todays_schedule()` SQL function)
3. AI response includes JSON action blocks:
   ```json
   {"action": "create_task", "data": {"title": "...", "priority": "high"}}
   ```
4. Actions extracted and executed in `useAIChat()` hook
5. Callbacks propagated to Index.tsx for state updates

**Action Types**:
- `create_task` - Add new task
- `update_task` - Modify existing task
- `delete_task` - Remove task
- `schedule_task` - Set task date/time
- `create_playbook` - Generate workflow
- `create_time_block` - Add recurring block

**Advisory Mode**: When `is_advisory=true`, AI only responds (no action parsing)

### 3. Schedule & Time Management

**Two Types of Time Data**:

1. **Recurring Time Blocks** (`recurring_time_blocks` table)
   - Weekly repeating (classes, work shifts)
   - Fields: `day_of_week` (0-6 = Sun-Sat), `start_time`/`end_time` (HH:MM)
   - Example: "Work" every Mon/Wed/Fri 4pm-9pm

2. **Schedule Entries** (`schedule_entries` table)
   - One-time events with full ISO 8601 datetimes
   - Fields: `start_time`, `end_time`, `category`, `source`, `location`
   - Example: "Project due" on 2025-11-15 at 23:59

**Important**: AI uses available time windows to recommend task slots. Calculate via `calculateAvailableWindows()` in AIAssistant.tsx.

**NO naive scheduling**: Always respect fixed commitments from recurring blocks.

### 4. Premium Features & Limits

**Context**: `PremiumContext.tsx` provides:
- `isPremium`: boolean
- `plan`: 'free' | 'premium' | 'admin'
- `isAdmin`: boolean

**Hook**: `useFeatureLimit()` enforces free tier limits:
```typescript
const { canAdd, remaining } = useFeatureLimit('tasks', tasks.length);

if (!canAdd) {
  toast.error(`Free plan limited to ${remaining} tasks`);
  return;
}
```

**Free Tier Limits**:
- Max 3 projects
- Max 50 tasks
- Max 20 time blocks/week
- Max 5 playbooks

**Premium Check Flow**:
1. Check promo code redemption first
2. If no promo, check Stripe subscription
3. Edge function: `check-subscription`

---

## AI Integration

### Lovable AI Gateway

**Why Lovable?**
- No API key required from users
- Access to latest Gemini models
- Handles rate limiting and quotas
- Seamless integration with Lovable Cloud

**Endpoint**:
```
https://ai.gateway.lovable.dev/v1/chat/completions
```

**Supported Models**:
- `google/gemini-2.5-pro` - Most capable, slower
- `google/gemini-2.5-flash` - Balanced (PRIMARY MODEL)
- `google/gemini-2.5-flash-lite` - Fastest, simpler tasks
- `openai/gpt-5`, `gpt-5-mini`, `gpt-5-nano` - Available alternatives

### Edge Function Pattern

**All AI calls go through Edge Functions**, not direct API calls.

**Example**: `supabase/functions/ai-assistant/index.ts`

```typescript
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: `You are a ${coachingStyle} productivity coach...`
      },
      {
        role: 'user',
        content: userMessage
      }
    ],
    max_tokens: 2000
  })
});

// Streaming response via Server-Sent Events
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const {done, value} = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Process chunk...
}
```

### AI Context Format

**System Prompt Pattern**:
```
You are a ${coachingStyle} productivity coach.

USER CONTEXT:
- Living situation: ${livingSituation}
- Daily rhythm: Awake ${wakeTime}-${sleepTime}
- Upcoming commitments: [list of schedule entries]

TODAY'S SCHEDULE:
[Output from get_todays_schedule() function]

AVAILABLE TIME WINDOWS:
[Calculated free time slots]

Provide actionable advice considering schedule constraints.
```

**Date Formatting Convention**: "Today is Nov 28, 2025" format

### PDF Parsing

**Edge Function**: `parse-schedule`

**Process**:
1. Client uploads PDF via FormData
2. Function converts to base64 (chunk-based to avoid stack overflow)
3. Sends to Gemini 2.5 Flash (vision-capable)
4. AI extracts: classes, homework deadlines, work shifts, meetings
5. Returns JSON array of schedule entries

**Known Issue (FIXED in v1.0.1)**:
- Large PDFs caused "Maximum call stack size exceeded"
- Fix: Chunk-based base64 conversion (8192 byte chunks)

**AI Prompt Strategy**:
```
Extract all work shifts, classes, meetings, and homework deadlines.
Return JSON array with:
- title, description, startTime (ISO 8601), endTime, category, location

Rules:
- Parse dates relative to current date if year not specified
- Homework deadlines: assume 11:59 PM if no time given
- Category: "work" | "class" | "homework" | "meeting" | "other"
```

---

## Database Schema

### Authentication & Users

```sql
-- Built-in Supabase auth.users table
-- Extended by:

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_coaching_style TEXT CHECK (ai_coaching_style IN ('supportive', 'direct', 'analytical')),
  living_situation TEXT,
  wake_time TIME,
  sleep_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Schedule & Time

```sql
CREATE TABLE recurring_time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  block_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  category TEXT CHECK (category IN ('work', 'class', 'homework', 'meeting', 'other')),
  location TEXT,
  source TEXT CHECK (source IN ('manual', 'pdf_upload')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### AI & Conversations

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Data Sync

```sql
CREATE TYPE data_type_enum AS ENUM (
  'tasks', 'projects', 'timeBlocks', 'playbooks',
  'reminderWidgets', 'energyTaskWidgets', 'futureSelfWidgets',
  'moodGardenWidgets', 'parallelUniverseWidgets', 'soundSignatureWidgets',
  'brainDumpWidgets', 'potionInventoryWidgets', 'sunlightAnchorWidgets'
);

CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type data_type_enum NOT NULL,
  data JSONB NOT NULL,
  sync_version INTEGER DEFAULT 1,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, data_type, device_id)
);

CREATE TABLE sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  last_sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);
```

### Premium Features

```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  plan_type TEXT CHECK (plan_type IN ('premium', 'admin')),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, promo_code_id)
);
```

### Row Level Security (RLS)

**All user tables enforce**:
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own data" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);
```

Similar policies on: `recurring_time_blocks`, `schedule_entries`, `conversations`, `chat_messages`, `user_data`, `sync_metadata`, `promo_redemptions`

---

## Common Tasks

### Adding a New Component

1. Create component in appropriate directory:
   - UI primitives → `src/components/ui/`
   - Dashboard widgets → `src/components/`
   - Auth-related → `src/components/auth/`

2. Use shadcn/ui components:
   ```typescript
   import { Card, CardHeader, CardContent } from "@/components/ui/card";
   import { Button } from "@/components/ui/button";
   ```

3. Follow controlled component pattern:
   ```typescript
   interface Props {
     data: MyData;
     onUpdate: (data: MyData) => void;
     onDelete?: () => void;
   }
   ```

### Adding a New Widget

1. Define TypeScript interface in `src/types/index.ts`:
   ```typescript
   export interface MyWidget {
     id: string;
     type: 'my-widget';
     title: string;
     // ... widget-specific fields
   }
   ```

2. Add to `data_type_enum` in database migration:
   ```sql
   ALTER TYPE data_type_enum ADD VALUE 'myWidgets';
   ```

3. Create editor component: `MyWidgetEditor.tsx`
4. Create display component: `MyWidgetDisplay.tsx`
5. Register in `WidgetPanel.tsx`
6. Update `useSyncedStorage()` to handle new type

### Adding a New Edge Function

1. Create function directory:
   ```bash
   mkdir supabase/functions/my-function
   touch supabase/functions/my-function/index.ts
   ```

2. Implement function:
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

   serve(async (req) => {
     try {
       // Your logic here
       return new Response(JSON.stringify({ success: true }), {
         headers: { "Content-Type": "application/json" }
       });
     } catch (error) {
       return new Response(JSON.stringify({ error: error.message }), {
         status: 500,
         headers: { "Content-Type": "application/json" }
       });
     }
   });
   ```

3. Deploy:
   ```bash
   supabase functions deploy my-function
   ```

4. Call from frontend:
   ```typescript
   const { data, error } = await supabase.functions.invoke('my-function', {
     body: { /* params */ }
   });
   ```

### Modifying Database Schema

1. Create migration:
   ```bash
   supabase migration new add_new_column
   ```

2. Edit migration file in `supabase/migrations/`:
   ```sql
   ALTER TABLE user_profiles ADD COLUMN new_field TEXT;
   ```

3. Apply locally:
   ```bash
   supabase db reset
   ```

4. Regenerate types:
   ```bash
   supabase gen types typescript > src/integrations/supabase/types.ts
   ```

5. Push to remote:
   ```bash
   supabase db push
   ```

### Adding Premium Feature

1. Check premium status:
   ```typescript
   const { isPremium, plan } = usePremium();
   if (!isPremium) {
     toast.error("Premium feature");
     return;
   }
   ```

2. Or use feature limit:
   ```typescript
   const { canAdd, limit } = useFeatureLimit('myFeature', currentCount);
   ```

3. Update `useFeatureLimit.ts` with new limit:
   ```typescript
   const limits = {
     myFeature: { free: 5, premium: Infinity }
   };
   ```

---

## Testing & Debugging

### No Unit Tests
Debug via browser DevTools + console logs.

### localStorage Inspection
1. Open DevTools → Application → localStorage
2. Look for keys starting with `focusflow-`
3. Data is JSON-stringified

### Supabase Logs
1. Visit Supabase dashboard
2. Navigate to Functions
3. View logs for specific edge function

### Common Debug Patterns

```typescript
// Log state changes
useEffect(() => {
  console.log('Tasks updated:', tasks);
}, [tasks]);

// Log function calls
const handleUpdate = (task: Task) => {
  console.log('Updating task:', task);
  setTasks(tasks.map(t => t.id === task.id ? task : t));
};

// Log API responses
const fetchData = async () => {
  const { data, error } = await supabase.from('table').select();
  console.log('Fetched data:', data);
  if (error) console.error('Error:', error);
};
```

### Network Debugging

**Edge Functions**:
1. Open DevTools → Network
2. Filter by "Fetch/XHR"
3. Look for requests to `supabase.co/functions/v1/`
4. Inspect request/response payloads

**AI Requests**:
1. Look for requests to `ai.gateway.lovable.dev`
2. Check request body for context
3. Check response for streaming chunks

---

## Common Mistakes to Avoid

### 1. Direct Supabase Mutations
**❌ WRONG**:
```typescript
supabase.from('user_data').insert({ data_type: 'tasks', data: newTask });
```

**✅ CORRECT**:
```typescript
const [tasks, setTasks] = useSyncedStorage<Task[]>("tasks", []);
setTasks([...tasks, newTask]); // Auto-syncs via useSyncedStorage
```

### 2. Time Handling
**❌ WRONG**:
```typescript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
```

**✅ CORRECT**:
```typescript
import { addDays } from "date-fns";
const tomorrow = addDays(new Date(), 1);
```

### 3. Time Block Assumptions
**❌ WRONG**: Treating time blocks as absolute dates

**✅ CORRECT**: Remember they repeat weekly (0-6 = Sun-Sat)
```typescript
// day_of_week: 1 = EVERY Monday, not a specific date
```

### 4. Removing Lovable Tagger
**❌ WRONG**: Removing `componentTagger()` from `vite.config.ts`

**✅ CORRECT**: Keep it! Lovable uses it for automatic commits.

### 5. Supabase Types Out of Sync
**❌ WRONG**: Editing `src/integrations/supabase/types.ts` manually

**✅ CORRECT**: Always regenerate after schema changes:
```bash
supabase gen types typescript > src/integrations/supabase/types.ts
```

### 6. Hardcoding User Data in AI
**❌ WRONG**:
```typescript
const context = {
  user: "John Doe",
  schedule: [/* hardcoded */]
};
```

**✅ CORRECT**: Fetch from current state:
```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

### 7. Ignoring TypeScript Errors
**Note**: Config is lenient, but don't abuse it.

**❌ WRONG**: Ignoring type mismatches

**✅ CORRECT**: Fix types, use proper interfaces

### 8. Not Checking Auth
**❌ WRONG**: Assuming user is always logged in

**✅ CORRECT**:
```typescript
const { user } = useAuth();
if (!user) {
  // Redirect to login or show message
  return;
}
```

### 9. Forgetting RLS Policies
**❌ WRONG**: Creating table without RLS

**✅ CORRECT**: Always enable RLS on user tables:
```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "policy_name" ON my_table
  FOR ALL USING (auth.uid() = user_id);
```

### 10. Not Handling Async Errors
**❌ WRONG**:
```typescript
const data = await fetchData(); // No error handling
```

**✅ CORRECT**:
```typescript
try {
  const data = await fetchData();
  toast.success("Success");
} catch (error) {
  console.error(error);
  toast.error("Failed: " + error.message);
}
```

---

## Deployment

### Lovable Auto-Deploy

**Default**: Lovable auto-commits changes to GitHub and deploys.

**Workflow**:
1. Make changes in Lovable or locally
2. Push to GitHub
3. Lovable picks up changes
4. Automatic deploy to production

### Vercel Deployment (Alternative)

**Setup**:
1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Deploy command: `npm run build`
4. Output directory: `dist`

### Database Migrations

**CRITICAL**: Apply migrations before shipping new features.

```bash
# Push migrations to production
supabase db push

# Or via Supabase dashboard:
# 1. Go to Database → Migrations
# 2. Run pending migrations
```

### Edge Functions Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy ai-assistant

# View deployed functions
supabase functions list
```

### Environment Variables

**Required**:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Anon key (public)

**Edge Function Secrets** (set in Supabase dashboard):
- `LOVABLE_API_KEY` - For AI Gateway
- `STRIPE_SECRET_KEY` - For payments
- `STRIPE_WEBHOOK_SECRET` - For webhook verification

### Pre-Deploy Checklist

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed (if critical)
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Environment variables set
- [ ] Test auth flow
- [ ] Test premium features
- [ ] Test AI assistant
- [ ] Test PDF parsing
- [ ] Test sync functionality

---

## Additional Resources

### Documentation
- **PRD**: `docs/PRD.md` - Full product requirements (850 lines)
- **Copilot Instructions**: `.github/copilot-instructions.md` - GitHub Copilot guidance
- **Supabase Docs**: https://supabase.com/docs
- **Lovable Docs**: https://docs.lovable.dev
- **shadcn/ui**: https://ui.shadcn.com

### Key Files to Reference
- `src/pages/Index.tsx` - Central state management pattern
- `src/hooks/useSyncedStorage.ts` - Sync implementation
- `src/hooks/useAIChat.ts` - AI integration pattern
- `src/components/AIAssistant.tsx` - AI UI implementation
- `supabase/functions/ai-assistant/index.ts` - Edge function pattern

### Support
For technical questions or issues:
- Check existing GitHub issues
- Review PRD.md for feature specifications
- Consult copilot-instructions.md for patterns

---

## Quick Reference

### Import Aliases
```typescript
import Component from "@/components/Component";  // src/components/
import { type Task } from "@/types";            // src/types/
import { cn } from "@/lib/utils";               // src/lib/
```

### Common Hooks
```typescript
const { user, loading } = useAuth();
const { isPremium, plan, isAdmin } = usePremium();
const [data, setData] = useSyncedStorage<T>("key", defaultValue);
const { canAdd, limit } = useFeatureLimit("feature", count);
const { sendMessage, messages, loading } = useAIChat();
```

### Common Components
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
```

### Supabase Client
```typescript
import { supabase } from "@/integrations/supabase/client";

// Query
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('user_id', user.id);

// Insert
const { data, error } = await supabase
  .from('table')
  .insert({ field: value });

// Edge Function
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { param: value }
});
```

---

**Last Updated**: December 20, 2025
**Maintained By**: AI Assistants contributing to Neurulae
**Version**: 1.0.0

For the most up-to-date information, always refer to the actual codebase and PRD.md.

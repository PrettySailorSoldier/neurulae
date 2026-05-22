# Neurulae

**AI-powered productivity and time management for complex, variable schedules.**

Neurulae is built for students, working professionals, and anyone juggling shifting commitments — classes, shifts, projects, and life. It combines a context-aware AI coach, flexible task/schedule management, focus tools, and a customizable widget dashboard into a single, synced app.

---

## Features

### 🤖 AI Assistant
- Context-aware coaching with 3 personality modes: **Supportive**, **Direct**, **Analytical**
- Understands your schedule, energy levels, and living situation
- Executes actions directly: creates tasks, schedules blocks, generates playbooks
- Full conversation history synced to the cloud

### 📅 Schedule Management
- Import schedules from **PDF uploads** (AI parses classes, shifts, deadlines automatically)
- Define recurring weekly time blocks (classes, work shifts)
- One-time schedule entries with category tagging
- Task recommendations that respect your fixed commitments

### ✅ Task Management
- Eisenhower Matrix prioritization (Urgent/Important quadrants)
- Drag-and-drop scheduling onto the daily timeline
- Subtasks, notes, color tags, recurring tasks
- Energy-based task matching and filtering
- Project grouping with free/premium tier limits

### ⏱ Focus Tools
- Multiple timer types: **Pomodoro**, **Flowtime**, **Interval**, **Sequencer**
- Collapsible timer hub with interrupt tracking
- Focus Mode overlay for distraction-free sessions
- Hyperfocus detector with break nudges

### 📖 Playbooks
- Reusable step-by-step workflow templates
- AI playbook generation from a description
- Category filtering, step completion tracking, timer integration
- Built-in templates for cleaning, house reset, daily routines, and more

### 🧩 Widgets Dashboard
- **Brain Dump** — Quick thought capture with bulk actions
- **Mood Garden** — Mood tracking with a plant growth metaphor
- **Energy Task Harmony** — Matches tasks to current energy level
- **Future Self Messenger** — Time-delayed messages to yourself
- **Parallel Universe** — Decision journaling with alternative outcome tracking
- **Sound Signature** — Sound session tracker + playlist recommendations
- **Potion Inventory** — Gamified daily health/wellness tracker
- **Sunlight Anchor** — Visual time-of-day awareness widget
- **Reminder Widget** — Checklists with configurable reset schedules

### 🎨 Customization
- Custom theme builder (full color palette control)
- 10+ preset themes including dark modes
- Mobile-responsive layout with bottom tab bar

### 💳 Premium
- Stripe-powered subscriptions and promo code redemption
- Free tier limits enforced per feature (tasks, projects, playbooks, time blocks)
- Admin panel for managing users and promo codes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite 5 (SWC) |
| Styling | Tailwind CSS 3.4, shadcn/ui (30+ Radix UI components) |
| State | React Context, TanStack Query, localStorage + Supabase sync |
| Routing | React Router DOM 6 |
| Forms | react-hook-form + Zod |
| Rich Text | TipTap |
| Drag & Drop | @hello-pangea/dnd |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions on Deno) |
| AI | Gemini 2.5 Flash via Lovable AI Gateway |
| Payments | Stripe Checkout & Customer Portal |
| Deployment | Vercel (frontend) + Supabase Cloud (backend) |

---

## Local Development

### Prerequisites
- Node.js 18+ and npm
- (Optional) Supabase CLI for schema/migration work

### Setup

```sh
# Clone the repository
git clone <repo-url>
cd neurulae

# Install dependencies
npm install

# Configure environment
# Create a .env.local file with:
VITE_SUPABASE_URL=https://pjypjjcqxlgroohoofua.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

# Start the dev server (runs on http://localhost:8080)
npm run dev
```

### Available Scripts

```sh
npm run dev          # Vite dev server with HMR (port 8080)
npm run build        # Production build → dist/
npm run build:dev    # Dev build (preserves source maps)
npm run lint         # ESLint
npm run preview      # Preview production build locally
```

---

## Project Structure

```
neurulae/
├── src/
│   ├── App.tsx                   # Root component, routing, providers
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Global styles + CSS theme tokens
│   │
│   ├── pages/
│   │   ├── Index.tsx             # Main dashboard (central state hub)
│   │   ├── Landing.tsx           # Public homepage
│   │   ├── Auth.tsx              # Login / signup
│   │   ├── Settings.tsx          # User settings + schedule manager
│   │   ├── Tasks.tsx             # Standalone task view
│   │   ├── MyAvailability.tsx    # Availability / schedule config
│   │   ├── MyPlan.tsx            # Plan overview
│   │   ├── Pricing.tsx           # Pricing / upgrade page
│   │   ├── AdminPanel.tsx        # Admin panel (admin role only)
│   │   └── NotFound.tsx          # 404
│   │
│   ├── components/               # 65+ components + 20 subdirectories
│   │   ├── ui/                   # shadcn/ui primitives (36 files)
│   │   ├── brain-dump/           # Brain dump editor + panel
│   │   ├── dashboard/            # Dashboard-specific components
│   │   ├── auth/                 # Auth guards (RequireAuth, PublicOnly)
│   │   ├── timer-hub/            # Timer implementations
│   │   ├── premium/              # Premium gate components
│   │   └── ...                   # Feature-specific subdirectories
│   │
│   ├── hooks/                    # 26 custom hooks
│   │   ├── useSyncedStorage.ts   # localStorage ↔ Supabase bidirectional sync
│   │   ├── useAIChat.ts          # AI messaging + action execution
│   │   ├── useGlobalTimer.ts     # Shared timer state
│   │   └── ...
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Supabase session + user state
│   │   ├── PremiumContext.tsx    # Subscription status + role checks
│   │   └── TimerContext.tsx      # Global timer context
│   │
│   ├── services/
│   │   └── syncService.ts        # Cloud sync queue + conflict resolution
│   │
│   ├── types/
│   │   └── index.ts              # Core TypeScript interfaces
│   │
│   ├── data/                     # Static data (playbook templates, presets)
│   ├── utils/                    # Helper functions (time, color, fuzzy match)
│   ├── lib/                      # Shared utilities (cn, clsx)
│   └── integrations/supabase/    # Auto-generated client + DB types
│
├── supabase/
│   ├── functions/                # 14 Deno Edge Functions
│   │   ├── ai-assistant/         # Main AI chat endpoint
│   │   ├── organize-tasks/       # AI task scheduling
│   │   ├── parse-schedule/       # PDF → schedule entries
│   │   ├── generate-playbook/    # AI playbook generation
│   │   ├── create-checkout/      # Stripe checkout
│   │   ├── check-subscription/   # Premium verification
│   │   └── ...
│   ├── migrations/               # 35 database migrations
│   └── config.toml
│
├── public/                       # favicon, manifest, robots.txt
├── CLAUDE.md                     # Comprehensive AI assistant guide
├── .github/copilot-instructions.md
└── [config files]                # vite, tsconfig, tailwind, eslint, etc.
```

---

## Data Architecture

User data is stored **client-side in localStorage** for instant UI, and automatically synced to Supabase for authenticated users via `useSyncedStorage()`. Conflict resolution uses a `sync_version` counter (server wins).

**Syncable data types**: tasks, projects, time blocks, playbooks, and all widget types.

**AI calls** are routed through Supabase Edge Functions — never directly from the client. The AI receives full context: schedule, tasks, playbooks, and user profile before responding.

---

## Deployment

The app deploys to **Vercel** (frontend) with environment variables set in the Vercel dashboard. Database migrations must be applied to Supabase before shipping new schema changes.

```sh
# Apply pending migrations
supabase db push

# Regenerate TypeScript types after schema changes
supabase gen types typescript --project-id pjypjjcqxlgroohoofua > src/integrations/supabase/types.ts
```

---

> For a deep-dive into architecture, data models, code patterns, and AI integration, see [`CLAUDE.md`](./CLAUDE.md).

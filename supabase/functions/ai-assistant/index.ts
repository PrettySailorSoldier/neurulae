// @ts-ignore - Deno std library resolved at runtime
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore - Deno std library resolved at runtime
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// @ts-ignore - Supabase client resolved at runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
// @ts-ignore - Zod is available at runtime in Deno
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to determine time of day from hour
const getTimeOfDay = (hour: number) => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Auth session missing' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Auth session missing' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Validate input with structured schemas
    const taskSchema = z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(500),
      due_date: z.string().optional(),
      estimated_minutes: z.number().int().positive().max(1440).optional(),
      type: z.string().max(50).optional(),
      status: z.string().optional()
    });

    const timeBlockSchema = z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200),
      day_of_week: z.number().int().min(0).max(6),
      start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      category: z.string().max(50).optional()
    });

    const scheduleEntrySchema = z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200),
      start_time: z.string().datetime(),
      end_time: z.string().datetime(),
      category: z.string().max(50).optional(),
      description: z.string().max(1000).optional()
    });

    const playbookSchema = z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      steps: z.array(z.any()).optional()
    });

    const projectSchema = z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200),
      description: z.string().max(1000).optional()
    });

    const requestSchema = z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().max(5000)
      })).max(100),
      images: z.array(z.string()).max(10).optional(),
      context: z.object({
        tasks: z.array(taskSchema).max(1000).optional(),
        timeBlocks: z.array(timeBlockSchema).max(500).optional(),
        playbooks: z.array(playbookSchema).max(100).optional(),
        projects: z.array(projectSchema).max(100).optional(),
        scheduleEntries: z.array(scheduleEntrySchema).max(500).optional(),
        currentDate: z.string().optional(),
        currentTime: z.string().optional(),
        temporal: z.object({
          hour24: z.number().int().min(0).max(23).optional(),
          dayOfWeek: z.number().int().min(0).max(6).optional(),
          date: z.string().optional(),
          localTime: z.string().optional()
        }).passthrough().optional(),
        todaySchedule: z.array(scheduleEntrySchema).optional(),
        upcomingSchedule: z.array(scheduleEntrySchema).optional(),
        availableTimeWindows: z.array(z.object({
          start: z.string(),
          end: z.string(),
          duration: z.string().optional()
        })).optional()
      }).optional(),
      mode: z.enum(['direct', 'stuck_interview']).optional(),
      userProfile: z.object({}).passthrough().optional()
    });

    const raw = await req.json();

    // Normalize incoming payload to match schema expectations and prevent validation failures
    const normalized = (() => {
      try {
        const rawMessages = Array.isArray(raw?.messages) ? raw.messages : [];
        const messages = rawMessages.map((m: any) => ({
          role: m?.role ?? 'user',
          content: typeof m?.content === 'string' ? m.content.slice(0, 5000) : ''
        }));

        const ctx = raw?.context ?? {};

        const tasks = Array.isArray(ctx?.tasks)
          ? ctx.tasks.map((t: any) => ({
              id: String(t.id),
              name: String(t.name ?? t.title ?? '').slice(0, 500),
              due_date: t.due_date ?? t.dueDate ?? undefined,
              estimated_minutes:
                typeof t.estimated_minutes === 'number'
                  ? t.estimated_minutes
                  : typeof t.estimatedMinutes === 'number'
                  ? t.estimatedMinutes
                  : typeof t.focusTimeMinutes === 'number'
                  ? t.focusTimeMinutes
                  : undefined,
              type: t.type ?? t.taskType ?? undefined,
              status:
                typeof t.completed === 'boolean'
                  ? t.completed
                    ? 'completed'
                    : 'pending'
                  : t.status,
            }))
          : undefined;

        const timeBlocks = Array.isArray(ctx?.timeBlocks)
          ? ctx.timeBlocks
              .map((b: any) => {
                const day = b.day_of_week ?? b.dayOfWeek;
                const start = b.start_time ?? b.startTime;
                const end = b.end_time ?? b.endTime;
                if (day === undefined || !start || !end) return null; // skip blocks we can't normalize
                return {
                  id: String(b.id ?? crypto.randomUUID()),
                  title: String(b.title ?? b.name ?? 'Block').slice(0, 200),
                  day_of_week: Number(day),
                  start_time: String(start),
                  end_time: String(end),
                  category: b.category ?? b.type ?? undefined,
                };
              })
              .filter(Boolean)
          : undefined;

        const normalizedContext = {
          ...ctx,
          tasks,
          timeBlocks,
        };

        return {
          messages,
          images: Array.isArray(raw?.images) ? raw.images : undefined,
          context: normalizedContext,
          mode: raw?.mode,
          userProfile: raw?.userProfile,
        };
      } catch (_) {
        return raw;
      }
    })();

    const validation = requestSchema.safeParse(normalized);
    
    if (!validation.success) {
      console.error('Validation error:', validation.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format. Please check your input and try again.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages, images, context, mode, userProfile } = validation.data;

    // Build enhanced system prompt with context
    const isStuckMode = mode === 'stuck_interview';
    // Use client-provided hour24 from temporal context for accurate time-of-day calculation
    const timeOfDay = context?.temporal?.hour24 !== undefined 
      ? getTimeOfDay(context.temporal.hour24) 
      : 'unknown';
    
    // All UI components
    // - Tasks
    // - Time blocks
    // - Playbooks
    // - Projects
    // - Schedule entries
    // - Current date
    // - Current time
    // - Temporal
    // - Today schedule
    // - Upcoming schedule
    // - Available time windows
    
    // Get user profile info
    const coachingStyle = userProfile?.aiStyle || 'balanced';
    const livingAlone = userProfile?.livingAlone ?? true;
    const workSchedule = (userProfile?.workSchedule as any[]) || [];
    
    const stuckModePrompt = `You are a compassionate productivity coach guiding someone who feels overwhelmed and doesn't know where to start. Your mission is to help them identify what needs attention through a gentle, structured interview process.

**IMAGE ANALYSIS**: When users share images (screenshots, photos of notes, schedules, whiteboards, etc.), analyze them carefully and reference specific details in your response. Images can contain schedules, task lists, homework assignments, or anything else relevant to productivity.

### USER PROFILE CONTEXT
**AI Coaching Style**: ${coachingStyle}
**Living Situation**: ${livingAlone ? 'Lives alone' : 'Lives with others'}
**Work Schedule**: ${workSchedule.length > 0 ? workSchedule.map((s: any) => `${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][s.dayOfWeek]} ${s.startTime}-${s.endTime}`).join(', ') : 'Not set'}

## Temporal Awareness & Realistic Scheduling

**CRITICAL: Always factor in time constraints before making suggestions.**

STRICT TIME RULE: NEVER mention the current time or date unless explicitly asked. If asked, reply ONLY with: "It's {localTime}" using the exact value from context.temporal.localTime.

### Current Time Context:
- Time: ${context?.temporal?.localTime || 'Not provided'}
- Date: ${context?.temporal?.localDate || 'Unknown'}
- Day of Week: ${context?.temporal?.dayName || 'Unknown'}
- Timezone: ${context?.temporal?.timezone || 'Unknown'}
- Today's Schedule: ${context?.todaySchedule?.length || 0} time blocks
${context?.todaySchedule && context.todaySchedule.length > 0 
  ? context.todaySchedule.map((s: any) => `  - ${s.startTime} to ${s.endTime}: ${s.title} (${s.duration})`).join('\n')
  : '  - No scheduled blocks'}

### Upcoming Work/Class Schedule:
${context?.upcomingSchedule && context.upcomingSchedule.length > 0
  ? context.upcomingSchedule.slice(0, 10).map((s: any) => `  - ${s.startTime} to ${s.endTime}: ${s.title} (${s.category})${s.location ? ` at ${s.location}` : ''}`).join('\n')
  : '  - No work/class schedule entries'}

### Available Time Windows Today:
${context?.availableTimeWindows && context.availableTimeWindows.length > 0 
  ? context.availableTimeWindows.map((w: any) => `  - ${w.start} to ${w.end} (${w.duration} available)`).join('\n')
  : '  - Schedule is full or no clear windows identified'}

### Scheduling Rules You MUST Follow:

1. **Check time FIRST before any suggestion**: Calculate current time → next commitment → available window
2. **Match task duration to time window**: 15-min tasks fit in small gaps, 1-hour tasks need 90+ min OR schedule later
3. **Always ask about duration if unknown**: "How long do you think [task] will take?"
4. **Be explicit about timing conflicts**: "You have work at 3pm and it's 1:45pm. That's about 1 hour. A full clean takes 2 hours. Would a focused 30-minute tidy work instead? Or we could schedule a full clean for 6pm after work."

## Time-of-Day Task Appropriateness

**Current Time of Day: ${timeOfDay}**

### Task Timing Rules by Time of Day:

**Morning (5am-12pm):**
- ✅ GOOD: Exercise, deep work, important calls, errands, cleaning (including vacuuming), meal prep
- ⚠️ CAUTION: Avoid scheduling anything before 7am that might disturb others
- 💡 BEST FOR: Tasks requiring high energy and focus

**Afternoon (12pm-5pm):**
- ✅ GOOD: Meetings, collaborative work, errands, light cleaning, administrative tasks
- ⚠️ CAUTION: Energy may dip after lunch (suggest shorter tasks 1-2pm)
- 💡 BEST FOR: Social tasks and moderate-energy work

**Evening (5pm-9pm):**
- ✅ GOOD: Meal prep, light cleaning (quiet tasks only), planning tomorrow, creative work, hobbies
- ❌ AVOID: Vacuuming, loud chores, high-intensity exercise (if living with others)
- 💡 BEST FOR: Winding down tasks and personal time

**Night (9pm-5am):**
- ✅ GOOD: Quiet activities (reading, planning, journaling), personal hobbies, sleep prep
- ❌ AVOID: Any noisy tasks (vacuuming, blenders, power tools), anything that disturbs others
- ⚠️ CRITICAL: If user lives with others, emphasize quiet-only activities
- 💡 If suggesting tasks late at night, mention winding down without stating the time

**Living Situation Context: ${livingAlone ? 'Lives alone' : 'Lives with others'}**
${!livingAlone ? '⚠️ EXTRA CONSIDERATION: Be mindful of noise levels and shared spaces when suggesting tasks.' : ''}

## Interview Philosophy

Your approach is **warm, empathetic, and practical**. You're here to help, not judge. Structure the conversation to:

1. **Surface the overwhelm**: Help them articulate what's weighing on them
2. **Prioritize**: Identify the most pressing concern (not everything at once)
3. **Break it down**: Transform big scary tasks into manageable steps
4. **Create momentum**: Get them to commit to ONE concrete action right now

## Interview Flow

Start by acknowledging their feeling, then guide them through:

### Phase 1: Discovery (2-3 questions)
- "What's been on your mind lately that you've been avoiding?"
- "Is there something specific causing stress, or does it feel like everything?"
- "If you could wave a magic wand and have ONE thing handled by tomorrow, what would it be?"

### Phase 2: Clarification (1-2 follow-ups)
- Dig deeper into their top concern
- Ask about obstacles: "What's been stopping you from tackling this?"
- Uncover the real issue (often it's not what they first say)

### Phase 3: Action Design
- Break the overwhelming thing into 3-5 concrete mini-tasks
- **Always suggest creating these as actual tasks** (use the create_task action)
- Identify the **first 15-minute step** they can do TODAY
- Check availability: "You mentioned you're free after 6pm. Should we schedule that first step for 6:30pm?"

### Phase 4: Momentum
- **Create 2-3 tasks immediately** based on what you discussed
- Offer to add them to today's schedule if there's time
- If they need more guidance, offer to create a **Playbook** for this challenge
- End with encouragement and a clear next step

## Response Style

- **Match their energy**: If they're frantic, be calming. If they're stuck, be gently motivating.
- **Ask one question at a time**: Don't overwhelm with multiple questions.
- **Use their language**: Mirror their words to show you're listening.
- **Be concise**: 2-3 short paragraphs max per response.
- **Celebrate small wins**: "Starting is half the battle!"

## Creating Outputs

When appropriate during the conversation:

**Tasks**: Use \`create_task\` action with clear, actionable titles
**Time Blocks**: Use \`create_time_block\` if they want to schedule something NOW
**Playbooks**: Offer to create one if they face a recurring challenge (e.g., "cleaning routine", "weekly planning")

Example action:
\`\`\`json
{
  "action": "create_task",
  "data": {
    "title": "Draft project proposal - outline only",
    "priority": "high",
    "estimatedMinutes": 20,
    "category": "work"
  }
}
\`\`\`

## Example Stuck Interview

**User**: "I have so much to do and don't know where to start"

**You**: "I hear you - that feeling of having everything pile up is really overwhelming. Let's take a breath and figure this out together. 

If you had to pick just ONE thing that's been weighing on you the most, what would it be? The thing that, if handled, would give you the biggest sense of relief?"

*[User responds about work project]*

**You**: "Okay, so the work project is the big one. That makes sense. What's been blocking you from diving in? Is it that you're not sure where to start, or is something else in the way?"

*[User explains they're stuck on the scope]*

**You**: "Got it. The scope feels fuzzy, so you keep circling without making progress. Here's what we're going to do:

I'm going to create three quick tasks for you:
1. **Brain dump all project ideas** (10 minutes) - just get everything out, no editing
2. **List the 3 must-have deliverables** (5 minutes) - what HAS to be done?
3. **Draft a rough timeline** (15 minutes) - when does each piece need to happen?

That's 30 minutes total. You mentioned you're free after dinner tonight - should we block 7:00-7:30pm for task #1?"

*[Creates tasks with JSON actions]*

**You**: "There! Those three tasks are now in your system. Start with the brain dump tonight at 7pm - just 10 minutes of messy thinking. Once you see it all written out, the next steps will feel way more doable.

Want me to also create a Playbook for tackling fuzzy projects in the future? Could be handy next time you hit this wall."

## Coaching Style: ${coachingStyle}

${coachingStyle === 'direct' ? '- Be straightforward and solution-focused\n- Skip the fluff, get to actionable advice quickly\n- Use bullet points and clear next steps' : ''}
${coachingStyle === 'empathetic' ? '- Lead with validation and understanding\n- Take time to explore their feelings\n- Use encouraging, supportive language' : ''}
${coachingStyle === 'balanced' ? '- Balance empathy with practical solutions\n- Acknowledge feelings, then move to action\n- Be warm but efficient' : ''}
${coachingStyle === 'analytical' ? '- Focus on the logic and structure\n- Break things into clear systems\n- Use frameworks and methodologies' : ''}

## Remember

You're not here to be a therapist - you're a **productivity coach** helping someone get unstuck. Keep it practical, keep it kind, and help them take the first small step TODAY.`;

    const directModePrompt = `You are Neurulae's AI productivity assistant. You help users manage their tasks, time blocks, and schedule with intelligent, context-aware suggestions.

**IMAGE ANALYSIS**: When users share images (screenshots of schedules, photos of whiteboards, assignment sheets, handwritten notes, etc.), carefully analyze them and extract relevant information. Create tasks, time blocks, or provide insights based on what you see in the images.

### USER PROFILE CONTEXT
**AI Coaching Style**: ${coachingStyle}
**Living Situation**: ${livingAlone ? 'Lives alone' : 'Lives with others'}
**Work Schedule**: ${workSchedule.length > 0 ? workSchedule.map((s: any) => `${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][s.dayOfWeek]} ${s.startTime}-${s.endTime}`).join(', ') : 'Not set'}

## Temporal Awareness & Realistic Scheduling

**CRITICAL: Always factor in time constraints before making suggestions.**

STRICT TIME RULE: NEVER mention the current time or date unless explicitly asked. If asked, reply ONLY with: "It's {localTime}" using the exact value from context.temporal.localTime.

### Current Time Context:
- Time: ${context?.temporal?.localTime || 'Not provided'}
- Date: ${context?.temporal?.localDate || 'Unknown'}
- Day of Week: ${context?.temporal?.dayName || 'Unknown'}
- Timezone: ${context?.temporal?.timezone || 'Unknown'}
- Today's Schedule: ${context?.todaySchedule?.length || 0} time blocks
${context?.todaySchedule && context.todaySchedule.length > 0 
  ? context.todaySchedule.map((s: any) => `  - ${s.startTime} to ${s.endTime}: ${s.title} (${s.duration})`).join('\n')
  : '  - No scheduled blocks'}

### Upcoming Work/Class Schedule:
${context?.upcomingSchedule && context.upcomingSchedule.length > 0
  ? context.upcomingSchedule.slice(0, 10).map((s: any) => `  - ${s.startTime} to ${s.endTime}: ${s.title} (${s.category})${s.location ? ` at ${s.location}` : ''}`).join('\n')
  : '  - No work/class schedule entries'}

### Available Time Windows Today:
${context?.availableTimeWindows && context.availableTimeWindows.length > 0 
  ? context.availableTimeWindows.map((w: any) => `  - ${w.start} to ${w.end} (${w.duration} available)`).join('\n')
  : '  - Schedule is full or no clear windows identified'}

### Scheduling Rules You MUST Follow:

1. **Check time FIRST before any suggestion**: Calculate current time → next commitment → available window
2. **Match task duration to time window**: 15-min tasks fit in small gaps, 1-hour tasks need 90+ min OR schedule later
3. **Always ask about duration if unknown**: "How long do you think [task] will take?"
4. **Be explicit about timing conflicts**: "You have work at 3pm and it's 1:45pm. That's about 1 hour. A full clean takes 2 hours. Would a focused 30-minute tidy work instead? Or we could schedule a full clean for 6pm after work."

## Time-of-Day Task Appropriateness

**Current Time of Day: ${timeOfDay}**

### Task Timing Rules by Time of Day:

**Morning (5am-12pm):**
- ✅ GOOD: Exercise, deep work, important calls, errands, cleaning (including vacuuming), meal prep
- ⚠️ CAUTION: Avoid scheduling anything before 7am that might disturb others
- 💡 BEST FOR: Tasks requiring high energy and focus

**Afternoon (12pm-5pm):**
- ✅ GOOD: Meetings, collaborative work, errands, light cleaning, administrative tasks
- ⚠️ CAUTION: Energy may dip after lunch (suggest shorter tasks 1-2pm)
- 💡 BEST FOR: Social tasks and moderate-energy work

**Evening (5pm-9pm):**
- ✅ GOOD: Meal prep, light cleaning (quiet tasks only), planning tomorrow, creative work, hobbies
- ❌ AVOID: Vacuuming, loud chores, high-intensity exercise (if living with others)
- 💡 BEST FOR: Winding down tasks and personal time

**Night (9pm-5am):**
- ✅ GOOD: Quiet activities (reading, planning, journaling), personal hobbies, sleep prep
- ❌ AVOID: Any noisy tasks (vacuuming, blenders, power tools), anything that disturbs others
- ⚠️ CRITICAL: If user lives with others, emphasize quiet-only activities
- 💡 If suggesting tasks late at night, mention winding down without stating the time

**Living Situation Context: ${livingAlone ? 'Lives alone' : 'Lives with others'}**
${!livingAlone ? '⚠️ EXTRA CONSIDERATION: Be mindful of noise levels and shared spaces when suggesting tasks.' : ''}

## Current Context
You have access to the user's:
- **${context?.tasks?.length || 0} tasks** (some may be scheduled, others unscheduled)
- **${context?.timeBlocks?.length || 0} time blocks** for today
- **${context?.playbooks?.length || 0} playbooks** (productivity templates)
- **${context?.projects?.length || 0} projects**

## Your Capabilities

You can help users by:

1. **Managing Tasks**
   - Creating new tasks from natural language
   - Updating task priorities, categories, deadlines
   - Suggesting which tasks to focus on now
   - Breaking down large tasks into subtasks

2. **Managing Time Blocks**
   - Suggesting optimal times to schedule tasks
   - Creating new time blocks
   - Adjusting existing blocks based on reality

3. **Using Playbooks**
   - Recommending relevant playbooks for their situation
   - Creating new playbooks for recurring challenges
   - Updating playbook steps

4. **Managing Projects**
   - Creating project structures
   - Organizing tasks within projects
   - Tracking project progress

## Response Format

**CRITICAL: You MUST structure responses to enable action execution.**

When you want to take an action (create task, schedule time, etc.), include JSON code blocks like this:

\`\`\`json
{
  "action": "create_task",
  "data": {
    "title": "Review Q3 report",
    "priority": "high",
    "estimatedMinutes": 30,
    "category": "work",
    "dueDate": "2024-03-20"
  }
}
\`\`\`

### Available Actions

**create_task**: Create a new task
- title (required)
- priority: "high" | "medium" | "low"
- category: "work" | "personal" | "health" | "household" | "social" | "finance"
- estimatedMinutes: number
- dueDate: "YYYY-MM-DD"
- description: string
- projectId: string

**update_task**: Update an existing task
- taskId (required)
- title, priority, category, etc. (any fields to update)

**create_time_block**: Schedule a time block
- title (required)
- startTime: "HH:MM" (required)
- endTime: "HH:MM" (required)
- category: same as tasks
- taskIds: string[] (optional, to link tasks)

**suggest_time_blocks**: Suggest when to schedule specific tasks
- taskIds: string[]

**create_playbook**: Create a new playbook template
- title (required): string - clear, actionable title
- description: string - brief overview of the playbook's purpose
- category: "productivity" | "cleaning" | "cooking" | "learning" | "self-care" | "creative" | "work" | "health" | "social" | "other"
- steps: string[] - array of step titles (e.g., ["Review materials", "Create outline", "Write first draft"])

Example:
\`\`\`json
{
  "action": "create_playbook",
  "data": {
    "title": "Weekly Meal Prep",
    "description": "Organized approach to preparing meals for the week",
    "category": "cooking",
    "steps": [
      "Plan meals for the week",
      "Create shopping list",
      "Go grocery shopping",
      "Prep vegetables and proteins",
      "Cook and portion meals",
      "Store in containers"
    ]
  }
}
\`\`\`

**update_playbook**: Update an existing playbook (add/modify steps)
- playbookId: string (if known) OR title: string (to find by title)
- steps: string[] - NEW array of steps (will replace existing)
- title: string (optional) - new title
- description: string (optional) - new description

Example:
\`\`\`json
{
  "action": "update_playbook",
  "data": {
    "title": "Weekly Meal Prep",
    "steps": [
      "Plan meals for the week",
      "Create shopping list",
      "Go grocery shopping",
      "Prep vegetables and proteins",
      "Cook and portion meals",
      "Store in containers",
      "Label with dates"
    ]
  }
}
\`\`\`

**create_project**: Create a new project
- title (required)
- description: string
- category: string

## Response Style

**Coaching Style: ${coachingStyle}**

${coachingStyle === 'direct' ? '- Be concise and action-oriented\n- Get straight to the solution\n- Use bullet points for clarity' : ''}
${coachingStyle === 'empathetic' ? '- Show understanding and validation\n- Take time to explain reasoning\n- Use encouraging language' : ''}
${coachingStyle === 'balanced' ? '- Mix empathy with efficiency\n- Explain briefly, then provide solution\n- Be friendly but focused' : ''}
${coachingStyle === 'analytical' ? '- Provide detailed reasoning\n- Use structured approaches\n- Reference data and patterns' : ''}

**General Guidelines:**
- Be conversational and helpful, not robotic
- If you're unsure about something, ask clarifying questions
- Reference specific tasks/blocks by title when discussing them
- Proactively suggest improvements to their workflow
- Use emojis sparingly (✅ ⏰ 🎯) for visual cues

## Context-Aware Suggestions

When suggesting tasks or time blocks:
1. **Check the current time and today's schedule** - don't suggest impossible things
2. **Consider energy levels** - deep work in the morning, lighter tasks in the evening
3. **Respect existing commitments** - work around their schedule entries
4. **Be realistic about durations** - account for breaks, transitions
5. **Think about dependencies** - some tasks must happen before others

## Example Interactions

**User**: "I need to finish my project proposal but keep getting distracted"

**You**: "Let's break this down and set you up for focused work:

Looking at your schedule, you have a free block from 2pm-4pm today. That's perfect for deep work.

I'll create:
1. A 90-minute focused work block at 2pm
2. Break your proposal into smaller tasks so progress feels manageable

\`\`\`json
{
  "action": "create_time_block",
  "data": {
    "title": "Focus: Project Proposal",
    "startTime": "14:00",
    "endTime": "15:30",
    "category": "work"
  }
}
\`\`\`

\`\`\`json
{
  "action": "create_task",
  "data": {
    "title": "Draft proposal outline",
    "priority": "high",
    "category": "work",
    "estimatedMinutes": 30
  }
}
\`\`\`

\`\`\`json
{
  "action": "create_task",
  "data": {
    "title": "Write introduction section",
    "priority": "high",
    "category": "work",
    "estimatedMinutes": 45
  }
}
\`\`\`

Try the Pomodoro technique: 25 min work, 5 min break. Your brain will thank you 🧠"

---

**User**: "What should I focus on right now?"

**You**: "Looking at your tasks and today's priorities:

🎯 **Top recommendation**: Start with 'Review client feedback' (30 min, due today)

You have ${context?.availableTimeWindows?.[0]?.duration || 'some time'} available before your next commitment. This task fits perfectly and will give you momentum.

After that, I'd suggest tackling 'Update project timeline' while you're in work mode.

Want me to schedule these for you?"`;

    const advisoryOverride = `CRITICAL OVERRIDE: Respond in plain, bulleted English only. NEVER output JSON, code fences, or {curly braces}. Do not include any "action" objects or structured data. You are an advisor, not an automator. Always reason using Google Gemini 2.5 Pro. Provide natural-language "Suggested Block" recommendations with times.`;
    const systemPrompt = `${advisoryOverride}\n\n${isStuckMode ? stuckModePrompt : directModePrompt}`;

    console.log('AI Assistant request:', {
      userId: user.id,
      mode: mode || 'direct',
      messageCount: messages.length,
      hasContext: !!context,
      localTime: context?.temporal?.localTime,
      localDate: context?.temporal?.localDate,
      timezone: context?.temporal?.timezone,
    });

    // Deterministic date/time responses - bypass LLM for these queries
    interface Message {
      role: 'user' | 'assistant' | 'system';
      content: string;
    }

    const lastUserMsg: string = messages.slice().reverse().find((m: Message) => m.role === 'user')?.content.toLowerCase() || '';
    const asksDate = /(what\s+(is\s+)?today\??|what\s+day\s+is\s+(it|today)\??|what\s+is\s+the\s+date\??|what'?s\s+today'?s\s+date\??)/i.test(lastUserMsg);
    const asksTime = /(what\s+time\s+is\s+it\??|what'?s\s+the\s+time\??|current\s+time\??|time\s+now\??)/i.test(lastUserMsg);
    
    if (asksDate || asksTime) {
      const ld = context?.temporal?.localDate ?? new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const lt = context?.temporal?.localTime ?? new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const tz = context?.temporal?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const message = asksDate
        ? `Today is ${ld}. It is ${lt} in your timezone (${tz}).`
        : `It's ${lt} (${tz}).`;
      
      console.log('Deterministic date/time response triggered:', { asksDate, asksTime, message });
      
      return new Response(JSON.stringify({
        message,
        actions: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform the last user message to include images if provided
    interface ContentPart {
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
      url: string;
      };
    }

    interface TransformedMessage {
      role: 'user' | 'assistant' | 'system';
      content: string | ContentPart[];
    }

    const transformedMessages: TransformedMessage[] = messages.map((msg: { role: 'user' | 'assistant' | 'system'; content: string }, idx: number) => {
      // If this is the last user message and we have images, transform it to multimodal format
      if (msg.role === 'user' && idx === messages.length - 1 && images && images.length > 0) {
      const contentParts: ContentPart[] = [];
      
      // Add text content if present
      if (msg.content && msg.content.trim()) {
        contentParts.push({
        type: 'text',
        text: msg.content
        });
      }
      
      // Add all images
      images.forEach((imageData: string) => {
        contentParts.push({
        type: 'image_url',
        image_url: {
          url: imageData
        }
        });
      });
      
      return {
        role: msg.role,
        content: contentParts
      };
      }
      
      // Return regular messages as-is
      return msg;
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          ...transformedMessages
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits depleted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let assistantMessage = data.choices[0].message.content;

    // Post-processing: Replace any incorrect time patterns with the correct time
    const correctTime = context?.temporal?.localTime;
    if (correctTime) {
      // Find all time patterns in the message (e.g., "3:07 PM", "1:56 AM")
      const timePattern = /\b\d{1,2}:\d{2}\s*[APap][Mm]\b/g;
      const timesInMessage = assistantMessage.match(timePattern) || [];
      
      // Replace any time that doesn't match the correct time
      timesInMessage.forEach((foundTime: string) => {
        if (foundTime.toUpperCase() !== correctTime.toUpperCase()) {
          assistantMessage = assistantMessage.replace(new RegExp(foundTime, 'g'), correctTime);
          console.log(`Replaced incorrect time "${foundTime}" with correct time "${correctTime}"`);
        }
      });
    }

    // Post-processing: Replace any incorrect date patterns with the correct date
    const correctDate = context?.temporal?.localDate;
    if (correctDate) {
      // Find "Today is <weekday>, <Month> <D>, <YYYY>" patterns
      const datePattern = /Today is [A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}/g;
      const datesInMessage = assistantMessage.match(datePattern) || [];
      
      // Replace any date that doesn't match the correct date
      datesInMessage.forEach((foundDate: string) => {
        const expectedPattern = `Today is ${correctDate}`;
        if (foundDate !== expectedPattern) {
          assistantMessage = assistantMessage.replace(foundDate, expectedPattern);
          console.log(`Replaced incorrect date "${foundDate}" with correct date "${expectedPattern}"`);
        }
      });
    }

    // Advisory mode: strip any code fences and JSON-like action blocks; no actions returned
    assistantMessage = assistantMessage
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\{[^{}]*"action"[^{}]*\}/g, '')
      .trim();
    const actions: any[] = [];

    return new Response(JSON.stringify({
      message: assistantMessage,
      actions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

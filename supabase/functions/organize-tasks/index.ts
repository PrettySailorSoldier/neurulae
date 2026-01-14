// @ts-nocheck - This is a Deno-based Supabase Edge Function. IDE TypeScript errors are expected.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// @ts-ignore - Deno types not available in IDE
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized: Missing auth header" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: 10 requests per hour for AI organization (non-blocking)
    let isRateLimited = false;
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: rateLimitCount, error: rateLimitError } = await supabase
        .from("rate_limits")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action", "organize_tasks")
        .gte("created_at", oneHourAgo);

      if (!rateLimitError && (rateLimitCount || 0) >= 10) {
        isRateLimited = true;
      }

      // Record this request for rate limiting (best effort)
      if (!rateLimitError && !isRateLimited) {
        try {
          await supabase.from("rate_limits").insert({ user_id: user.id, action: "organize_tasks" });
        } catch {
          /* ignore */
        }
      }
    } catch (_e: unknown) {
      // If rate_limits table doesn't exist, skip rate limiting
      console.log("Rate limiting skipped (table may not exist)");
    }

    if (isRateLimited) {
      console.log("Rate limit exceeded for user:", user.id);
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait before organizing more tasks (max 10 per hour).",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI configuration missing (API Key)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate input with proper schemas
    const taskSchema = z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(500),
      due_date: z.string().nullish(),
      estimated_minutes: z.number().int().min(0).max(1440).nullish(),
      type: z.string().max(50).nullish(),
      status: z.string().nullish(),
      user_id: z.string().uuid().nullish(),
    });

    const timeBlockSchema = z.object({
      id: z.string().uuid(),
      title: z.string().max(200).optional(),
      start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      type: z.string().optional(),
      scheduleType: z.string().optional(),
    });

    const requestSchema = z.object({
      tasks: z.array(taskSchema),
      timeBlocks: z.array(timeBlockSchema),
      today: z.string(), // Accept any ISO-like date string
    });

    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      console.error("Validation error:", validation.error.errors);
      const errorMessage = validation.error.errors.map((e: { path: (string | number)[]; message: string }) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return new Response(
        JSON.stringify({
          error: `Invalid request format: ${errorMessage}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { tasks, timeBlocks, today } = validation.data;

    // Early return if no tasks to organize
    if (tasks.length === 0) {
      return new Response(
        JSON.stringify({
          priorities: [],
          schedule: [],
          tips: ["Add some tasks first, then use AI to organize them!"],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Organizing tasks:", { taskCount: tasks.length, blockCount: timeBlocks.length });

    // Early return if no time blocks to schedule into
    if (timeBlocks.length === 0) {
      return new Response(
        JSON.stringify({
          priorities: tasks.map((t: { id: string }) => t.id).slice(0, 5), // Still prioritize tasks
          schedule: [],
          tips: ["Add time blocks to your schedule so AI can assign tasks to specific times."],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch existing schedule entries for today only (faster query)
    const todayDate = new Date(today);
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(todayDate.getDate() + 1);

    const { data: scheduleEntries, error: scheduleError } = await supabase
      .from("schedule_entries")
      .select("id, title, start_time, end_time, category")
      .eq("user_id", user.id)
      .gte("start_time", todayDate.toISOString())
      .lt("start_time", tomorrow.toISOString())
      .order("start_time");

    if (scheduleError) {
      console.error("Error fetching schedule entries:", scheduleError);
    }

    const busyBlocks = scheduleEntries || [];
    console.log(`Found ${busyBlocks.length} existing schedule entries for today`);

    // Streamlined prompts for faster processing
    const systemPrompt = `You are a quick task scheduling assistant. Today: ${today}. Prioritize tasks by urgency and schedule them into available time slots. Be concise.`;

    // Build compact task list
    type TaskItem = { id: string; name: string; due_date?: string | null; estimated_minutes?: number | null };
    const taskList = tasks.map((t: TaskItem) => `- ${t.id}: "${t.name}"${t.due_date ? ` (due: ${t.due_date})` : ""}${t.estimated_minutes ? ` ~${t.estimated_minutes}min` : ""}`).join("\n");
    
    // Build compact time blocks list with IDs that the AI must use
    type TimeBlockItem = { id: string; title?: string; start_time: string; end_time: string };
    const blockList = timeBlocks.map((b: TimeBlockItem) => `- ${b.id}: "${b.title || 'Time Block'}" (${b.start_time}-${b.end_time})`).join("\n");
    
    // Build compact busy blocks
    interface BusyBlock { start_time?: string; end_time?: string; title?: string; }
    const busyList = busyBlocks.length > 0 
      ? busyBlocks.map((b: BusyBlock) => `${b.start_time?.slice(11,16) || "?"}-${b.end_time?.slice(11,16) || "?"}: ${b.title || "busy"}`).join(", ")
      : "None";

    const userPrompt = `Schedule these tasks into the user's time blocks.

TASKS:
${taskList}

TIME BLOCKS (use exact blockId from these):
${blockList}

BUSY TODAY (avoid scheduling during): ${busyList}

IMPORTANT: In your schedule output, use the EXACT blockId (UUID) from the TIME BLOCKS list above. Return priorities (task IDs by urgency) and schedule (task-to-block assignments with exact blockIds).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "organize_tasks",
              description: "Organize tasks with priorities and schedule",
              parameters: {
                type: "object",
                properties: {
                  priorities: {
                    type: "array",
                    description: "Task IDs in priority order (most important first)",
                    items: { type: "string" },
                  },
                  schedule: {
                    type: "array",
                    description: "Scheduled tasks for today",
                    items: {
                      type: "object",
                      properties: {
                        taskId: { type: "string" },
                        blockId: { type: "string" },
                        estimatedMinutes: { type: "number" },
                        order: { type: "number", description: "Order within the block" },
                        reason: { type: "string", description: "Brief reason for this placement" },
                      },
                      required: ["taskId", "blockId"],
                    },
                  },
                  tips: {
                    type: "array",
                    description: "Brief productivity tips for the user",
                    items: { type: "string" },
                  },
                },
                required: ["priorities", "schedule"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "organize_tasks" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "organize_tasks") {
      throw new Error("Invalid AI response format");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // Log full error details server-side for debugging
    console.error("Error in organize-tasks function:", error);
    
    // Return a generic, sanitized message to the client (never expose internal details)
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred while organizing tasks. Please try again.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

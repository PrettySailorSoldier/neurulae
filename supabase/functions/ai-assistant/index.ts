import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build enhanced system prompt with context
    const systemPrompt = `You are an expert productivity coach and AI life planning assistant designed to help adults struggling with task management. Your mission is to guide users toward meaningful life progress through intelligent prioritization, balanced scheduling, and motivational support.

## Core Philosophy: The 3x3 Priority Matrix

You work with a modified Eisenhower Matrix that classifies tasks along two axes:

**IMPORTANCE (The "Why"):**
- 🎯 CRITICAL: Tasks directly linked to major life goals, personal values, or with severe consequences if not completed (e.g., career certifications, paying rent, critical health appointments)
- 🔧 NECESSARY: Essential upkeep that maintains daily life and prevents future problems (e.g., grocery shopping, routine emails, regular health check-ups)
- ✨ OPTIONAL: Quality-of-life improvements with low negative impact if postponed (e.g., organizing, hobby learning, entertainment)

**URGENCY (The "When"):**
- 🔥 IMMEDIATE: Due within 24 hours
- ⏳ SHORT-TERM: Due within the next 7 days
- 🗓️ LONG-TERM: Due in more than a week or no specific deadline

## Priority Score Formula

You mentally calculate: **Priority Score = (Importance Weight) + (Urgency Weight) - (Procrastination Penalty)**

- **Importance Weight**: Critical tasks get highest weight, especially in neglected life domains. Necessary tasks get moderate weight. Optional tasks get low weight.
- **Urgency Weight**: Increases exponentially as deadlines approach. Tomorrow's task >> next week's task.
- **Procrastination Penalty**: Small accumulating value for tasks that linger incomplete, ensuring they eventually surface.

## Life Domains & Balance

Tasks belong to domains (Career, Health, Family, Self-Care, Household, Social, Personal Growth). Monitor balance:
- If someone has completed 90% Work tasks for 2 weeks, gently nudge toward Self-Care
- Celebrate when neglected domains get attention
- Suggest energy-appropriate tasks: High energy → Critical projects, Medium → Necessary chores, Low → Optional relaxation

## Your Coaching Style

1. **Diagnostic First**: Ask about energy levels, current stress, what's been neglected
2. **Prioritize Ruthlessly**: Help users identify the 3-5 tasks that actually matter today
3. **Balance Advocate**: Point out imbalances and suggest corrections with empathy
4. **Motivational**: Celebrate completions, especially for procrastinated tasks. Use positive reinforcement.
5. **Practical**: Offer specific, actionable advice. Break overwhelming tasks into steps.
6. **Boundary Setter**: Encourage "Shutdown Complete" routines to separate work/life

## Current User Context

- Tasks: ${context.tasks.length} tasks (${context.tasks.filter((t: any) => !t.completed).length} incomplete)
- Time Blocks: ${context.timeBlocks.length} scheduled blocks
- Current Date: ${new Date(context.currentDate).toLocaleDateString()}

## Available Actions

When appropriate, you can suggest:
- updateTask: { taskId: "id", updates: { priority: "high", eisenhowerQuadrant: "critical-immediate" } }
- updateTimeBlock: { blockId: "id", updates: { title: "Focus Time: Critical Task" } }

## Example Interactions

User: "I'm overwhelmed, everything feels urgent"
You: "Let's take a breath and prioritize. What are the 1-2 tasks that would have serious consequences if not done today? Let's focus there first, then we'll handle the rest."

User: "I've been working non-stop"
You: "I notice your last 20 completed tasks were all Work-related. That's impressive dedication, but burnout is real. Can we schedule 30 minutes for a Self-Care activity today? Even a short walk can recharge you."

Always be supportive, ask clarifying questions, and help users make progress toward their meaningful life goals—not just checking boxes.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        // Future: Parse for structured actions if AI suggests specific changes
        actions: null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

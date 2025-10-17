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
    const systemPrompt = `You are Neurulae, an expert AI scheduling assistant with deep knowledge of time management methodologies including:
- Time Blocking
- Pomodoro Technique
- Eisenhower Matrix (Urgent/Important quadrants)
- Getting Things Done (GTD)
- Energy Management
- Deep Work principles

Your personality:
- Expert: You demonstrate evidence-based understanding of productivity science
- Insightful: You learn from user patterns and adapt suggestions
- Proactive: You offer suggestions without being asked
- Supportive: Professional, encouraging tone that helps users stay on track

Current user context:
- Tasks: ${context.tasks.length} tasks (${context.tasks.filter((t: any) => !t.completed).length} incomplete)
- Time Blocks: ${context.timeBlocks.length} scheduled blocks
- Current Date: ${new Date(context.currentDate).toLocaleDateString()}

Key capabilities:
1. Break down large projects into manageable sub-tasks
2. Suggest optimal scheduling based on task complexity and user energy patterns
3. Identify scheduling conflicts and suggest resolutions
4. Recommend specific techniques for different task types
5. Encourage breaks and work-life balance
6. Learn from user behavior and adjust recommendations

When suggesting actions:
- Ask clarifying questions to understand user preferences
- Explain your reasoning behind suggestions
- Offer multiple options when appropriate
- Be specific about time allocations
- Consider energy levels and work patterns

If you need to take actions (like rescheduling tasks), describe what you would do and ask for confirmation first.`;

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

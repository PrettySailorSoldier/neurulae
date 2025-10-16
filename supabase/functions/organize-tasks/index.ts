import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { tasks, timeBlocks, preferences, today } = await req.json();

    console.log('Organizing tasks:', { taskCount: tasks.length, blockCount: timeBlocks.length });

    const systemPrompt = `You are a world-class time management expert with deep expertise in productivity, energy management, and task prioritization.

Your role: Analyze tasks and time blocks to create an optimal schedule that maximizes productivity and well-being.

Prioritization principles:
- Urgency: Due dates and time-sensitive items first
- Impact: High-value tasks that move important goals forward
- Energy: Match task difficulty to available energy levels
- Dependencies: Tasks that enable other work
- Quick wins: Small tasks that build momentum

Scheduling principles:
- Deep work in morning blocks when possible (if user prefers)
- Group similar tasks to reduce context switching
- Leave buffer time between meetings
- Respect work hour limits
- Balance challenging and easier tasks

Consider:
- Task complexity and estimated duration
- Available time blocks and their types
- User's stated preferences
- Realistic expectations for a single day
- The importance of breaks and transitions`;

    const userPrompt = `Today is ${today}. Please organize these tasks:

TASKS:
${tasks.map((t: any, i: number) => `${i + 1}. "${t.title}"${t.notes ? ` (Notes: ${t.notes})` : ''}${t.dueDate ? ` (Due: ${t.dueDate})` : ''}${t.focusTimeMinutes ? ` (Est: ${t.focusTimeMinutes}m)` : ''}`).join('\n')}

TIME BLOCKS:
${timeBlocks.map((b: any) => `- ${b.title}: ${b.startTime} - ${b.endTime} (${b.type}, ${b.scheduleType})`).join('\n')}

USER PREFERENCES:
${preferences?.workHours ? `Work hours: ${preferences.workHours}` : 'No specific work hours set'}
${preferences?.maxDeepWork ? `Max deep work: ${preferences.maxDeepWork} minutes` : ''}
${preferences?.preferMornings ? 'Prefers mornings for deep work' : ''}

Provide a prioritized list and schedule. Don't over-schedule - leave room for breaks and unexpected items.`;

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
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'organize_tasks',
              description: 'Organize tasks with priorities and schedule',
              parameters: {
                type: 'object',
                properties: {
                  priorities: {
                    type: 'array',
                    description: 'Task IDs in priority order (most important first)',
                    items: { type: 'string' }
                  },
                  schedule: {
                    type: 'array',
                    description: 'Scheduled tasks for today',
                    items: {
                      type: 'object',
                      properties: {
                        taskId: { type: 'string' },
                        blockId: { type: 'string' },
                        estimatedMinutes: { type: 'number' },
                        order: { type: 'number', description: 'Order within the block' },
                        reason: { type: 'string', description: 'Brief reason for this placement' }
                      },
                      required: ['taskId', 'blockId']
                    }
                  },
                  tips: {
                    type: 'array',
                    description: 'Brief productivity tips for the user',
                    items: { type: 'string' }
                  }
                },
                required: ['priorities', 'schedule']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'organize_tasks' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'organize_tasks') {
      throw new Error('Invalid AI response format');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in organize-tasks function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

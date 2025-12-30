import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { taskTitle, taskDescription, estimatedMinutes } = await req.json();

    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: 'Task title is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI Gateway to break down the task
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are a productivity assistant helping break down tasks into manageable subtasks.

Your job is to:
1. Break down the given task into 3-7 concrete, actionable subtasks
2. Make each subtask specific and clear
3. Order subtasks logically (what needs to be done first)
4. Keep subtasks focused and not too granular
5. If the task is already small enough, suggest 2-3 key steps

Return ONLY a JSON object with this structure:
{
  "subtasks": [
    { "title": "First subtask to do", "estimatedMinutes": 15 },
    { "title": "Second subtask", "estimatedMinutes": 20 }
  ]
}

Do not include any other text or explanation, ONLY the JSON object.`,
          },
          {
            role: 'user',
            content: `Break down this task:
Title: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}
${estimatedMinutes ? `Estimated time: ${estimatedMinutes} minutes` : ''}

Please provide 3-7 actionable subtasks in JSON format.`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to generate subtasks' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let subtasks;
    try {
      // Try to extract JSON from the response (AI might include markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        subtasks = parsed.subtasks;
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', rawResponse: content }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate subtasks
    if (!Array.isArray(subtasks) || subtasks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid subtasks format' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ subtasks }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in breakdown-task function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

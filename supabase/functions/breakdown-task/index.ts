
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY is not configured');
    return new Response(
      JSON.stringify({ error: 'AI service not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { taskTitle, taskDescription, estimatedMinutes, energyLevel, context } = await req.json();

    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: 'Task title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Breaking down task:', taskTitle);

    // Call Lovable AI Gateway to break down the task
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash',
        messages: [
          {
            role: 'system',
            content: `You are a productivity coach specializing in helping neurodivergent people break down overwhelming tasks into manageable pieces.

Your approach:
1. **Micro-steps first**: Break tasks into the SMALLEST possible actions. What might be one step for others should be 2-3 for someone who struggles with executive function.
2. **Clear start points**: Each subtask should have an obvious "first move" - eliminate decision paralysis.
3. **Sensory-friendly**: Note if a step is noisy, requires movement, or is desk-based.
4. **Energy-aware**: Mark steps as "low-energy" (can do when tired) or "high-energy" (needs focus).
5. **Blockers identified**: Note potential obstacles and how to overcome them.
6. **Celebration points**: Include natural stopping points where the person can feel accomplished.

Return ONLY a JSON object with this structure:
{
  "overview": "A brief, encouraging summary of the task and approach (1-2 sentences)",
  "totalEstimatedMinutes": 45,
  "subtasks": [
    {
      "title": "Clear action verb + specific task",
      "description": "What exactly to do and why it matters (2-3 sentences)",
      "estimatedMinutes": 10,
      "energyLevel": "low" | "medium" | "high",
      "tip": "A helpful hint for this specific step",
      "potentialBlocker": "What might make this hard and how to handle it",
      "isCheckpoint": true | false
    }
  ],
  "completionReward": "A suggested small reward for finishing this task"
}

Do not include any markdown, code blocks, or explanation - ONLY the raw JSON object.`,
          },
          {
            role: 'user',
            content: `Break down this task into detailed, actionable steps:

**Task**: ${taskTitle}
${taskDescription ? `**Details**: ${taskDescription}` : ''}
${estimatedMinutes ? `**Estimated time**: About ${estimatedMinutes} minutes` : ''}
${energyLevel ? `**Current energy level**: ${energyLevel}/10` : ''}
${context ? `**Context**: ${context}` : ''}

Create 4-8 detailed subtasks with clear descriptions, tips, and potential blockers. Make each step feel achievable.`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate subtasks. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let breakdownData;
    try {
      // Try to extract JSON from the response (AI might include markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        breakdownData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate subtasks
    if (!breakdownData.subtasks || !Array.isArray(breakdownData.subtasks) || breakdownData.subtasks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid subtasks format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generated ${breakdownData.subtasks.length} detailed subtasks`);

    // Return full breakdown data
    return new Response(
      JSON.stringify({
        overview: breakdownData.overview || null,
        totalEstimatedMinutes: breakdownData.totalEstimatedMinutes || null,
        subtasks: breakdownData.subtasks.map((st: any) => ({
          title: st.title,
          description: st.description || null,
          estimatedMinutes: st.estimatedMinutes || 10,
          energyLevel: st.energyLevel || 'medium',
          tip: st.tip || null,
          potentialBlocker: st.potentialBlocker || null,
          isCheckpoint: st.isCheckpoint || false,
        })),
        completionReward: breakdownData.completionReward || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in breakdown-task function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

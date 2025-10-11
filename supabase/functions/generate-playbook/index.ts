import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  estimatedMinutes?: number;
  completed: boolean;
  order: number;
  tips?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, details, category } = await req.json();
    
    if (!goal) {
      return new Response(
        JSON.stringify({ error: 'Goal is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating playbook for goal:', goal);

    const systemPrompt = `You are a helpful assistant that creates detailed, neurodivergent-friendly step-by-step playbooks.
Your goal is to break down complex tasks into manageable, actionable steps that account for potential executive dysfunction challenges.

IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any markdown, explanations, or extra text.

The JSON must follow this exact structure:
{
  "title": "Playbook title",
  "steps": [
    {
      "title": "Step title",
      "description": "Detailed step description",
      "estimatedMinutes": 15,
      "tips": ["Helpful tip 1", "Helpful tip 2"]
    }
  ]
}

Guidelines for creating steps:
- Break down the goal into 5-10 actionable steps
- Each step should be specific and concrete
- Include estimated time for each step (in minutes)
- Add 2-3 helpful tips per step to overcome common challenges
- Use encouraging and supportive language
- Consider sensory needs and energy management
- Account for potential distractions or difficulties
- Make steps as simple and clear as possible`;

    const userPrompt = `Create a playbook for: ${goal}${details ? `\n\nAdditional context: ${details}` : ''}${category ? `\n\nCategory: ${category}` : ''}

Remember to respond with ONLY valid JSON, no markdown or explanations.`;

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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate playbook' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response content:', content);

    // Parse the JSON response - handle potential markdown wrapping
    let playbookData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      playbookData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform the AI response into our PlaybookStep format
    const steps: PlaybookStep[] = playbookData.steps.map((step: any, index: number) => ({
      id: crypto.randomUUID(),
      title: step.title,
      description: step.description,
      estimatedMinutes: step.estimatedMinutes || 15,
      completed: false,
      order: index,
      tips: step.tips || [],
    }));

    console.log('Generated playbook with', steps.length, 'steps');

    return new Response(
      JSON.stringify({
        title: playbookData.title || goal,
        steps,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-playbook function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
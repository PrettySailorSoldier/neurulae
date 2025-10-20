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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    // Read file content
    const fileContent = await file.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileContent)));

    // Use Lovable AI to parse the schedule
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Parsing schedule PDF with AI...');

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
            content: `You are a schedule parser. Extract all work shifts, classes, meetings, and homework deadlines from the provided document. Return ONLY a JSON array with this exact structure, no other text:

{
  "entries": [
    {
      "title": "exact event name",
      "description": "any additional details",
      "startTime": "ISO 8601 datetime",
      "endTime": "ISO 8601 datetime",
      "category": "work|class|homework|meeting|other",
      "location": "location if mentioned"
    }
  ]
}

Rules:
- Parse ALL dates relative to current date if year not specified
- For homework deadlines, assume end of day (11:59 PM) if no time given
- For classes, extract start and end times from schedule
- Use category: "work" for shifts, "class" for classes, "homework" for assignments, "meeting" for meetings
- If document contains no schedule, return {"entries": []}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Parse this schedule document and extract all events:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Content}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI parsing failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    let parsedData;
    try {
      // Extract JSON if wrapped in markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsedData = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('Failed to parse schedule from AI response');
    }

    console.log(`Successfully parsed ${parsedData.entries?.length || 0} schedule entries`);

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing schedule:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to parse schedule',
        entries: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

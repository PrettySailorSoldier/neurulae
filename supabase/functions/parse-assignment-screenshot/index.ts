import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      throw new Error('No image provided');
    }

    console.log('Processing screenshot for assignment extraction...');

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const imageUrl = `data:${imageFile.type};base64,${base64Image}`;

    // Call Lovable AI with vision
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
            content: `You are an assignment extractor. Analyze Canvas/LMS screenshots and extract all assignments with their due dates.

CRITICAL RULES:
1. Extract every visible assignment title
2. Extract the exact due date shown (format: "Nov 8", "Nov 9", etc.)
3. If no year is shown, assume current year
4. Return ONLY valid JSON, no markdown formatting
5. Set end time to 11:59 PM on the due date
6. Categorize by course/class if visible

Return format:
{
  "assignments": [
    {
      "title": "Assignment name",
      "dueDate": "Nov 8",
      "course": "Course name if visible",
      "category": "homework"
    }
  ]
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all assignments and due dates from this Canvas screenshot. Return JSON only.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to your workspace.');
      }
      throw new Error('AI processing failed');
    }

    const aiData = await aiResponse.json();
    let extractedData = aiData.choices[0].message.content;
    
    console.log('Raw AI response:', extractedData);

    // Clean up markdown formatting if present
    extractedData = extractedData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(extractedData);
    
    if (!parsed.assignments || !Array.isArray(parsed.assignments)) {
      throw new Error('Invalid AI response format');
    }

    // Convert to schedule entries format
    const currentYear = new Date().getFullYear();
    const entries = parsed.assignments.map((assignment: any) => {
      // Parse the due date (e.g., "Nov 8")
      const dueDateStr = `${assignment.dueDate} ${currentYear}`;
      const dueDate = new Date(dueDateStr);
      
      // Set end time to 11:59 PM
      dueDate.setHours(23, 59, 0, 0);
      
      // Set start time to 11:00 PM (1 hour before due)
      const startTime = new Date(dueDate);
      startTime.setHours(23, 0, 0, 0);

      return {
        title: assignment.title,
        course: assignment.course || 'Imported',
        category: assignment.category || 'homework',
        startTime: startTime.toISOString(),
        endTime: dueDate.toISOString(),
        dueDate: dueDate.toISOString()
      };
    });

    console.log(`Extracted ${entries.length} assignments from screenshot`);

    return new Response(
      JSON.stringify({ 
        success: true,
        entries,
        count: entries.length
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in parse-assignment-screenshot:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

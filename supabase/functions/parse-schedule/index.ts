import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file size (20MB max)
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum 20MB allowed.');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PDF and images (PNG, JPEG, WebP) allowed.');
    }

    // Read file content and convert to base64 in chunks to avoid stack overflow
    const fileContent = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileContent);
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Content = btoa(binaryString);

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
            content: `You are a schedule and assignment parser. Extract ALL classes, meetings, work shifts, and especially COURSE ASSIGNMENTS from the provided document or screenshot (e.g. LMS dashboards like Canvas/Blackboard with course cards and Due lists).

Return ONLY a JSON object in this exact shape, no extra text:
{
  "entries": [
    {
      "title": "exact event/assignment name",
      "description": "any additional details (e.g., course name, notes)",
      "startTime": "ISO 8601 datetime",
      "endTime": "ISO 8601 datetime",
      "category": "work|class|homework|meeting|other",
      "location": "location if mentioned"
    }
  ]
}

Guidelines:
- Parse dates that omit the year relative to the current year.
- When parsing an LMS "Due" list (e.g., Quiz, Assignment, Lab, Project, Paper, Discussion, Exam, Test), treat them as homework with a due time of 11:59 PM if no time is provided.
- For classes/meetings/shifts, extract both start and end times explicitly.
- Include course name in description if visible (e.g., "Intro to Business").
- Normalize categories: map Assignment/Quiz/Exam/Lab/Project/Paper/Discussion to category "homework".
- If no schedule content is present, return {"entries": []}.`
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
                  url: `data:${file.type || 'application/octet-stream'};base64,${base64Content}`
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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a minute and try again.', entries: [] }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.', entries: [] }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

    // Normalize categories, ensure datetimes, and dedupe entries
    const rawEntries = Array.isArray(parsedData?.entries) ? parsedData.entries : [];

    const normalizeCategory = (c: any) => {
      if (!c) return 'other';
      const v = String(c).toLowerCase();
      if (['assignment','homework','quiz','exam','lab','project','paper','discussion'].some(k => v.includes(k))) return 'homework';
      if (v.includes('class') || v.includes('lecture') || v.includes('course')) return 'class';
      if (v.includes('work') || v.includes('shift')) return 'work';
      if (v.includes('meeting')) return 'meeting';
      return 'other';
    };

    const toISO = (s: any) => {
      try { return new Date(s).toISOString(); } catch { return undefined; }
    };

    const seen = new Set<string>();
    const normalized = rawEntries
      .map((e: any) => {
        const start = e.startTime || e.start_time;
        const end = e.endTime || e.end_time;
        let startISO = start ? toISO(start) : undefined;
        let endISO = end ? toISO(end) : undefined;
        if (!startISO && endISO) startISO = endISO;
        if (!endISO && startISO) endISO = startISO;
        return {
          title: String(e.title || '').trim().slice(0, 200),
          description: e.description || null,
          startTime: startISO,
          endTime: endISO,
          category: normalizeCategory(e.category),
          location: e.location || null,
        };
      })
      .filter((e: any) => e.startTime && e.endTime && e.title)
      .filter((e: any) => {
        const dayKey = (e.startTime as string).slice(0, 10);
        const key = `${e.title}|${dayKey}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 500);

    console.log(`Successfully parsed ${normalized.length} schedule entries`);

    return new Response(
      JSON.stringify({ entries: normalized }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing schedule:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to parse schedule. Please try again or check your file format.',
        entries: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import JSON5 from 'https://esm.sh/json5@2.2.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Optional auth (public function). If a token is provided, forward it to downstream services for attribution.
    const authHeader = req.headers.get('Authorization') || undefined;

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

    // Validate file type (support missing/incorrect mime types by falling back to extension)
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif'];
    const name = (file as any).name || '';
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'];
    const typeOk = allowedTypes.includes(file.type || '') || allowedExts.includes(ext);
    if (!typeOk) {
      throw new Error('Invalid file type. Only PDF and images (PNG, JPEG, WEBP, HEIC) allowed.');
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
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an intelligent schedule and assignment parser that extracts schedules AND automatically breaks up homework assignments into manageable daily chunks.

CRITICAL ASSIGNMENT DISTRIBUTION LOGIC:
When you see multiple assignments due on the same date (e.g., 10 assignments due Nov 9):
1. DO NOT return all 10 on Nov 9 - this is overwhelming
2. Calculate days until due date (if today is Nov 5, you have 4 days)
3. Distribute assignments across available days BEFORE due date:
   - Day 1 (Nov 5): 3 assignments (1-2 hours each)
   - Day 2 (Nov 6): 3 assignments (1-2 hours each)  
   - Day 3 (Nov 7): 4 assignments (1-2 hours each)
   - Never put work ON the due date itself
4. For large individual assignments (papers, projects): Break into parts across 2-3 days
   - "Research Paper" → "Research Paper - Research & Outline" (Day 1), "Research Paper - Writing" (Day 2), "Research Paper - Final Edits" (Day 3)

Return ONLY a JSON object:
{
  "entries": [
    {
      "title": "Assignment title (add '- Part X' or '- [Section]' if breaking up large work)",
      "description": "Course name + original due date if homework",
      "startTime": "ISO 8601 datetime (schedule 1-2 hours for each homework chunk)",
      "endTime": "ISO 8601 datetime",
      "category": "work|class|homework|meeting|other",
      "location": "location if mentioned"
    }
  ]
}

Guidelines:
- Parse dates relative to current year if year is missing
- Homework items (Quiz, Assignment, Lab, Project, etc.) should be distributed across days
- Never schedule more than 4 homework items per day
- Start homework 3-5 days before due date when possible
- For classes/meetings: extract exact start/end times
- Include course name in description for homework
- Map Assignment/Quiz/Exam/Lab/Project/Paper/Discussion to category "homework"
- If no schedule found, return {"entries": []}`
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

    // Parse JSON from response (very robust)
    let parsedData;
    try {
      // Prefer structured fields when available
      const maybeParsed = (result?.choices?.[0]?.message as any)?.parsed;
      if (maybeParsed && typeof maybeParsed === 'object' && 'entries' in maybeParsed) {
        parsedData = maybeParsed;
      } else if (typeof content === 'object' && content && 'entries' in (content as any)) {
        parsedData = content;
      } else {
        let text = typeof content === 'string' ? content.trim() : '';

        const stripCodeFences = (s: string) => {
          if (s.startsWith('```')) {
            return s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
          }
          return s;
        };

        const tryParseAny = (s: string) => {
          try { return JSON.parse(s); } catch {}
          try { return JSON5.parse(s); } catch {}
          return null;
        };

        // Attempt raw and fence-stripped first
        let candidate = text ? tryParseAny(text) : null;
        if (!candidate && text) candidate = tryParseAny(stripCodeFences(text));
        if (!candidate && text) candidate = tryParseAny(stripCodeFences(text).replace(/,\s*([}\]])/g, '$1'));

        // Brace-matching extractor for first well-formed JSON object
        const extractFirstJSONObject = (s: string): string | null => {
          let inString = false, escape = false, depth = 0, start = -1;
          for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (inString) {
              if (escape) { escape = false; continue; }
              if (ch === '\\') { escape = true; continue; }
              if (ch === '"') inString = false;
              continue;
            } else {
              if (ch === '"') { inString = true; continue; }
              if (ch === '{') { if (depth === 0) start = i; depth++; continue; }
              if (ch === '}') { depth--; if (depth === 0 && start !== -1) return s.slice(start, i + 1); }
            }
          }
          return null;
        };

        if (!candidate && text) {
          const inner = extractFirstJSONObject(text);
          if (inner) {
            candidate = tryParseAny(inner) || tryParseAny(inner.replace(/,\s*([}\]])/g, '$1'));
          }
        }

        if (!candidate) throw new Error('json_parse_failed');
        parsedData = candidate;
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON (raw length):', String(content).length);
      console.error('Raw AI content head:', String(content).slice(0, 500));
      return new Response(
        JSON.stringify({ 
          error: 'The AI returned malformed JSON. Please try again.',
          entries: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

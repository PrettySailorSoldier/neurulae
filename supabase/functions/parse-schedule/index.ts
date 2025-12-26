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
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', entries: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', entries: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing schedule for user:', user.id);

    // Rate limiting: 5 file uploads per hour (non-blocking)
    let isRateLimited = false;
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: rateLimitCount, error: rateLimitError } = await supabase
        .from('rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'parse_schedule')
        .gte('created_at', oneHourAgo);

      if (!rateLimitError && (rateLimitCount || 0) >= 5) {
        isRateLimited = true;
      }

      // Record this request for rate limiting (best effort)
      if (!rateLimitError && !isRateLimited) {
        try {
          await supabase.from('rate_limits').insert({ user_id: user.id, action: 'parse_schedule' });
        } catch { /* ignore */ }
      }
    } catch (e) {
      // If rate_limits table doesn't exist, skip rate limiting
      console.log('Rate limiting skipped (table may not exist):', e);
    }

    if (isRateLimited) {
      console.log('Rate limit exceeded for user:', user.id);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please wait before uploading more schedules (max 5 per hour).',
        entries: []
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file size (10MB max - reduced for security/memory reasons)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum 10MB allowed.');
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
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(JSON.stringify({ error: 'AI processing unavailable (no API key)', entries: [] }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Parsing schedule PDF with AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          model: 'google/gemini-1.5-flash',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an intelligent schedule parser that extracts work schedules, class schedules, and homework assignments.

IMPORTANT RECOGNITION RULES:
1. WORK SCHEDULES: Look for shift times, store/company names (Target, Starbucks, etc.), departments
   - Example: "Target 11/5 2:00 PM - 10:30 PM" → work shift
   - Category: "work"
   - Extract exact start/end times for each shift

2. CLASS SCHEDULES: Look for course codes (MATH 101, ENG 202), room numbers, recurring patterns
   - Example: "Business Communication MW 10:00-11:15 Room 204" → class
   - Category: "class"  
   - If recurring (M/T/W/Th/F pattern), create entries for next 2 weeks

3. HOMEWORK/ASSIGNMENTS: Quizzes, papers, labs, projects, readings
   - Example: "Chapter 4 Quiz Due Nov 8" → homework
   - Category: "homework"
   - Schedule 1-2 hours per assignment, 3-5 days before due date

DATE HANDLING:
- Current year is ${new Date().getFullYear()}
- If year is missing or shows 2023/2024, use ${new Date().getFullYear()} instead
- For dates that have passed this year, assume next occurrence (e.g., Nov 5 2025 if today is Dec 1 2025)
- Convert all dates to ISO 8601 format with proper timezone

Return ONLY valid JSON (no markdown, no explanation):
{
  "entries": [
    {
      "title": "Brief descriptive title",
      "description": "Additional context (course name, store name, due date)",
      "startTime": "2025-11-05T14:00:00Z",
      "endTime": "2025-11-05T22:30:00Z", 
      "category": "work|class|homework|meeting|other",
      "location": "Store/room location if mentioned"
    }
  ]
}

If no schedule found, return: {"entries": []}

Keep titles concise (under 50 chars). Prioritize accuracy over quantity.`
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
          max_tokens: 4000,
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

    const currentYear = new Date().getFullYear();
    const toISO = (s: any) => {
      try { 
        const date = new Date(s);
        // Adjust year if parsed as 2023 or 2024
        if (date.getFullYear() < currentYear) {
          date.setFullYear(currentYear);
        }
        return date.toISOString(); 
      } catch { return undefined; }
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Parse and validate the request body
    const requestSchema = z.object({
      action: z.enum(['create_time_block']),
      title: z.string().min(1).max(200),
      startTime: z.string(), // Can be time string or datetime
      endTime: z.string(),   // Can be time string or datetime
      category: z.string().max(50).optional(),
      taskIds: z.array(z.string()).optional(),
      dayOfWeek: z.number().int().min(0).max(6).optional(),
    });

    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body));

    const validatedData = requestSchema.parse(body);
    console.log('Validated data:', JSON.stringify(validatedData));

    // Handle create_time_block action
    if (validatedData.action === 'create_time_block') {
      // Parse the time strings
      let startTime: string;
      let endTime: string;
      let dayOfWeek: number | null = validatedData.dayOfWeek ?? null;

      // Check if times are full datetime strings or just time strings
      if (validatedData.startTime.includes('T') || validatedData.startTime.includes(' ')) {
        // Parse as datetime and extract time
        const startDate = new Date(validatedData.startTime);
        const endDate = new Date(validatedData.endTime);
        
        startTime = startDate.toTimeString().split(' ')[0]; // HH:MM:SS
        endTime = endDate.toTimeString().split(' ')[0];
        
        // If dayOfWeek not provided, extract from startDate
        if (dayOfWeek === null) {
          dayOfWeek = startDate.getDay(); // 0=Sunday, 6=Saturday
        }
      } else {
        // Already in time format (HH:MM or HH:MM:SS)
        startTime = validatedData.startTime.length === 5 
          ? `${validatedData.startTime}:00` 
          : validatedData.startTime;
        endTime = validatedData.endTime.length === 5 
          ? `${validatedData.endTime}:00` 
          : validatedData.endTime;
        
        // Default to current day if not specified
        if (dayOfWeek === null) {
          dayOfWeek = new Date().getDay();
        }
      }

      console.log('Processed times:', { startTime, endTime, dayOfWeek });

      // Insert into recurring_time_blocks table
      const { data: timeBlock, error: insertError } = await supabase
        .from('recurring_time_blocks')
        .insert({
          user_id: user.id,
          title: validatedData.title,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          category: validatedData.category || 'other',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Successfully created time block:', timeBlock);

      return new Response(
        JSON.stringify({
          success: true,
          timeBlock,
          message: `Time block "${validatedData.title}" created successfully`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // If we get here, action wasn't handled
    throw new Error(`Unsupported action: ${validatedData.action}`);

  } catch (error) {
    console.error('Error in manage-time-blocks function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = errorMessage === 'Unauthorized' ? 401 : 400;

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error instanceof z.ZodError ? error.errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});

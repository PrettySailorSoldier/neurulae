import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Server-side admin verification endpoint.
 * This provides defense-in-depth beyond RLS by explicitly verifying
 * admin status before sensitive admin UI renders.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('verify-admin: No auth header');
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Unauthorized' }),
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
      console.error('verify-admin: Auth failed:', authError);
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('verify-admin: Checking admin status for user:', user.id);

    // Check if user has admin role using the same RLS-protected query
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('verify-admin: Error checking roles:', rolesError);
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Failed to verify admin status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = roles?.some(r => r.role === 'admin') ?? false;
    
    console.log('verify-admin: User', user.id, 'isAdmin:', isAdmin);

    return new Response(
      JSON.stringify({ isAdmin, userId: user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('verify-admin: Unexpected error:', error);
    return new Response(
      JSON.stringify({ isAdmin: false, error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
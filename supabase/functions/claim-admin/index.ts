import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The ONLY email that can claim admin access - stored securely in environment variable
// Set this in Supabase Dashboard > Edge Functions > claim-admin > Secrets
// Add secret: ADMIN_MASTER_EMAIL = your-admin-email@example.com
const MASTER_EMAIL = Deno.env.get("ADMIN_MASTER_EMAIL");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
    );

    try {
        // Authenticate user
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "No authorization header" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !userData.user) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        const user = userData.user;

        // CRITICAL: Only allow the master email
        if (user.email !== MASTER_EMAIL) {
            console.log(`[CLAIM-ADMIN] Unauthorized attempt from: ${user.email?.slice(-10)}`);
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403,
            });
        }

        // Check if already admin
        const { data: existingRole } = await supabaseClient
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle();

        if (existingRole) {
            return new Response(JSON.stringify({ success: true, message: "Already admin" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Insert admin role
        const { error: insertError } = await supabaseClient
            .from("user_roles")
            .insert({ user_id: user.id, role: "admin" });

        if (insertError) {
            console.error("[CLAIM-ADMIN] Insert error:", insertError);
            return new Response(JSON.stringify({ error: "Failed to claim admin" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            });
        }

        console.log(`[CLAIM-ADMIN] Admin role granted to user ${user.id.slice(-6)}`);

        return new Response(JSON.stringify({ success: true, message: "Admin access granted" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[CLAIM-ADMIN] ERROR:", errorMessage);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});

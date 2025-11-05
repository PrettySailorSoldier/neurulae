import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  code: z.string().trim().min(1).max(50),
});

const logStep = (step: string, details?: any) => {
  if (details) {
    if (details.userId) details.userId = details.userId.slice(-6);
  }
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REDEEM-PROMO] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Validate request
    const body = await req.json();
    const { code } = requestSchema.parse(body);
    logStep("Validating promo code", { code });

    // Find promo code (case-insensitive)
    const { data: promoCode, error: findError } = await supabaseClient
      .from("promo_codes")
      .select("*")
      .ilike("code", code)
      .eq("active", true)
      .single();

    if (findError || !promoCode) {
      logStep("Invalid promo code", { code });
      return new Response(
        JSON.stringify({ error: "Invalid or expired promo code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if already redeemed by this user
    const { data: existingRedemption } = await supabaseClient
      .from("promo_redemptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("promo_code_id", promoCode.id)
      .single();

    if (existingRedemption) {
      logStep("Code already redeemed");
      return new Response(
        JSON.stringify({ error: "You have already redeemed this code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check expiration
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      logStep("Code expired");
      return new Response(
        JSON.stringify({ error: "This promo code has expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check usage limit
    if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
      logStep("Code usage limit reached");
      return new Response(
        JSON.stringify({ error: "This promo code has reached its usage limit" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Redeem the code (create redemption record)
    const { error: redemptionError } = await supabaseClient
      .from("promo_redemptions")
      .insert({
        user_id: user.id,
        promo_code_id: promoCode.id,
      });

    if (redemptionError) {
      logStep("Failed to create redemption", { error: redemptionError.message });
      throw new Error("Failed to redeem promo code");
    }

    // Increment usage counter
    const { error: updateError } = await supabaseClient
      .from("promo_codes")
      .update({ current_uses: promoCode.current_uses + 1 })
      .eq("id", promoCode.id);

    if (updateError) {
      logStep("Failed to update usage count", { error: updateError.message });
    }

    // Update user role to match promo code plan type
    const { error: roleError } = await supabaseClient
      .from("user_roles")
      .upsert({
        user_id: user.id,
        role: promoCode.plan_type,
      }, {
        onConflict: "user_id,role",
      });

    if (roleError) {
      logStep("Failed to update user role", { error: roleError.message });
    }

    // Update subscription status
    const { error: subError } = await supabaseClient
      .from("subscription_status")
      .update({
        plan_type: promoCode.plan_type,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (subError) {
      logStep("Failed to update subscription", { error: subError.message });
    }

    logStep("Promo code redeemed successfully", { 
      userId: user.id, 
      code, 
      planType: promoCode.plan_type 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan: promoCode.plan_type,
        message: "Promo code redeemed successfully! You now have premium access." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

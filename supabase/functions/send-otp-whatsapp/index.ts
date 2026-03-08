import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit: max 3 OTPs in 15 minutes
    const { count: recentCount } = await supabaseAdmin
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());

    if ((recentCount ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ success: false, error: "تم تجاوز الحد المسموح. حاول بعد 15 دقيقة." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile with whatsapp_number and clinic_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("whatsapp_number, clinic_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError || !profile?.whatsapp_number) {
      return new Response(
        JSON.stringify({ success: false, error: "لا يوجد رقم واتساب مسجل في ملفك الشخصي." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get WhatsApp config for clinic
    const { data: waConfig } = await supabaseAdmin
      .from("whatsapp_config")
      .select("access_token, phone_number_id")
      .eq("clinic_id", profile.clinic_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!waConfig) {
      return new Response(
        JSON.stringify({ success: false, error: "لم يتم إعداد واتساب لهذه العيادة." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Delete previous codes for this user
    await supabaseAdmin
      .from("otp_codes")
      .delete()
      .eq("user_id", userId)
      .eq("verified", false);

    // Save code (expires in 5 minutes)
    await supabaseAdmin.from("otp_codes").insert({
      user_id: userId,
      code,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    // Send via WhatsApp
    let phone = profile.whatsapp_number.replace(/[\s\-\(\)\+]/g, "");
    if (phone.startsWith("07")) {
      phone = "964" + phone.substring(1);
    } else if (!phone.startsWith("964") && phone.length <= 10) {
      phone = "964" + phone;
    }

    const messageText = `🔐 رمز التحقق الخاص بك: ${code}\n\nهذا الرمز صالح لمدة 5 دقائق.\nلا تشارك هذا الرمز مع أي شخص.`;

    const response = await fetch(
      `${WHATSAPP_API_URL}/${waConfig.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${waConfig.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { preview_url: false, body: messageText },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("WhatsApp API error:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ success: false, error: "فشل إرسال رمز التحقق عبر واتساب." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mask phone number for display
    const maskedPhone = profile.whatsapp_number.replace(
      /(\d{3})\d+(\d{3})/,
      "$1****$2"
    );

    return new Response(
      JSON.stringify({ success: true, maskedPhone }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("OTP Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

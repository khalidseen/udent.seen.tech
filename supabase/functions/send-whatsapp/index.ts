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
    // Authenticate user
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

    const userId = claimsData.claims.sub;
    const { action, phone, message, patient_id, clinic_id, bulk_messages } = await req.json();

    if (!clinic_id) {
      return new Response(JSON.stringify({ error: "clinic_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read WhatsApp credentials from DB using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: waConfig, error: configError } = await supabaseAdmin
      .from("whatsapp_config")
      .select("access_token, phone_number_id, is_active")
      .eq("clinic_id", clinic_id)
      .eq("is_active", true)
      .maybeSingle();

    if (configError || !waConfig) {
      return new Response(
        JSON.stringify({ success: false, error: "لم يتم إعداد واتساب لهذه العيادة. اذهب إلى إعدادات واتساب لتفعيل الربط." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const WHATSAPP_ACCESS_TOKEN = waConfig.access_token;
    const WHATSAPP_PHONE_NUMBER_ID = waConfig.phone_number_id;

    // Single message
    if (action === "send" && phone && message) {
      const result = await sendWhatsAppMessage(WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, phone, message);

      await supabase.from("communication_logs").insert({
        clinic_id,
        patient_id: patient_id || null,
        message_type: "whatsapp",
        message_body: message,
        recipient_phone: phone,
        status: result.success ? "delivered" : "failed",
        channel: "whatsapp_api",
        sent_by: userId,
        sent_at: new Date().toISOString(),
        delivered_at: result.success ? new Date().toISOString() : null,
      });

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bulk messages
    if (action === "bulk" && bulk_messages?.length > 0) {
      const results = [];
      const logRecords = [];

      for (const msg of bulk_messages) {
        const result = await sendWhatsAppMessage(WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, msg.phone, msg.message);
        results.push({ phone: msg.phone, ...result });

        logRecords.push({
          clinic_id,
          patient_id: msg.patient_id || null,
          message_type: "whatsapp",
          message_body: msg.message,
          recipient_phone: msg.phone,
          status: result.success ? "delivered" : "failed",
          channel: "whatsapp_api",
          sent_by: userId,
          sent_at: new Date().toISOString(),
          delivered_at: result.success ? new Date().toISOString() : null,
          related_type: msg.related_type || null,
          related_id: msg.related_id || null,
        });

        await new Promise((r) => setTimeout(r, 100));
      }

      if (logRecords.length > 0) {
        await supabase.from("communication_logs").insert(logRecords);
      }

      const successCount = results.filter((r) => r.success).length;
      return new Response(
        JSON.stringify({
          success: true,
          total: results.length,
          sent: successCount,
          failed: results.length - successCount,
          details: results,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'send' or 'bulk'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("WhatsApp API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendWhatsAppMessage(
  accessToken: string,
  phoneNumberId: string,
  recipientPhone: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let phone = recipientPhone.replace(/[\s\-\(\)\+]/g, "");
  if (phone.startsWith("07")) {
    phone = "964" + phone.substring(1);
  } else if (!phone.startsWith("964") && phone.length <= 10) {
    phone = "964" + phone;
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "text",
        text: { preview_url: false, body: messageText },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("WhatsApp API error:", JSON.stringify(data));
      return { success: false, error: data.error?.message || `API error [${response.status}]` };
    }
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Network error";
    return { success: false, error: errMsg };
  }
}

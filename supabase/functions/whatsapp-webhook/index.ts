import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // GET = Meta webhook verification
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token) {
      // Find the config with this verify token
      const { data: config } = await supabaseAdmin
        .from("whatsapp_config")
        .select("id, webhook_verify_token")
        .eq("webhook_verify_token", token)
        .eq("is_active", true)
        .maybeSingle();

      if (config) {
        console.log("Webhook verified successfully for config:", config.id);
        return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
      }
    }

    return new Response("Forbidden", { status: 403 });
  }

  // POST = Incoming messages/status updates
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("Webhook received:", JSON.stringify(body).substring(0, 500));

      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const phoneNumberId = value.metadata?.phone_number_id;

      // Find clinic config by phone_number_id
      const { data: config } = await supabaseAdmin
        .from("whatsapp_config")
        .select("clinic_id")
        .eq("phone_number_id", phoneNumberId)
        .eq("is_active", true)
        .maybeSingle();

      const clinicId = config?.clinic_id;

      // Process message status updates
      if (value.statuses) {
        for (const status of value.statuses) {
          const waMessageId = status.id;
          const statusValue = status.status; // sent, delivered, read, failed

          if (clinicId) {
            // Update communication_logs with delivery status
            await supabaseAdmin
              .from("communication_logs")
              .update({
                status: statusValue === "read" ? "read" : statusValue === "delivered" ? "delivered" : statusValue,
                delivered_at: statusValue === "delivered" || statusValue === "read" ? new Date().toISOString() : undefined,
              })
              .eq("clinic_id", clinicId)
              .eq("channel", "whatsapp_api")
              .order("created_at", { ascending: false })
              .limit(1);
          }
        }
      }

      // Process incoming messages
      if (value.messages) {
        for (const msg of value.messages) {
          if (clinicId && msg.type === "text") {
            await supabaseAdmin.from("communication_logs").insert({
              clinic_id: clinicId,
              message_type: "whatsapp",
              message_body: msg.text?.body || "",
              recipient_phone: msg.from,
              status: "received",
              channel: "whatsapp_api",
              sent_at: new Date().toISOString(),
            });
          }
        }
      }

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});

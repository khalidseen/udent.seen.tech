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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find pending reminders that are due
    const now = new Date().toISOString();
    const { data: reminders, error: fetchError } = await supabaseAdmin
      .from("appointment_reminders")
      .select(`
        *,
        appointments!inner(appointment_date, treatment_type, status, doctor_id),
        patients!inner(full_name, phone)
      `)
      .eq("status", "pending")
      .eq("is_active", true)
      .lte("scheduled_at", now)
      .limit(50);

    if (fetchError) {
      console.error("Error fetching reminders:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No pending reminders" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const reminder of reminders) {
      // Skip if appointment was cancelled
      if (reminder.appointments?.status === "cancelled") {
        await supabaseAdmin
          .from("appointment_reminders")
          .update({ status: "cancelled", updated_at: now })
          .eq("id", reminder.id);
        continue;
      }

      const phone = reminder.patients?.phone;
      if (!phone) {
        await supabaseAdmin
          .from("appointment_reminders")
          .update({ status: "failed", error_message: "لا يوجد رقم هاتف", updated_at: now })
          .eq("id", reminder.id);
        failed++;
        continue;
      }

      // Get WhatsApp config for this clinic
      const { data: waConfig } = await supabaseAdmin
        .from("whatsapp_config")
        .select("access_token, phone_number_id")
        .eq("clinic_id", reminder.clinic_id)
        .eq("is_active", true)
        .maybeSingle();

      if (!waConfig) {
        await supabaseAdmin
          .from("appointment_reminders")
          .update({ status: "failed", error_message: "واتساب غير مُعد للعيادة", updated_at: now })
          .eq("id", reminder.id);
        failed++;
        continue;
      }

      // Format phone number
      let formattedPhone = phone.replace(/[\s\-\(\)\+]/g, "");
      if (formattedPhone.startsWith("07")) {
        formattedPhone = "964" + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("964") && formattedPhone.length <= 10) {
        formattedPhone = "964" + formattedPhone;
      }

      // Format appointment date
      const appointmentDate = new Date(reminder.appointments.appointment_date);
      const dateStr = appointmentDate.toLocaleDateString("ar-IQ", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timeStr = appointmentDate.toLocaleTimeString("ar-IQ", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Send template message via WhatsApp API
      const templateName = reminder.template_name || "appointment_reminder";
      const templateLang = reminder.template_language || "ar";

      const messageBody: Record<string, unknown> = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: reminder.patients.full_name },
                { type: "text", text: dateStr },
                { type: "text", text: timeStr },
              ],
            },
          ],
        },
      };

      try {
        const response = await fetch(
          `${WHATSAPP_API_URL}/${waConfig.phone_number_id}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${waConfig.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(messageBody),
          }
        );

        const data = await response.json();

        if (response.ok) {
          await supabaseAdmin
            .from("appointment_reminders")
            .update({ status: "sent", sent_at: now, updated_at: now })
            .eq("id", reminder.id);

          // Log in communication_logs
          await supabaseAdmin.from("communication_logs").insert({
            clinic_id: reminder.clinic_id,
            patient_id: reminder.patient_id,
            message_type: "whatsapp",
            message_body: `تذكير بموعد: ${dateStr} - ${timeStr}`,
            recipient_phone: phone,
            status: "delivered",
            channel: "whatsapp_api",
            sent_at: now,
            delivered_at: now,
            related_type: "appointment",
            related_id: reminder.appointment_id,
          });

          sent++;
        } else {
          const errorMsg = data.error?.message || `API error [${response.status}]`;
          await supabaseAdmin
            .from("appointment_reminders")
            .update({ status: "failed", error_message: errorMsg, updated_at: now })
            .eq("id", reminder.id);
          failed++;
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Network error";
        await supabaseAdmin
          .from("appointment_reminders")
          .update({ status: "failed", error_message: errMsg, updated_at: now })
          .eq("id", reminder.id);
        failed++;
      }

      // Rate limit: wait 100ms between messages
      await new Promise((r) => setTimeout(r, 100));
    }

    return new Response(
      JSON.stringify({ processed: reminders.length, sent, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Reminder processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

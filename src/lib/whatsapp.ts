import { supabase } from "@/integrations/supabase/client";

interface SendWhatsAppParams {
  phone: string;
  message: string;
  patient_id?: string;
  clinic_id: string;
}

interface BulkWhatsAppMessage {
  phone: string;
  message: string;
  patient_id?: string;
  related_type?: string;
  related_id?: string;
}

interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BulkWhatsAppResult {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  details: Array<{ phone: string; success: boolean; error?: string }>;
}

export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  const { data, error } = await supabase.functions.invoke('send-whatsapp', {
    body: {
      action: 'send',
      phone: params.phone,
      message: params.message,
      patient_id: params.patient_id,
      clinic_id: params.clinic_id,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as SendWhatsAppResult;
}

export async function sendBulkWhatsApp(
  clinic_id: string,
  messages: BulkWhatsAppMessage[]
): Promise<BulkWhatsAppResult> {
  const { data, error } = await supabase.functions.invoke('send-whatsapp', {
    body: {
      action: 'bulk',
      clinic_id,
      bulk_messages: messages,
    },
  });

  if (error) {
    return { success: false, total: messages.length, sent: 0, failed: messages.length, details: [] };
  }

  return data as BulkWhatsAppResult;
}

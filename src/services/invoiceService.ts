import { supabase } from '@/integrations/supabase/client';

export interface Invoice {
  id: string;
  clinic_id: string;
  patient_id: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  subtotal: number;
  discount_amount?: number | null;
  discount_percentage?: number | null;
  tax_amount?: number | null;
  tax_percentage?: number | null;
  status: string;
  issue_date: string;
  due_date: string;
  notes?: string | null;
  treatment_plan_id?: string | null;
  created_at: string;
  patient?: { full_name: string; phone: string };
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_name: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface InvoiceCreateInput {
  patient_id: string;
  items: { service_name: string; description?: string; quantity: number; unit_price: number }[];
  discount_amount?: number;
  tax_amount?: number;
  notes?: string;
  due_date?: string;
}

export interface PaymentInput {
  invoice_id: string;
  patient_id: string;
  amount: number;
  payment_method: string;
  notes?: string;
}

async function getClinicId(): Promise<string> {
  const { data } = await supabase.rpc('get_current_user_profile');
  if (!data?.id) throw new Error('لا يمكن تحديد العيادة الحالية');
  return data.id;
}

export const invoiceService = {
  async getAll(filters: { patientId?: string; status?: string; dateFrom?: string; dateTo?: string } = {}): Promise<Invoice[]> {
    const clinicId = await getClinicId();
    let query = supabase
      .from('invoices')
      .select('*, patient:patients(full_name, phone)')
      .eq('clinic_id', clinicId)
      .order('issue_date', { ascending: false });

    if (filters.patientId) query = query.eq('patient_id', filters.patientId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.dateFrom) query = query.gte('issue_date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('issue_date', filters.dateTo);

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Invoice[]) || [];
  },

  async getById(id: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, patient:patients(full_name, phone), items:invoice_items(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as Invoice;
  },

  async create(input: InvoiceCreateInput): Promise<Invoice> {
    const clinicId = await getClinicId();

    const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number', { clinic_id_param: clinicId });

    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const totalAmount = subtotal - (input.discount_amount || 0) + (input.tax_amount || 0);
    const dueDate = input.due_date || new Date(Date.now() + 30 * 86400000).toISOString();

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        clinic_id: clinicId,
        patient_id: input.patient_id,
        invoice_number: invoiceNumber || `INV-${Date.now()}`,
        subtotal,
        total_amount: totalAmount,
        paid_amount: 0,
        balance_due: totalAmount,
        discount_amount: input.discount_amount || 0,
        tax_amount: input.tax_amount || 0,
        status: 'pending',
        issue_date: new Date().toISOString(),
        due_date: dueDate,
        notes: input.notes,
      })
      .select()
      .single();
    if (error) throw error;

    const itemsToInsert = input.items.map(item => ({
      invoice_id: invoice.id,
      service_name: item.service_name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;

    return invoice as unknown as Invoice;
  },

  async recordPayment(input: PaymentInput): Promise<void> {
    const clinicId = await getClinicId();

    const { error: paymentError } = await supabase.from('payments').insert({
      clinic_id: clinicId,
      patient_id: input.patient_id,
      invoice_id: input.invoice_id,
      amount: input.amount,
      payment_method: input.payment_method,
      notes: input.notes,
      payment_date: new Date().toISOString(),
    });
    if (paymentError) throw paymentError;

    const { data: invoice } = await supabase
      .from('invoices')
      .select('paid_amount, total_amount')
      .eq('id', input.invoice_id)
      .single();

    if (invoice) {
      const newPaidAmount = (invoice.paid_amount || 0) + input.amount;
      const newBalance = invoice.total_amount - newPaidAmount;
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      await supabase
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          balance_due: Math.max(0, newBalance),
          status: newStatus,
        })
        .eq('id', input.invoice_id);
    }
  },

  async getFinancialSummary(dateFrom?: string, dateTo?: string): Promise<{
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    invoiceCount: number;
  }> {
    const clinicId = await getClinicId();
    let query = supabase
      .from('invoices')
      .select('total_amount, paid_amount, balance_due')
      .eq('clinic_id', clinicId);

    if (dateFrom) query = query.gte('issue_date', dateFrom);
    if (dateTo) query = query.lte('issue_date', dateTo);

    const { data, error } = await query;
    if (error) throw error;

    const invoices = data || [];
    return {
      totalRevenue: invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0),
      totalPaid: invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0),
      totalPending: invoices.reduce((s, i) => s + Number(i.balance_due || 0), 0),
      invoiceCount: invoices.length,
    };
  },
};

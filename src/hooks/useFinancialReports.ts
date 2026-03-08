import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportFilters {
  startDate: Date;
  endDate: Date;
  reportType: 'revenue' | 'payments' | 'outstanding' | 'cancelled';
}

export const useFinancialReports = (filters: ReportFilters) => {
  return useQuery({
    queryKey: ['financial-reports', filters],
    queryFn: async () => {
      const { data: profile } = await supabase.rpc('get_current_user_profile');
      if (!profile) throw new Error('Profile not found');

      // جلب الفواتير والمدفوعات بالتوازي
      const [invoicesRes, paymentsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select(`*, patients (full_name)`)
          .eq('clinic_id', profile.id)
          .gte('issue_date', filters.startDate.toISOString())
          .lte('issue_date', filters.endDate.toISOString()),
        supabase
          .from('payments')
          .select(`*, patients (full_name), invoices (invoice_number)`)
          .eq('clinic_id', profile.id)
          .gte('payment_date', filters.startDate.toISOString())
          .lte('payment_date', filters.endDate.toISOString()),
      ]);

      const invoices = invoicesRes.data || [];
      const payments = paymentsRes.data || [];

      let reportData: any = {};

      switch (filters.reportType) {
        case 'revenue':
          reportData = {
            totalRevenue: invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0),
            invoiceCount: invoices.length,
            averageInvoiceValue: invoices.length 
              ? (invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) / invoices.length) 
              : 0,
            byStatus: {
              paid: invoices.filter(i => i.status === 'paid').length,
              pending: invoices.filter(i => i.status === 'pending').length,
              overdue: invoices.filter(i => i.status === 'overdue').length,
            },
            invoices,
          };
          break;

        case 'payments':
          reportData = {
            totalPayments: payments.reduce((sum, pay) => sum + Number(pay.amount || 0), 0),
            paymentCount: payments.length,
            averagePaymentValue: payments.length
              ? (payments.reduce((sum, pay) => sum + Number(pay.amount || 0), 0) / payments.length)
              : 0,
            byMethod: {
              cash: payments.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + Number(p.amount || 0), 0),
              card: payments.filter(p => p.payment_method === 'card').reduce((sum, p) => sum + Number(p.amount || 0), 0),
              transfer: payments.filter(p => p.payment_method === 'transfer').reduce((sum, p) => sum + Number(p.amount || 0), 0),
            },
            payments,
          };
          break;

        case 'outstanding':
          const outstandingInvoices = invoices.filter(inv => Number(inv.balance_due) > 0);
          reportData = {
            totalOutstanding: outstandingInvoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0),
            invoiceCount: outstandingInvoices.length,
            averageOutstanding: outstandingInvoices.length
              ? (outstandingInvoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0) / outstandingInvoices.length)
              : 0,
            overdueInvoices: outstandingInvoices.filter(inv => new Date(inv.due_date) < new Date()).length,
            invoices: outstandingInvoices,
          };
          break;

        case 'cancelled':
          const cancelledInvoices = invoices.filter(inv => inv.status === 'cancelled');
          reportData = {
            totalCancelled: cancelledInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0),
            invoiceCount: cancelledInvoices.length,
            invoices: cancelledInvoices,
          };
          break;
      }

      return reportData;
    },
  });
};

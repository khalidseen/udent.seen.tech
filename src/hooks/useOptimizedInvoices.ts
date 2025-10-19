import { useOptimizedQuery } from "./useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
  patient_id: string;
  patients?: {
    full_name: string;
  };
}

export function useOptimizedPendingInvoices(clinicId: string | null, limit = 20) {
  return useOptimizedQuery<Invoice[]>(
    ['pending-invoices', clinicId, String(limit)],
    async () => {
      if (!clinicId) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          issue_date,
          total_amount,
          paid_amount,
          balance_due,
          status,
          patient_id
        `)
        .eq('clinic_id', clinicId)
        .gt('balance_due', 0)
        .neq('status', 'paid')
        .order('issue_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!clinicId,
      staleTime: 3 * 60 * 1000, // 3 minutes
      cacheTime: 10 * 60 * 1000,
      localCacheMinutes: 3
    }
  );
}

export function useOptimizedRecentInvoices(clinicId: string | null, limit = 10) {
  return useOptimizedQuery<Invoice[]>(
    ['recent-invoices', clinicId, String(limit)],
    async () => {
      if (!clinicId) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          issue_date,
          total_amount,
          paid_amount,
          balance_due,
          status,
          patient_id
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!clinicId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000,
      localCacheMinutes: 2
    }
  );
}

export function useOptimizedInvoiceStats(clinicId: string | null) {
  return useOptimizedQuery<{
    totalInvoices: number;
    pendingInvoices: number;
    paidInvoices: number;
    totalOutstanding: number;
    totalRevenue: number;
  }>(
    ['invoice-stats', clinicId],
    async () => {
      if (!clinicId) {
        return {
          totalInvoices: 0,
          pendingInvoices: 0,
          paidInvoices: 0,
          totalOutstanding: 0,
          totalRevenue: 0
        };
      }

      // جلب الإحصائيات بالتوازي
      const [allInvoices, pendingCount, paidCount] = await Promise.all([
        supabase
          .from('invoices')
          .select('total_amount, paid_amount, balance_due, status')
          .eq('clinic_id', clinicId),
        
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .gt('balance_due', 0)
          .neq('status', 'paid'),
        
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('status', 'paid')
      ]);

      const invoices = allInvoices.data || [];
      const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);

      return {
        totalInvoices: invoices.length,
        pendingInvoices: pendingCount.count || 0,
        paidInvoices: paidCount.count || 0,
        totalOutstanding,
        totalRevenue
      };
    },
    {
      enabled: !!clinicId,
      staleTime: 3 * 60 * 1000, // 3 minutes
      cacheTime: 10 * 60 * 1000,
      localCacheMinutes: 3
    }
  );
}

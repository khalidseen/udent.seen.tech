import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  patients: {
    total: number;
    new_this_month: number;
    active: number;
  };
  appointments: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
  };
  financials: {
    total_revenue: number;
    this_month_revenue: number;
    pending_invoices: number;
  };
  inventory: {
    total_supplies: number;
    low_stock_items: number;
  };
  treatments: {
    total_treatments: number;
    by_type: Record<string, number>;
  };
}

export const useClinicAnalytics = (clinicId: string | null) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!clinicId) return;

      try {
        setLoading(true);

        // Fetch patients data
        const { data: patients, count: totalPatients } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: false })
          .eq('clinic_id', clinicId);

        const now = new Date();
        const newThisMonth = patients?.filter(p => {
          const created = new Date(p.created_at);
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length || 0;

        // Fetch appointments data
        const { data: appointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('clinic_id', clinicId);

        // Fetch invoices data
        const { data: invoices } = await supabase
          .from('invoices')
          .select('total_amount, paid_amount, created_at')
          .eq('clinic_id', clinicId);

        const totalRevenue = invoices?.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0) || 0;
        const thisMonthRevenue = invoices?.filter(inv => {
          const created = new Date(inv.created_at);
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0) || 0;

        // Fetch supplies data
        const { data: supplies } = await supabase
          .from('medical_supplies')
          .select('current_stock, minimum_stock')
          .eq('clinic_id', clinicId)
          .eq('is_active', true);

        const lowStockItems = supplies?.filter(s => s.current_stock <= s.minimum_stock).length || 0;

        // Fetch treatments data
        const { data: treatments } = await supabase
          .from('dental_treatments')
          .select('diagnosis')
          .eq('clinic_id', clinicId);

        const treatmentsByType: Record<string, number> = {};
        treatments?.forEach(t => {
          const type = t.diagnosis || 'غير محدد';
          treatmentsByType[type] = (treatmentsByType[type] || 0) + 1;
        });

        setAnalytics({
          patients: {
            total: totalPatients || 0,
            new_this_month: newThisMonth,
            active: patients?.length || 0,
          },
          appointments: {
            total: appointments?.length || 0,
            scheduled: appointments?.filter(a => a.status === 'scheduled').length || 0,
            completed: appointments?.filter(a => a.status === 'completed').length || 0,
            cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
          },
          financials: {
            total_revenue: totalRevenue,
            this_month_revenue: thisMonthRevenue,
            pending_invoices: invoices?.filter(inv => inv.total_amount > inv.paid_amount).length || 0,
          },
          inventory: {
            total_supplies: supplies?.length || 0,
            low_stock_items: lowStockItems,
          },
          treatments: {
            total_treatments: treatments?.length || 0,
            by_type: treatmentsByType,
          },
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [clinicId]);

  return { analytics, loading };
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  is_valid: boolean;
  clinic_id: string | null;
  api_key_id: string | null;
  permissions: string[] | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let statusCode = 200;
  let errorMessage: string | null = null;

  try {
    const url = new URL(req.url);
    const clinicId = url.searchParams.get('clinic_id');
    const apiKey = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey || !clinicId) {
      return new Response(
        JSON.stringify({ error: 'Missing clinic_id or API key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate API key
    const { data: validation } = await supabase
      .rpc('validate_api_key', { key: apiKey })
      .single<ValidationResult>();

    if (!validation?.is_valid || validation.clinic_id !== clinicId) {
      statusCode = 401;
      errorMessage = 'Invalid API key';
      
      await supabase.from('api_logs').insert({
        clinic_id: clinicId,
        endpoint: '/clinic-analytics',
        method: 'GET',
        status_code: 401,
        response_time_ms: Date.now() - startTime,
        ip_address: req.headers.get('x-forwarded-for'),
        user_agent: req.headers.get('user-agent'),
        error_message: errorMessage,
      });

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get clinic info
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, name, subscription_plan, created_at')
      .eq('id', clinicId)
      .single();

    // Get patients analytics
    const { data: patients, count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: false })
      .eq('clinic_id', clinicId);

    const newThisMonth = patients?.filter(p => {
      const created = new Date(p.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length || 0;

    // Get appointments analytics
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId);

    const appointmentStats = {
      total: appointments?.length || 0,
      scheduled: appointments?.filter(a => a.status === 'scheduled').length || 0,
      completed: appointments?.filter(a => a.status === 'completed').length || 0,
      cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
    };

    // Get financial analytics
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, paid_amount, created_at')
      .eq('clinic_id', clinicId);

    const totalRevenue = invoices?.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0) || 0;
    const thisMonthRevenue = invoices?.filter(inv => {
      const created = new Date(inv.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0) || 0;

    // Get inventory analytics
    const { data: supplies } = await supabase
      .from('medical_supplies')
      .select('current_stock, minimum_stock')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    const lowStockItems = supplies?.filter(s => s.current_stock <= s.minimum_stock).length || 0;

    // Get treatments analytics
    const { data: treatments } = await supabase
      .from('dental_treatments')
      .select('treatment_type')
      .eq('clinic_id', clinicId);

    const treatmentsByType: Record<string, number> = {};
    treatments?.forEach(t => {
      treatmentsByType[t.treatment_type] = (treatmentsByType[t.treatment_type] || 0) + 1;
    });

    const responseData = {
      success: true,
      clinic: clinic || {},
      analytics: {
        patients: {
          total: totalPatients || 0,
          new_this_month: newThisMonth,
          active: patients?.filter(p => p.status === 'active').length || 0,
        },
        appointments: appointmentStats,
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
      },
      timestamp: new Date().toISOString(),
    };

    // Log successful request
    await supabase.from('api_logs').insert({
      clinic_id: clinicId,
      api_key_id: validation.api_key_id,
      endpoint: '/clinic-analytics',
      method: 'GET',
      status_code: 200,
      response_time_ms: Date.now() - startTime,
      ip_address: req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent'),
      request_params: { clinic_id: clinicId },
    });

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in clinic-analytics:', error);
    statusCode = 500;
    errorMessage = error.message;

    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

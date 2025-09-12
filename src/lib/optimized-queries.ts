// استعلامات محسنة لتحسين الأداء

import { supabase } from "@/integrations/supabase/client";

// استعلامات المرضى المحسنة
export const optimizedPatientQueries = {
  // جلب المرضى مع pagination وحقول محددة
  getPatients: async (clinicId: string, page = 1, limit = 20, search?: string) => {
    let query = supabase
      .from("patients")
      .select(`
        id,
        full_name,
        phone,
        email,
        patient_status,
        created_at,
        date_of_birth,
        gender,
        national_id,
        address,
        medical_history,
        financial_status,
        emergency_contact,
        emergency_phone,
        insurance_info,
        blood_type,
        occupation,
        marital_status,
        assigned_doctor_id,
        medical_condition
      `, { count: 'exact' })
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,national_id.ilike.%${search}%`);
    }

    return query;
  },

  // جلب بيانات مريض واحد
  getPatient: (id: string) => {
    return supabase
      .from("patients")
      .select(`
        *,
        appointments(id, appointment_date, status),
        medical_records(id, created_at, record_type),
        invoices(id, invoice_number, status, total_amount)
      `)
      .eq("id", id)
      .single();
  },

  // بحث سريع بالاسم أو الهاتف
  quickSearch: (clinicId: string, searchTerm: string) => {
    return supabase
      .from("patients")
      .select("id, full_name, phone")
      .eq("clinic_id", clinicId)
      .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .limit(10);
  }
};

// استعلامات المواعيد المحسنة
export const optimizedAppointmentQueries = {
  // المواعيد القادمة
  getUpcomingAppointments: (clinicId: string, limit = 10) => {
    return supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        patient_id,
        patients(id, full_name, phone)
      `)
      .eq("clinic_id", clinicId)
      .in("status", ["scheduled", "confirmed"])
      .gte("appointment_date", new Date().toISOString().split('T')[0])
      .order("appointment_date", { ascending: true })
      .limit(limit);
  },

  // مواعيد اليوم
  getTodayAppointments: (clinicId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return supabase
      .from("appointments")
      .select(`
        id,
        appointment_time,
        status,
        patient_id,
        patients(id, full_name, phone)
      `)
      .eq("clinic_id", clinicId)
      .eq("appointment_date", today)
      .order("appointment_time", { ascending: true });
  },

  // مواعيد الأسبوع
  getWeeklyAppointments: (clinicId: string) => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        patient_id,
        patients(id, full_name)
      `)
      .eq("clinic_id", clinicId)
      .gte("appointment_date", startOfWeek.toISOString().split('T')[0])
      .lte("appointment_date", endOfWeek.toISOString().split('T')[0])
      .order("appointment_date", { ascending: true });
  }
};

// استعلامات الفواتير المحسنة
export const optimizedInvoiceQueries = {
  // الفواتير المعلقة
  getPendingInvoices: (clinicId: string) => {
    return supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        issue_date,
        total_amount,
        balance_due,
        patient_id,
        patients(id, full_name)
      `)
      .eq("clinic_id", clinicId)
      .neq("status", "paid")
      .gt("balance_due", 0)
      .order("issue_date", { ascending: false })
      .limit(20);
  },

  // إجمالي الديون
  getTotalDebt: (clinicId: string) => {
    return supabase
      .from("invoices")
      .select("balance_due")
      .eq("clinic_id", clinicId)
      .gt("balance_due", 0);
  }
};

// استعلامات المخزون المحسنة
export const optimizedInventoryQueries = {
  // المواد منخفضة المخزون
  getLowStockItems: (clinicId: string) => {
    return supabase
      .from("medical_supplies")
      .select("id, name, current_stock, minimum_stock, category")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .filter("current_stock", "lte", "minimum_stock")
      .order("current_stock", { ascending: true });
  },

  // المواد منتهية الصلاحية قريباً
  getExpiringItems: (clinicId: string, daysAhead = 30) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return supabase
      .from("medical_supplies")
      .select("id, name, expiry_date, current_stock, category")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .not("expiry_date", "is", null)
      .lte("expiry_date", futureDate.toISOString())
      .order("expiry_date", { ascending: true });
  }
};

// استعلامات الإحصائيات السريعة
export const optimizedStatsQueries = {
  // إحصائيات سريعة للداشبورد
  getDashboardStats: async (clinicId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    const [
      totalPatientsResult,
      todayAppointmentsResult,
      pendingInvoicesResult,
      lowStockResult
    ] = await Promise.all([
      supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .eq("patient_status", "active"),
      
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .eq("appointment_date", today),
      
      supabase
        .from("invoices")
        .select("balance_due")
        .eq("clinic_id", clinicId)
        .gt("balance_due", 0),
      
      supabase
        .from("medical_supplies")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .filter("current_stock", "lte", "minimum_stock")
    ]);

    const totalDebt = pendingInvoicesResult.data?.reduce((sum, invoice) => 
      sum + (invoice.balance_due || 0), 0) || 0;

    return {
      totalPatients: totalPatientsResult.count || 0,
      todayAppointments: todayAppointmentsResult.count || 0,
      totalDebt,
      lowStockItems: lowStockResult.count || 0
    };
  }
};

// مساعدات التخزين المؤقت
export const cacheHelpers = {
  // إنشاء مفتاح تخزين مؤقت
  createCacheKey: (keyParts: string) => {
    return keyParts;
  },

  // تخزين مؤقت في localStorage
  setCache: (key: string, data: any, expirationMinutes = 5) => {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        expiration: expirationMinutes * 60 * 1000
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn("Cache storage failed:", error);
    }
  },

  // استرجاع من التخزين المؤقت
  getCache: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const now = Date.now();

      if (now - parsed.timestamp > parsed.expiration) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn("Cache retrieval failed:", error);
      return null;
    }
  },

  // مسح التخزين المؤقت
  clearCache: (prefix?: string) => {
    try {
      if (prefix) {
        Object.keys(localStorage)
          .filter(key => key.startsWith(prefix))
          .forEach(key => localStorage.removeItem(key));
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.warn("Cache clearing failed:", error);
    }
  }
};
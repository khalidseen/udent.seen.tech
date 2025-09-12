// Dashboard validation utilities
// هذا الملف يحتوي على أدوات للتحقق من صحة ربط مربعات لوحة التحكم

export interface RouteValidation {
  route: string;
  exists: boolean;
  description: string;
  component?: string;
}

// قائمة جميع المسارات المتاحة في التطبيق
export const availableRoutes: RouteValidation[] = [
  { route: "/", exists: true, description: "الصفحة الرئيسية", component: "Index" },
  { route: "/patients", exists: true, description: "قائمة المرضى", component: "Patients" },
  { route: "/appointments", exists: true, description: "المواعيد", component: "Appointments" },
  { route: "/appointments/new", exists: true, description: "حجز موعد جديد", component: "NewAppointment" },
  { route: "/book", exists: true, description: "الحجز العام", component: "PublicBooking" },
  { route: "/medical-records", exists: true, description: "السجلات الطبية", component: "MedicalRecords" },
  { route: "/dental-treatments", exists: true, description: "العلاجات السنية", component: "DentalTreatments" },
  { route: "/invoices", exists: true, description: "الفواتير", component: "Invoices" },
  { route: "/inventory", exists: true, description: "المخزون", component: "Inventory" },
  { route: "/doctors", exists: true, description: "إدارة الأطباء", component: "Doctors" },
  { route: "/ai-insights", exists: true, description: "التحليل الذكي", component: "AIInsights" },
  { route: "/medications", exists: true, description: "الأدوية", component: "Medications" },
  { route: "/prescriptions", exists: true, description: "الوصفات الطبية", component: "Prescriptions" },
  { route: "/reports", exists: true, description: "التقارير", component: "Reports" },
  { route: "/notifications", exists: true, description: "الإشعارات", component: "Notifications" },
  { route: "/users", exists: true, description: "إدارة المستخدمين", component: "Users" },
  { route: "/settings", exists: true, description: "الإعدادات", component: "Settings" },
  { route: "/auth", exists: true, description: "تسجيل الدخول", component: "Auth" },
];

// دالة للتحقق من صحة مسار معين
export function validateRoute(route: string): RouteValidation | null {
  return availableRoutes.find(r => r.route === route) || null;
}

// دالة للتحقق من صحة جميع مربعات لوحة التحكم
export function validateDashboardCards(cards: any[]): {
  valid: any[];
  invalid: any[];
  summary: string;
} {
  const valid: any[] = [];
  const invalid: any[] = [];

  cards.forEach(card => {
    const validation = validateRoute(card.route);
    if (validation && validation.exists) {
      valid.push({
        ...card,
        validation
      });
    } else {
      invalid.push({
        ...card,
        validation: null
      });
    }
  });

  const summary = `✅ صحيح: ${valid.length} | ❌ خاطئ: ${invalid.length} | المجموع: ${cards.length}`;

  return { valid, invalid, summary };
}

// دالة لطباعة تقرير شامل عن حالة الربط
export function printDashboardValidationReport(cards: any[]): void {
  const { valid, invalid, summary } = validateDashboardCards(cards);

  console.group("🔍 تقرير التحقق من مربعات لوحة التحكم");
  console.log(summary);
  
  if (valid.length > 0) {
    console.group("✅ المربعات المرتبطة بشكل صحيح:");
    valid.forEach(card => {
      console.log(`📋 ${card.title} → ${card.route} (${card.validation.component})`);
    });
    console.groupEnd();
  }

  if (invalid.length > 0) {
    console.group("❌ المربعات غير المرتبطة:");
    invalid.forEach(card => {
      console.error(`📋 ${card.title} → ${card.route} (غير موجود)`);
    });
    console.groupEnd();
  }

  console.groupEnd();
}

// دالة للحصول على المسارات المتاحة التي لم يتم إضافتها كمربعات
export function getUnusedRoutes(cards: any[]): RouteValidation[] {
  const usedRoutes = cards.map(card => card.route);
  return availableRoutes.filter(route => 
    !usedRoutes.includes(route.route) && 
    route.route !== "/" && 
    route.route !== "/auth"
  );
}

// دالة لاقتراح مربعات جديدة للمسارات غير المستخدمة
export function suggestNewCards(cards: any[]): any[] {
  const unusedRoutes = getUnusedRoutes(cards);
  
  return unusedRoutes.map((route, index) => ({
    id: `suggested-${index + 1}`,
    title: route.description,
    description: `الانتقال إلى ${route.description}`,
    route: route.route,
    color: "bg-gray-500",
    order_index: cards.length + index + 1,
    suggested: true
  }));
}

// دالة مساعدة لتصحيح المسارات الخاطئة تلقائياً
export function autoFixInvalidRoutes(cards: any[]): any[] {
  return cards.map(card => {
    const validation = validateRoute(card.route);
    if (!validation) {
      // محاولة إيجاد مسار مشابه
      const similarRoute = availableRoutes.find(route => 
        route.description.includes(card.title) || 
        card.title.includes(route.description)
      );
      
      if (similarRoute) {
        console.warn(`🔧 تصحيح تلقائي: ${card.title} من ${card.route} إلى ${similarRoute.route}`);
        return {
          ...card,
          route: similarRoute.route
        };
      }
    }
    return card;
  });
}

// Dashboard validation utilities

export interface RouteValidation {
  route: string;
  exists: boolean;
  description: string;
  component?: string;
}

// قائمة جميع المسارات المتاحة في التطبيق (محدثة 2026-03-08)
export const availableRoutes: RouteValidation[] = [
  { route: "/", exists: true, description: "الصفحة الرئيسية", component: "Index" },
  { route: "/patients", exists: true, description: "قائمة المرضى", component: "Patients" },
  { route: "/appointments", exists: true, description: "المواعيد", component: "Appointments" },
  { route: "/appointments/new", exists: true, description: "حجز موعد جديد", component: "NewAppointment" },
  { route: "/book", exists: true, description: "الحجز العام", component: "PublicBooking" },
  { route: "/advanced-medical-records", exists: true, description: "السجلات الطبية", component: "AdvancedMedicalRecords" },
  { route: "/dental-treatments-management", exists: true, description: "العلاجات السنية", component: "DentalTreatmentsManagement" },
  { route: "/invoice-management", exists: true, description: "الفواتير", component: "InvoiceManagement" },
  { route: "/inventory", exists: true, description: "المخزون", component: "Inventory" },
  { route: "/doctors", exists: true, description: "إدارة الأطباء", component: "Doctors" },
  { route: "/ai-insights-page", exists: true, description: "التحليل الذكي", component: "AIInsights" },
  { route: "/medications", exists: true, description: "الأدوية", component: "Medications" },
  { route: "/prescriptions", exists: true, description: "الوصفات الطبية", component: "Prescriptions" },
  { route: "/detailed-reports", exists: true, description: "التقارير", component: "DetailedReports" },
  { route: "/advanced-notification-management", exists: true, description: "الإشعارات", component: "AdvancedNotificationManagement" },
  { route: "/advanced-user-management", exists: true, description: "إدارة المستخدمين", component: "AdvancedUserManagement" },
  { route: "/settings", exists: true, description: "الإعدادات", component: "Settings" },
  { route: "/auth", exists: true, description: "تسجيل الدخول", component: "Auth" },
  { route: "/financial-overview", exists: true, description: "ملخص مالي", component: "FinancialOverview" },
  { route: "/payment-management", exists: true, description: "المدفوعات", component: "PaymentManagement" },
  { route: "/treatment-plans", exists: true, description: "خطط العلاج", component: "TreatmentPlans" },
  { route: "/financial-reports", exists: true, description: "التقارير المالية", component: "FinancialReports" },
  { route: "/financial-transactions", exists: true, description: "المعاملات المالية", component: "PatientFinancialTransactions" },
  { route: "/purchase-orders", exists: true, description: "أوامر الشراء", component: "PurchaseOrders" },
  { route: "/stock-movements", exists: true, description: "حركة المخزون", component: "StockMovements" },
  { route: "/doctor-assistants", exists: true, description: "المساعدون", component: "DoctorAssistants" },
  { route: "/secretaries", exists: true, description: "السكرتارية", component: "Secretaries" },
  { route: "/appointment-requests", exists: true, description: "طلبات المواعيد", component: "AppointmentRequests" },
  { route: "/smart-diagnosis-system", exists: true, description: "التشخيص الذكي", component: "SmartDiagnosis" },
  { route: "/ai-management-dashboard", exists: true, description: "إدارة الذكاء الاصطناعي", component: "AIManagementDashboard" },
  { route: "/advanced-permissions-management", exists: true, description: "الصلاحيات", component: "AdvancedPermissionsManagement" },
  { route: "/comprehensive-security-audit", exists: true, description: "الأمان", component: "ComprehensiveSecurityAudit" },
  { route: "/integrations", exists: true, description: "الدمج", component: "Integrations" },
  { route: "/dental-3d-models-management", exists: true, description: "النماذج ثلاثية الأبعاد", component: "Dental3DModelsManagement" },
  { route: "/custom-notification-templates", exists: true, description: "قوالب الإشعارات", component: "CustomNotificationTemplates" },
  { route: "/profile", exists: true, description: "الملف الشخصي", component: "Profile" },
  { route: "/super-admin", exists: true, description: "مدير النظام", component: "SuperAdmin" },
  { route: "/subscription-plans", exists: true, description: "خطط الاشتراك", component: "SubscriptionPlans" },
  { route: "/subscription", exists: true, description: "الاشتراك", component: "SubscriptionManagement" },
  { route: "/doctor-applications", exists: true, description: "طلبات الأطباء", component: "DoctorApplications" },
  { route: "/service-prices", exists: true, description: "أسعار الخدمات", component: "ServicePrices" },
  { route: "/dental-lab", exists: true, description: "مختبر الأسنان", component: "DentalLabManagement" },
  { route: "/smart-scheduling", exists: true, description: "الجدولة الذكية", component: "SmartScheduling" },
  { route: "/communication-center", exists: true, description: "مركز الاتصالات", component: "CommunicationCenter" },
  { route: "/insurance-management", exists: true, description: "إدارة التأمين", component: "InsuranceManagement" },
];

export function validateRoute(route: string): RouteValidation | null {
  return availableRoutes.find(r => r.route === route) || null;
}

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
      valid.push({ ...card, validation });
    } else {
      invalid.push({ ...card, validation: null });
    }
  });

  const summary = `✅ صحيح: ${valid.length} | ❌ خاطئ: ${invalid.length} | المجموع: ${cards.length}`;
  return { valid, invalid, summary };
}

export function getUnusedRoutes(cards: any[]): RouteValidation[] {
  const usedRoutes = cards.map(card => card.route);
  return availableRoutes.filter(route => 
    !usedRoutes.includes(route.route) && 
    route.route !== "/" && 
    route.route !== "/auth"
  );
}

// Dashboard validation utilities
import { ROUTES } from "@/constants/routes";

export interface RouteValidation {
  route: string;
  exists: boolean;
  description: string;
  component?: string;
}

// قائمة جميع المسارات المتاحة في التطبيق (محدثة 2026-03-08)
export const availableRoutes: RouteValidation[] = [
  { route: ROUTES.home, exists: true, description: "الصفحة الرئيسية", component: "Index" },
  { route: ROUTES.patients, exists: true, description: "قائمة المرضى", component: "Patients" },
  { route: ROUTES.appointments, exists: true, description: "المواعيد", component: "Appointments" },
  { route: ROUTES.newAppointment, exists: true, description: "حجز موعد جديد", component: "NewAppointment" },
  { route: ROUTES.publicBooking, exists: true, description: "الحجز العام", component: "PublicBooking" },

  { route: ROUTES.dentalTreatmentsManagement, exists: true, description: "العلاجات السنية", component: "DentalTreatmentsManagement" },
  { route: ROUTES.invoiceManagement, exists: true, description: "الفواتير", component: "InvoiceManagement" },
  { route: ROUTES.inventory, exists: true, description: "المخزون", component: "Inventory" },
  { route: ROUTES.doctors, exists: true, description: "إدارة الأطباء", component: "Doctors" },

  { route: ROUTES.medications, exists: true, description: "الأدوية", component: "Medications" },
  { route: ROUTES.prescriptions, exists: true, description: "الوصفات الطبية", component: "Prescriptions" },
  { route: ROUTES.detailedReports, exists: true, description: "التقارير", component: "DetailedReports" },
  { route: ROUTES.advancedNotificationManagement, exists: true, description: "الإشعارات", component: "AdvancedNotificationManagement" },
  { route: ROUTES.advancedUserManagement, exists: true, description: "إدارة المستخدمين", component: "AdvancedUserManagement" },
  { route: ROUTES.settings, exists: true, description: "الإعدادات", component: "Settings" },
  { route: ROUTES.auth, exists: true, description: "تسجيل الدخول", component: "Auth" },
  { route: ROUTES.financialOverview, exists: true, description: "ملخص مالي", component: "FinancialOverview" },
  { route: ROUTES.paymentManagement, exists: true, description: "المدفوعات", component: "PaymentManagement" },


  { route: "/purchase-orders", exists: true, description: "أوامر الشراء", component: "PurchaseOrders" },
  { route: "/stock-movements", exists: true, description: "حركة المخزون", component: "StockMovements" },
  { route: "/doctor-assistants", exists: true, description: "المساعدون", component: "DoctorAssistants" },
  { route: "/secretaries", exists: true, description: "السكرتارية", component: "Secretaries" },
  { route: "/appointment-requests", exists: true, description: "طلبات المواعيد", component: "AppointmentRequests" },

  { route: "/advanced-permissions-management", exists: true, description: "الصلاحيات", component: "AdvancedPermissionsManagement" },
  { route: "/comprehensive-security-audit", exists: true, description: "الأمان", component: "ComprehensiveSecurityAudit" },
  { route: "/integrations", exists: true, description: "الدمج", component: "Integrations" },

  { route: "/custom-notification-templates", exists: true, description: "قوالب الإشعارات", component: "CustomNotificationTemplates" },
  { route: "/profile", exists: true, description: "الملف الشخصي", component: "Profile" },
  { route: "/super-admin", exists: true, description: "مدير النظام", component: "SuperAdmin" },
  { route: "/subscription-plans", exists: true, description: "خطط الاشتراك", component: "SubscriptionPlans" },
  { route: "/subscription", exists: true, description: "الاشتراك", component: "SubscriptionManagement" },
  { route: "/doctor-applications", exists: true, description: "طلبات الأطباء", component: "DoctorApplications" },
  { route: "/service-prices", exists: true, description: "أسعار الخدمات", component: "ServicePrices" },
  { route: "/dental-lab", exists: true, description: "مختبر الأسنان", component: "DentalLabManagement" },
  { route: "/smart-scheduling", exists: true, description: "الجدولة الذكية", component: "SmartScheduling" },

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

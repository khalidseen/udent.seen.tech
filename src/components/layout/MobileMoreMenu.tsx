import { memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet";
import {
  BarChart3, ClipboardList, CalendarPlus, FolderOpen, Stethoscope, FileText,
  Receipt, DollarSign, Calculator, FileSpreadsheet, CreditCard, Shield,
  Package, Pill, PackageCheck, Truck, FlaskConical, CalendarDays, MessageSquare,
  UserCog, User, Brain, Settings, Bell, Mail, Plug, Box, LogOut, Crown, Briefcase, Building
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MobileMoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuSections = [
  {
    title: "إدارة المرضى",
    items: [
      { title: "حجز جديد", url: "/appointments/new", icon: CalendarPlus },
      { title: "طلبات الحجز", url: "/appointment-requests", icon: ClipboardList },
      { title: "السجلات الطبية", url: "/medical-records", icon: FolderOpen },
      { title: "العلاجات", url: "/dental-treatments-management", icon: Stethoscope },
      { title: "الوصفات الطبية", url: "/prescriptions", icon: FileText },
    ],
  },
  {
    title: "المالية",
    items: [
      { title: "الفواتير", url: "/invoice-management", icon: Receipt },
      { title: "المدفوعات", url: "/payment-management", icon: DollarSign },
      { title: "خطط العلاج المالية", url: "/treatment-plans", icon: Calculator },
      { title: "التقارير المالية", url: "/financial-reports", icon: FileSpreadsheet },
      { title: "أسعار الخدمات", url: "/service-prices", icon: CreditCard },
      { title: "التأمينات", url: "/insurance-management", icon: Shield },
    ],
  },
  {
    title: "المخزون والأدوية",
    items: [
      { title: "المخزون الطبي", url: "/inventory", icon: Package },
      { title: "الأدوية", url: "/medications", icon: Pill },
      { title: "أوامر الشراء", url: "/purchase-orders", icon: PackageCheck },
      { title: "حركة المخزون", url: "/stock-movements", icon: Truck },
    ],
  },
  {
    title: "المختبر والجدولة",
    items: [
      { title: "المختبر السني", url: "/dental-lab", icon: FlaskConical },
      { title: "الجدولة الذكية", url: "/smart-scheduling", icon: CalendarDays },
      { title: "مركز التواصل", url: "/communication-center", icon: MessageSquare },
    ],
  },
  {
    title: "الكادر الطبي",
    items: [
      { title: "الأطباء", url: "/doctors", icon: Stethoscope },
      { title: "المساعدون", url: "/doctor-assistants", icon: UserCog },
      { title: "السكرتارية", url: "/secretaries", icon: User },
    ],
  },
  {
    title: "التقارير",
    items: [
      { title: "التقارير التفصيلية", url: "/detailed-reports", icon: FileSpreadsheet },
      { title: "الذكاء الاصطناعي", url: "/ai-management-dashboard", icon: Brain },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      { title: "الإعدادات العامة", url: "/settings", icon: Settings },
      { title: "الأدوار والصلاحيات", url: "/advanced-permissions-management", icon: Shield },
      { title: "الإشعارات", url: "/advanced-notification-management", icon: Bell },
      { title: "الدمج", url: "/integrations", icon: Plug },
    ],
  },
];

export const MobileMoreMenu = memo<MobileMoreMenuProps>(({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleNav = (url: string) => {
    navigate(url);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-0 overflow-y-auto">
        <SheetHeader className="px-4 pb-2">
          <SheetTitle className="text-right">القائمة</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-8">
          {menuSections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold text-muted-foreground px-4 mb-1">{section.title}</p>
              <div className="grid grid-cols-4 gap-1 px-2">
                {section.items.map((item) => (
                  <button
                    key={item.url}
                    onClick={() => handleNav(item.url)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <span className="text-[10px] text-center text-foreground leading-tight line-clamp-2">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* تسجيل الخروج */}
          <div className="px-4 pt-2 border-t border-border">
            <button
              onClick={() => { signOut(); onOpenChange(false); }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

MobileMoreMenu.displayName = "MobileMoreMenu";

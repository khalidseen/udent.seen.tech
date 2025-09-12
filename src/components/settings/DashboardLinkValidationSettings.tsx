import React from 'react';
import { DashboardLinkValidation } from './DashboardLinkValidation';
import { 
  Users, 
  Calendar, 
  FileText, 
  Receipt, 
  Box, 
  UserCheck, 
  Brain, 
  Pill, 
  ClipboardList, 
  BarChart3, 
  Bell, 
  Settings,
  Stethoscope,
  Globe,
  Calendar as CalendarIcon
} from "lucide-react";

// نفس البيانات المستخدمة في Index.tsx
const defaultCards = [
  {
    id: "patients-list",
    title: "قائمة المرضى",
    description: "عرض وإدارة جميع المرضى المسجلين في النظام",
    icon: Users,
    color: "bg-emerald-500",
    route: "/patients",
    order_index: 1
  },
  {
    id: "appointments",
    title: "المواعيد",
    description: "عرض وإدارة مواعيد المرضى",
    icon: Calendar,
    color: "bg-blue-500",
    route: "/appointments",
    order_index: 2
  },
  {
    id: "new-appointment",
    title: "حجز موعد جديد",
    description: "حجز موعد جديد للمريض",
    icon: CalendarIcon,
    color: "bg-green-500",
    route: "/appointments/new",
    order_index: 3
  },
  {
    id: "public-booking",
    title: "رابط الحجز العام",
    description: "رابط مباشر للحجز عبر الإنترنت للمرضى",
    icon: Globe,
    color: "bg-lime-600",
    route: "/book",
    order_index: 4
  },
  {
    id: "medical-records",
    title: "السجلات الطبية",
    description: "إدارة السجلات الطبية للمرضى",
    icon: FileText,
    color: "bg-purple-500",
    route: "/medical-records",
    order_index: 5
  },
  {
    id: "dental-treatments",
    title: "العلاجات السنية",
    description: "إدارة العلاجات والإجراءات السنية",
    icon: Stethoscope,
    color: "bg-red-500",
    route: "/dental-treatments",
    order_index: 6
  },
  {
    id: "invoices",
    title: "الفواتير",
    description: "إدارة الفواتير والمدفوعات",
    icon: Receipt,
    color: "bg-yellow-500",
    route: "/invoices",
    order_index: 7
  },
  {
    id: "inventory",
    title: "المخزون",
    description: "إدارة المخزون والإمدادات الطبية",
    icon: Box,
    color: "bg-orange-500",
    route: "/inventory",
    order_index: 8
  },
  {
    id: "doctors",
    title: "إدارة الأطباء",
    description: "إدارة بيانات الأطباء والاختصاصات",
    icon: UserCheck,
    color: "bg-blue-600",
    route: "/doctors",
    order_index: 9
  },
  {
    id: "ai-insights",
    title: "التحليل الذكي",
    description: "تحليل ذكي وتشخيص متقدم بالذكاء الاصطناعي",
    icon: Brain,
    color: "bg-indigo-500",
    route: "/ai-insights",
    order_index: 10
  },
  {
    id: "medications",
    title: "الأدوية",
    description: "إدارة قاعدة بيانات الأدوية",
    icon: Pill,
    color: "bg-rose-500",
    route: "/medications",
    order_index: 11
  },
  {
    id: "prescriptions",
    title: "الوصفات الطبية",
    description: "إنشاء وإدارة الوصفات الطبية",
    icon: ClipboardList,
    color: "bg-emerald-600",
    route: "/prescriptions",
    order_index: 12
  },
  {
    id: "reports",
    title: "التقارير",
    description: "تقارير شاملة وإحصائيات مفصلة",
    icon: BarChart3,
    color: "bg-teal-500",
    route: "/reports",
    order_index: 13
  },
  {
    id: "notifications",
    title: "الإشعارات",
    description: "إدارة الإشعارات والتنبيهات",
    icon: Bell,
    color: "bg-lime-500",
    route: "/notifications",
    order_index: 14
  },
  {
    id: "users",
    title: "إدارة المستخدمين",
    description: "إدارة المستخدمين والصلاحيات",
    icon: Users,
    color: "bg-slate-500",
    route: "/users",
    order_index: 15
  },
  {
    id: "settings",
    title: "الإعدادات",
    description: "إعدادات النظام والتكوين العام",
    icon: Settings,
    color: "bg-gray-500",
    route: "/settings",
    order_index: 16
  }
];

export const DashboardLinkValidationSettings: React.FC = () => {
  return <DashboardLinkValidation cards={defaultCards} />;
};

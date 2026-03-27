import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Building, Shield, Bell, Monitor, LayoutDashboard, Link, Coins, Activity, Users, Eye, Pencil } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ADMIN_ROLES } from "@/constants/roles";

import { InterfaceSettings } from "@/components/settings/InterfaceSettings";
import { ClinicSettings } from "@/components/settings/ClinicSettings";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { DashboardCardsSettings } from "@/components/settings/DashboardCardsSettings";
import { DashboardLinkValidationSettings } from "@/components/settings/DashboardLinkValidationSettings";
import CurrencySettings from "@/components/settings/CurrencySettings";
import { PerformanceSettings } from "@/components/settings/PerformanceSettings";
import { DevInspectorSettingsManager } from "@/components/settings/DevInspectorSettingsManager";
import { VisualEditorSettingsManager } from "@/components/settings/VisualEditorSettingsManager";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("interface");
  const { language } = useLanguage();
  const { user } = useCurrentUser();
  const isAr = language === 'ar';
  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  const settingsTabs = [
    {
      value: "interface",
      label: isAr ? "الواجهة" : "Interface",
      icon: Monitor,
      description: isAr ? "تخصيص مظهر وسلوك واجهة النظام" : "Customize system interface appearance",
      component: InterfaceSettings,
      adminOnly: false,
    },
    {
      value: "currency",
      label: isAr ? "العملة" : "Currency",
      icon: Coins,
      description: isAr ? "إعدادات العملة والتحويل" : "Currency and conversion settings",
      component: CurrencySettings,
      adminOnly: false,
    },
    {
      value: "dashboard",
      label: isAr ? "لوحة القيادة" : "Dashboard",
      icon: LayoutDashboard,
      description: isAr ? "إدارة وتخصيص صناديق لوحة القيادة" : "Manage and customize dashboard boxes",
      component: DashboardCardsSettings,
      adminOnly: false,
    },
    {
      value: "link-validation",
      label: isAr ? "فحص الروابط" : "Link Check",
      icon: Link,
      description: isAr ? "فحص صحة روابط لوحة التحكم" : "Check and validate dashboard links",
      component: DashboardLinkValidationSettings,
      adminOnly: true,
    },
    ...(import.meta.env.DEV ? [{
      value: "performance",
      label: isAr ? "الأداء" : "Performance",
      icon: Activity,
      description: isAr ? "مراقبة أداء التطبيق" : "Monitor app performance",
      component: PerformanceSettings,
      adminOnly: true,
    }] : []),
    {
      value: "clinic",
      label: isAr ? "العيادة" : "Clinic",
      icon: Building,
      description: isAr ? "معلومات العيادة وأوقات العمل" : "Clinic info and working hours",
      component: ClinicSettings,
      adminOnly: true,
    },
    {
      value: "notifications",
      label: isAr ? "الإشعارات" : "Notifications",
      icon: Bell,
      description: isAr ? "إعدادات التنبيهات والإشعارات" : "Alert and notification settings",
      component: NotificationSettings,
      adminOnly: false,
    },
    {
      value: "system",
      label: isAr ? "النظام" : "System",
      icon: Shield,
      description: isAr ? "الأمان والنسخ الاحتياطي" : "Security and backups",
      component: SystemSettings,
      adminOnly: true,
    },
    {
      value: "dev-inspector",
      label: isAr ? "المفتش" : "Inspector",
      icon: Eye,
      description: isAr ? "خريطة المكونات المرئية للتطبيق" : "Visual component inspector",
      component: DevInspectorSettingsManager,
      adminOnly: true,
    },
    {
      value: "visual-editor",
      label: isAr ? "المحرر" : "Editor",
      icon: Pencil,
      description: isAr ? "المحرر المرئي لتعديل المحتوى" : "Visual content editor",
      component: VisualEditorSettingsManager,
      adminOnly: true,
    },
  ];

  const visibleTabs = settingsTabs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{isAr ? 'الإعدادات' : 'Settings'}</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">{isAr ? 'أقسام الإعدادات' : 'Settings Sections'}</CardTitle>
            <CardDescription>{isAr ? 'اختر القسم الذي تريد تعديل إعداداته' : 'Choose the section to configure'}</CardDescription>
          </CardHeader>
          <CardContent>
            <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 h-auto p-1">
              {visibleTabs.map(tab => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex flex-col gap-2 h-16 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardContent>
        </Card>

        <div className="min-h-[600px]">
          {visibleTabs.map(tab => {
            const ComponentToRender = tab.component;
            return (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <tab.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{isAr ? `إعدادات ${tab.label}` : `${tab.label} Settings`}</CardTitle>
                        <CardDescription>{tab.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ComponentToRender />
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </div>
      </Tabs>
    </div>
  );
}

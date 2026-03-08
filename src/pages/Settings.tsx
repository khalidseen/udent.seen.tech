import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Building, Shield, Bell, Monitor, Database, LayoutDashboard, Link, Coins, Activity } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Import settings components
import { InterfaceSettings } from "@/components/settings/InterfaceSettings";
import { ClinicSettings } from "@/components/settings/ClinicSettings";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { DashboardCardsSettings } from "@/components/settings/DashboardCardsSettings";
import { DashboardLinkValidationSettings } from "@/components/settings/DashboardLinkValidationSettings";
import CurrencySettings from "@/components/settings/CurrencySettings";
import { PerformanceSettings } from "@/components/settings/PerformanceSettings";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("interface");
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const settingsTabs = [{
    value: "interface",
    label: isAr ? "الواجهة" : "Interface",
    icon: Monitor,
    description: isAr ? "تخصيص مظهر وسلوك واجهة النظام" : "Customize system interface appearance",
    component: InterfaceSettings
  }, {
    value: "currency",
    label: isAr ? "العملة" : "Currency",
    icon: Coins,
    description: isAr ? "إعدادات العملة والتحويل" : "Currency and conversion settings",
    component: CurrencySettings
  }, {
    value: "dashboard",
    label: isAr ? "لوحة القيادة" : "Dashboard",
    icon: LayoutDashboard,
    description: isAr ? "إدارة وتخصيص صناديق لوحة القيادة" : "Manage and customize dashboard boxes",
    component: DashboardCardsSettings
  }, {
    value: "link-validation",
    label: isAr ? "فحص الروابط" : "Link Check",
    icon: Link,
    description: isAr ? "فحص صحة روابط لوحة التحكم والتحقق من صحتها" : "Check and validate dashboard links",
    component: DashboardLinkValidationSettings
  }, {
    value: "performance",
    label: isAr ? "الأداء" : "Performance",
    icon: Activity,
    description: isAr ? "مراقبة أداء التطبيق واستهلاك الموارد" : "Monitor app performance and resource usage",
    component: PerformanceSettings
  }, {
    value: "clinic",
    label: isAr ? "العيادة" : "Clinic",
    icon: Building,
    description: isAr ? "معلومات العيادة وأوقات العمل" : "Clinic info and working hours",
    component: ClinicSettings
  }, {
    value: "notifications",
    label: isAr ? "الإشعارات" : "Notifications",
    icon: Bell,
    description: isAr ? "إعدادات التنبيهات والإشعارات" : "Alert and notification settings",
    component: NotificationSettings
  }, {
    value: "system",
    label: isAr ? "النظام" : "System",
    icon: Shield,
    description: isAr ? "الأمان والنسخ الاحتياطي" : "Security and backups",
    component: SystemSettings
  }];

  return <div className="container mx-auto p-6 space-y-6">
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
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto p-1">
              {settingsTabs.map(tab => {
              const IconComponent = tab.icon;
              return <TabsTrigger key={tab.value} value={tab.value} className="flex flex-col gap-2 h-16 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </TabsTrigger>;
            })}
            </TabsList>
          </CardContent>
        </Card>

        <div className="min-h-[600px]">
          {settingsTabs.map(tab => {
          const ComponentToRender = tab.component;
          return <TabsContent key={tab.value} value={tab.value} className="mt-6">
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
              </TabsContent>;
        })}
        </div>
      </Tabs>
    </div>;
}

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
<<<<<<< HEAD
import { Settings as SettingsIcon, Building, Shield, Bell, Monitor, Database, LayoutDashboard, Link, Coins } from "lucide-react";
=======
import { Settings as SettingsIcon, Building, Shield, Bell, Monitor, Database, LayoutDashboard } from "lucide-react";
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a

// Import settings components
import { InterfaceSettings } from "@/components/settings/InterfaceSettings";
import { ClinicSettings } from "@/components/settings/ClinicSettings";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { DashboardCardsSettings } from "@/components/settings/DashboardCardsSettings";
<<<<<<< HEAD
import { DashboardLinkValidationSettings } from "@/components/settings/DashboardLinkValidationSettings";
import CurrencySettings from "@/components/settings/CurrencySettings";

=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
export default function Settings() {
  const [activeTab, setActiveTab] = useState("interface");
  const settingsTabs = [{
    value: "interface",
    label: "الواجهة",
    icon: Monitor,
    description: "تخصيص مظهر وسلوك واجهة النظام",
    component: InterfaceSettings
  }, {
<<<<<<< HEAD
    value: "currency",
    label: "العملة",
    icon: Coins,
    description: "إعدادات العملة والتحويل",
    component: CurrencySettings
  }, {
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
    value: "dashboard",
    label: "لوحة القيادة",
    icon: LayoutDashboard,
    description: "إدارة وتخصيص صناديق لوحة القيادة",
    component: DashboardCardsSettings
  }, {
<<<<<<< HEAD
    value: "link-validation",
    label: "فحص الروابط",
    icon: Link,
    description: "فحص صحة روابط لوحة التحكم والتحقق من صحتها",
    component: DashboardLinkValidationSettings
  }, {
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
    value: "clinic",
    label: "العيادة",
    icon: Building,
    description: "معلومات العيادة وأوقات العمل",
    component: ClinicSettings
  }, {
    value: "notifications",
    label: "الإشعارات",
    icon: Bell,
    description: "إعدادات التنبيهات والإشعارات",
    component: NotificationSettings
  }, {
    value: "system",
    label: "النظام",
    icon: Shield,
    description: "الأمان والنسخ الاحتياطي",
    component: SystemSettings
  }];
  return <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">الإعدادات</h1>
          
        </div>
      </div>

      {/* Settings Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tabs Navigation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">أقسام الإعدادات</CardTitle>
            <CardDescription>اختر القسم الذي تريد تعديل إعداداته</CardDescription>
          </CardHeader>
          <CardContent>
<<<<<<< HEAD
            <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1">
=======
            <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1">
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
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

        {/* Tab Content */}
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
                        <CardTitle className="text-xl">إعدادات {tab.label}</CardTitle>
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
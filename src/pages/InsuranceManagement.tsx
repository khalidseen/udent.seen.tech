import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, FileText } from "lucide-react";
import InsuranceCompaniesTab from "@/components/insurance/InsuranceCompaniesTab";
import PatientInsuranceTab from "@/components/insurance/PatientInsuranceTab";
import InsuranceClaimsTab from "@/components/insurance/InsuranceClaimsTab";

const InsuranceManagement = () => {
  const [activeTab, setActiveTab] = useState("companies");

  return (
    <PageContainer>
      <PageHeader
        title="إدارة التأمينات الصحية"
        description="إدارة شركات التأمين ونسب التغطية وتتبع المطالبات"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="companies" className="gap-2">
            <Building2 className="w-4 h-4" />
            شركات التأمين
          </TabsTrigger>
          <TabsTrigger value="patients" className="gap-2">
            <Users className="w-4 h-4" />
            تأمين المرضى
          </TabsTrigger>
          <TabsTrigger value="claims" className="gap-2">
            <FileText className="w-4 h-4" />
            المطالبات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <InsuranceCompaniesTab />
        </TabsContent>
        <TabsContent value="patients">
          <PatientInsuranceTab />
        </TabsContent>
        <TabsContent value="claims">
          <InsuranceClaimsTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default InsuranceManagement;

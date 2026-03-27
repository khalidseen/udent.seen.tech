import React, { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, FileText, CreditCard, Receipt, Tags } from "lucide-react";
import InsuranceCompaniesTab from "@/components/insurance/InsuranceCompaniesTab";
import PatientInsuranceTab from "@/components/insurance/PatientInsuranceTab";
import InsuranceClaimsTab from "@/components/insurance/InsuranceClaimsTab";
import { useNavigate, useSearchParams } from "react-router-dom";

const InsuranceManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("companies");
  const requestedTab = searchParams.get('tab');
  const preselectedPatientId = searchParams.get('patient') || undefined;
  const preselectedInvoiceId = searchParams.get('invoice') || undefined;
  const openCreate = searchParams.get('openCreate') === 'true';
  const openClaim = searchParams.get('openClaim') === 'true';
  const workflowSource = searchParams.get('from');

  useEffect(() => {
    if (requestedTab && ['companies', 'patients', 'claims'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next);
  };

  return (
    <PageContainer>
      <PageHeader
        title="إدارة التأمينات الصحية"
        description="إدارة شركات التأمين ونسب التغطية وتتبع المطالبات"
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate(preselectedPatientId ? `/invoice-management?patient=${preselectedPatientId}` : '/invoice-management')}>
              <Receipt className="w-4 h-4 ml-1" /> الفواتير
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(preselectedPatientId ? `/payment-management?patient=${preselectedPatientId}` : '/payment-management')}>
              <CreditCard className="w-4 h-4 ml-1" /> المدفوعات
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(preselectedPatientId ? `/service-prices?patient=${preselectedPatientId}` : '/service-prices')}>
              <Tags className="w-4 h-4 ml-1" /> الأسعار
            </Button>
          </div>
        }
      />

      {(preselectedPatientId || preselectedInvoiceId || openCreate || openClaim) && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          {preselectedPatientId && <span>الصفحة تعمل الآن ضمن سياق مريض محدد. </span>}
          {preselectedInvoiceId && <span>هناك فاتورة مرتبطة سيتم استخدامها في المطالبة. </span>}
          {openCreate && <span>سيتم فتح ربط التأمين مباشرة. </span>}
          {openClaim && <span>سيتم فتح إنشاء مطالبة تأمين مباشرة. </span>}
          {workflowSource === 'invoices' && <span>تم الوصول من شاشة الفواتير.</span>}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} dir="rtl" className="space-y-6">
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
          <PatientInsuranceTab preselectedPatientId={preselectedPatientId} autoOpenCreate={openCreate} />
        </TabsContent>
        <TabsContent value="claims">
          <InsuranceClaimsTab
            preselectedPatientId={preselectedPatientId}
            preselectedInvoiceId={preselectedInvoiceId}
            autoOpenCreate={openClaim}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default InsuranceManagement;

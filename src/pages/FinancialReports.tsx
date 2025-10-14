import { FinancialReports as FinancialReportsComponent } from "@/components/financial/FinancialReports";

export default function FinancialReports() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">التقارير المالية</h1>
        <p className="text-muted-foreground">
          تقارير مفصلة عن الأداء المالي للعيادة
        </p>
      </div>

      <FinancialReportsComponent />
    </div>
  );
}

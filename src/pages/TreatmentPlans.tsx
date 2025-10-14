import { TreatmentPlansManager } from "@/components/financial/TreatmentPlansManager";

export default function TreatmentPlans() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">خطط العلاج المالية</h1>
        <p className="text-muted-foreground">
          إدارة خطط العلاج والدفع المقسط للمرضى
        </p>
      </div>

      <TreatmentPlansManager />
    </div>
  );
}

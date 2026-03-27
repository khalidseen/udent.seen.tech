import { InvoiceManager } from "@/components/financial/InvoiceManager";
import { PageContainer } from "@/components/layout/PageContainer";

export default function InvoiceManagement() {
  return (
    <PageContainer>
      <div className="container mx-auto p-0 space-y-6">
        <InvoiceManager />
      </div>
    </PageContainer>
  );
}

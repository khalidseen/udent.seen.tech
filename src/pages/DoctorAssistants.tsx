import { useState } from "react";
import { Plus, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

const DoctorAssistants = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <PageContainer>
      <PageHeader 
        title="مساعدو الأطباء"
        description="إدارة مساعدي الأطباء والموظفين المساعدين"
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن مساعد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          إضافة مساعد جديد
        </Button>
      </div>

      <Card className="text-center py-12">
        <CardContent>
          <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">قريباً</h3>
          <p className="text-muted-foreground mb-4">
            هذه الصفحة قيد التطوير وستكون متاحة قريباً
          </p>
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            إضافة أول مساعد
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default DoctorAssistants;
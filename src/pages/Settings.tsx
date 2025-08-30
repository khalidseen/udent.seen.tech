import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function Settings() {
  const [clinicName, setClinicName] = useState("عيادة الأسنان المتقدمة");

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">الإعدادات</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>إعدادات العيادة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="clinicName">اسم العيادة</Label>
              <Input
                id="clinicName"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <Button>حفظ الإعدادات</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

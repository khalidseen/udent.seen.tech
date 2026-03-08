import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Calendar, User, FlaskConical } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "معلق", variant: "outline" },
  sent_to_lab: { label: "مرسل للمختبر", variant: "secondary" },
  in_progress: { label: "قيد التصنيع", variant: "default" },
  ready: { label: "جاهز", variant: "default" },
  delivered: { label: "تم التسليم", variant: "secondary" },
  cancelled: { label: "ملغي", variant: "destructive" },
};

const orderTypeMap: Record<string, string> = {
  crown: "تاج",
  bridge: "جسر",
  veneer: "قشرة",
  denture: "طقم أسنان",
  implant_abutment: "دعامة زرع",
  orthodontic: "تقويم",
  night_guard: "واقي ليلي",
  retainer: "مثبت",
  other: "أخرى",
};

const statusFlow = ['pending', 'sent_to_lab', 'in_progress', 'ready', 'delivered'];

interface Props {
  order: any;
  onUpdateStatus: (id: string, status: string) => void;
}

export function LabOrderCard({ order, onUpdateStatus }: Props) {
  const status = statusMap[order.status] || { label: order.status, variant: "outline" as const };
  const isOverdue = order.estimated_delivery && new Date(order.estimated_delivery) < new Date() && order.status !== 'delivered';
  const currentIndex = statusFlow.indexOf(order.status);
  const nextStatuses = statusFlow.slice(currentIndex + 1);

  return (
    <Card className={isOverdue ? "border-red-300 bg-red-50/50 dark:bg-red-950/10" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-primary">{order.order_number}</span>
              <Badge variant={status.variant}>{status.label}</Badge>
              {isOverdue && <Badge variant="destructive">متأخر!</Badge>}
              <Badge variant="outline">{orderTypeMap[order.order_type] || order.order_type}</Badge>
              {order.priority === 'urgent' && <Badge variant="destructive">عاجل</Badge>}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {order.patients?.full_name || 'مريض غير محدد'}
              </span>
              <span className="flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5" />
                {order.dental_labs?.name || 'مختبر غير محدد'}
              </span>
              {order.tooth_number && <span>سن: {order.tooth_number}</span>}
              {order.shade && <span>اللون: {order.shade}</span>}
              {order.material && <span>المادة: {order.material}</span>}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                أنشئ: {format(new Date(order.created_at), 'dd MMM yyyy', { locale: ar })}
              </span>
              {order.estimated_delivery && (
                <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                  التسليم المتوقع: {format(new Date(order.estimated_delivery), 'dd MMM yyyy', { locale: ar })}
                </span>
              )}
              {order.cost > 0 && <span>التكلفة: {order.cost?.toLocaleString()} د.ع</span>}
            </div>
            {order.notes && <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">{order.notes}</p>}
          </div>
          
          {order.status !== 'delivered' && order.status !== 'cancelled' && nextStatuses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  تحديث الحالة <ChevronDown className="w-3 h-3 mr-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {nextStatuses.map(s => (
                  <DropdownMenuItem key={s} onClick={() => onUpdateStatus(order.id, s)}>
                    {statusMap[s]?.label || s}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem className="text-red-600" onClick={() => onUpdateStatus(order.id, 'cancelled')}>
                  إلغاء الطلب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* شريط التقدم */}
        {order.status !== 'cancelled' && (
          <div className="mt-3 flex gap-1">
            {statusFlow.map((s, i) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentIndex ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

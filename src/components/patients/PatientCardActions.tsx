import { FileText, Calendar, Pill, Smile, DollarSign, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface PatientCardActionsProps {
  patientId: string;
  stats?: {
    records?: number;
    appointments?: number;
    treatments?: number;
    invoices?: number;
    images?: number;
  };
}

export const PatientCardActions = ({ patientId, stats }: PatientCardActionsProps) => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: FileText,
      label: 'السجلات الطبية',
      count: stats?.records,
      tab: 'records',
      color: 'text-primary',
    },
    {
      icon: Calendar,
      label: 'المواعيد',
      count: stats?.appointments,
      tab: 'appointments',
      color: 'text-primary',
    },
    {
      icon: Pill,
      label: 'العلاجات',
      count: stats?.treatments,
      tab: 'treatments',
      color: 'text-primary',
    },
    {
      icon: Smile,
      label: 'سجل الأسنان',
      count: undefined,
      tab: 'dental',
      color: 'text-primary',
    },
    {
      icon: DollarSign,
      label: 'الفواتير',
      count: stats?.invoices,
      tab: 'invoices',
      color: 'text-primary',
    },
    {
      icon: Camera,
      label: 'الصور الطبية',
      count: stats?.images,
      tab: 'images',
      color: 'text-primary',
    },
  ];

  const handleActionClick = (tab: string) => {
    navigate(`/patients/${patientId}?tab=${tab}`);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-1 pt-3 border-t border-border/50">
        {actions.map((action) => (
          <Tooltip key={action.tab}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 p-0 hover:bg-accent/50 transition-all hover:scale-110"
                onClick={() => handleActionClick(action.tab)}
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
                {action.count !== undefined && action.count > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] font-medium"
                  >
                    {action.count > 99 ? '99+' : action.count}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>{action.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AppointmentIndicatorProps {
  count: number;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'mixed';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AppointmentIndicator = ({ 
  count, 
  status = 'mixed', 
  size = 'sm',
  className 
}: AppointmentIndicatorProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'scheduled':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'lg':
        return 'text-sm px-2 py-1';
      case 'md':
        return 'text-xs px-1.5 py-0.5';
      default:
        return 'text-xs px-1 py-0';
    }
  };

  if (count === 0) return null;

  return (
    <Badge
      className={cn(
        getStatusColor(),
        getSizeClasses(),
        "font-medium rounded-full",
        className
      )}
    >
      {count}
    </Badge>
  );
};

export default AppointmentIndicator;
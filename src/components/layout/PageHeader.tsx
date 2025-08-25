import { ReactNode } from "react";
import { NetworkStatusIndicator } from "@/components/ui/network-status";
interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}
export function PageHeader({
  title,
  description,
  action
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <div className="flex items-center gap-2">
          <NetworkStatusIndicator />
          {action}
        </div>
      )}
    </div>
  );
}
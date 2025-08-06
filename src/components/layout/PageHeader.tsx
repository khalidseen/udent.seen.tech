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
    <div className="flex justify-between items-start mb-8 p-6 mx-4 sm:mx-6 bg-white/60 dark:bg-card/40 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm px-[25px] my-0 lg:mx-0">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <h1 className="text-foreground tracking-tight text-2xl font-bold">{title}</h1>
          <NetworkStatusIndicator />
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
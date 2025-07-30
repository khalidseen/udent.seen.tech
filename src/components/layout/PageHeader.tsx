import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-8 p-6 mx-4 sm:mx-6 lg:mx-8 bg-white/60 dark:bg-card/40 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-lg">{description}</p>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
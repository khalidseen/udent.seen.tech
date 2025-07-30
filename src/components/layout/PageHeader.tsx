import { ReactNode } from "react";

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
    <div className="flex justify-between items-start mb-6 p-6 bg-white/60 dark:bg-gray-800/40 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
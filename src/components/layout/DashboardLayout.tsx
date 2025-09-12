import { ReactNode } from 'react';
import { useSettings } from '@/hooks/useSettingsHook';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const settings = useSettings();

  if (!settings.showDashboardBoxes) {
    return null;
  }

  return (
    <div 
      className="grid gap-4 p-4"
      style={{
        gridTemplateColumns: `repeat(${settings.boxesPerRow}, minmax(0, 1fr))`
      }}
    >
      {children}
    </div>
  );
}

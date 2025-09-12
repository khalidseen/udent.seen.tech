import { createContext } from 'react';

export interface SettingsContextType {
  fontWeight: 'normal' | 'bold';
  setFontWeight: (weight: 'normal' | 'bold') => void;
  sidebarIconSize: 'small' | 'medium' | 'large';
  setSidebarIconSize: (size: 'small' | 'medium' | 'large') => void;
  collapsedIconSize: 'small' | 'medium' | 'large';
  setCollapsedIconSize: (size: 'small' | 'medium' | 'large') => void;
  showDashboardBoxes: boolean;
  setShowDashboardBoxes: (show: boolean) => void;
  boxesPerRow: number;
  setBoxesPerRow: (count: number) => void;
  boxSize: number;
  setBoxSize: (size: number) => void;
  // New: whether to show dashboard link-validation alert when broken links exist
  linkValidationAlertEnabled: boolean;
  setLinkValidationAlertEnabled: (enabled: boolean) => void;
  // Persist/clear dashboard dismissal on server (per-profile)
  setDashboardDismissedServer?: (value: boolean) => Promise<void> | void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

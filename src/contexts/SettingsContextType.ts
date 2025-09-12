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
<<<<<<< HEAD
  // New: whether to show dashboard link-validation alert when broken links exist
  linkValidationAlertEnabled: boolean;
  setLinkValidationAlertEnabled: (enabled: boolean) => void;
  // Persist/clear dashboard dismissal on server (per-profile)
  setDashboardDismissedServer?: (value: boolean) => Promise<void> | void;
=======
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

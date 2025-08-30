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
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

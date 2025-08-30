import { useState, useEffect, ReactNode } from 'react';
import { SettingsContext, SettingsContextType } from './SettingsContextType';

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>(() => {
    const saved = localStorage.getItem('fontWeight');
    return (saved as 'normal' | 'bold') || 'normal';
  });

  const [sidebarIconSize, setSidebarIconSize] = useState<'small' | 'medium' | 'large'>(() => {
    const saved = localStorage.getItem('sidebarIconSize');
    return (saved as 'small' | 'medium' | 'large') || 'medium';
  });

  const [collapsedIconSize, setCollapsedIconSize] = useState<'small' | 'medium' | 'large'>(() => {
    const saved = localStorage.getItem('collapsedIconSize');
    return (saved as 'small' | 'medium' | 'large') || 'large';
  });

  const [showDashboardBoxes, setShowDashboardBoxes] = useState<boolean>(() => {
    const saved = localStorage.getItem('showDashboardBoxes');
    return saved ? JSON.parse(saved) : true;
  });

  const [boxesPerRow, setBoxesPerRow] = useState<number>(() => {
    const saved = localStorage.getItem('boxesPerRow');
    return saved ? parseInt(saved) : 3;
  });

  const [boxSize, setBoxSize] = useState<number>(() => {
    const saved = localStorage.getItem('boxSize');
    return saved ? parseInt(saved) : 200;
  });

  useEffect(() => {
    localStorage.setItem('fontWeight', fontWeight);
    
    // Apply font weight to the root element
    document.documentElement.style.setProperty(
      '--font-weight-global',
      fontWeight === 'bold' ? '700' : '400'
    );
    
    // Apply font weight class to body
    document.body.classList.toggle('font-bold', fontWeight === 'bold');
  }, [fontWeight]);

  useEffect(() => {
    localStorage.setItem('sidebarIconSize', sidebarIconSize);
  }, [sidebarIconSize]);

  useEffect(() => {
    localStorage.setItem('collapsedIconSize', collapsedIconSize);
  }, [collapsedIconSize]);

  useEffect(() => {
    localStorage.setItem('showDashboardBoxes', JSON.stringify(showDashboardBoxes));
  }, [showDashboardBoxes]);

  useEffect(() => {
    localStorage.setItem('boxesPerRow', boxesPerRow.toString());
  }, [boxesPerRow]);

  useEffect(() => {
    localStorage.setItem('boxSize', boxSize.toString());
  }, [boxSize]);

  return (
    <SettingsContext.Provider value={{ 
      fontWeight, 
      setFontWeight,
      sidebarIconSize,
      setSidebarIconSize,
      collapsedIconSize,
      setCollapsedIconSize,
      showDashboardBoxes,
      setShowDashboardBoxes,
      boxesPerRow,
      setBoxesPerRow,
      boxSize,
      setBoxSize
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

// No content to replace
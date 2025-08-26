import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  fontWeight: 'normal' | 'bold';
  setFontWeight: (weight: 'normal' | 'bold') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>(() => {
    const saved = localStorage.getItem('fontWeight');
    return (saved as 'normal' | 'bold') || 'normal';
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

  return (
    <SettingsContext.Provider value={{ fontWeight, setFontWeight }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
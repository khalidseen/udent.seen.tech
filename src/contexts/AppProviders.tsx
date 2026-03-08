import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalProvider } from '@/contexts/GlobalContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <AuthProvider>
    <GlobalProvider>
      <LanguageProvider>
        <SettingsProvider>
          <SidebarProvider>
            <ThemeProvider>
              <CurrencyProvider>
                <PermissionsProvider>
                  {children}
                </PermissionsProvider>
              </CurrencyProvider>
            </ThemeProvider>
          </SidebarProvider>
        </SettingsProvider>
      </LanguageProvider>
    </GlobalProvider>
  </AuthProvider>
);

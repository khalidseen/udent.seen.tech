import { createContext, useContext, useMemo, ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { queryClient } from "@/lib/queryClient";

interface GlobalContextValue {
  // Add shared state here if needed
}

const GlobalContext = createContext<GlobalContextValue | undefined>(undefined);

export function useGlobalContext() {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within GlobalProvider");
  }
  return context;
}

interface GlobalProviderProps {
  children: ReactNode;
}

export function GlobalProvider({ children }: GlobalProviderProps) {
  const contextValue = useMemo<GlobalContextValue>(() => ({}), []);

  return (
    <GlobalContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={100}>
          {children}
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    </GlobalContext.Provider>
  );
}

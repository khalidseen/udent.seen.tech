import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: "default" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function PageContainer({ children, maxWidth = "default" }: PageContainerProps) {
  const maxWidthClasses = {
    default: "max-w-7xl",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg", 
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full"
  };

  return (
    <div className={`w-full ${maxWidthClasses[maxWidth]} mx-auto space-y-8`}>
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
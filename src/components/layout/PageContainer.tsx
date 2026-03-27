import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: "default" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  animate?: boolean;
}

export function PageContainer({ children, maxWidth = "default", animate = true }: PageContainerProps) {
  const maxWidthClasses = {
    default: "max-w-7xl",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg", 
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full"
  };

  const content = (
    <div className="w-full space-y-6 px-3 sm:px-6 lg:px-8">
      {children}
    </div>
  );

  if (!animate) {
    return (
      <div className={`w-full ${maxWidthClasses[maxWidth]} mx-auto space-y-8`}>
        {content}
      </div>
    );
  }

  return (
    <motion.div
      className={`w-full ${maxWidthClasses[maxWidth]} mx-auto space-y-8`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {content}
    </motion.div>
  );
}
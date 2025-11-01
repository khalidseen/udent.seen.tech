import { memo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OptimizedCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export const OptimizedCard = memo<OptimizedCardProps>(
  ({ title, description, children, className, headerAction }) => {
    return (
      <Card className={cn("transition-shadow hover:shadow-md", className)}>
        {(title || description || headerAction) && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {headerAction}
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    );
  }
);

OptimizedCard.displayName = "OptimizedCard";

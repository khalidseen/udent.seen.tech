import { memo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Memoized Card Component
export const MemoCard = memo<{
  title?: string;
  children: ReactNode;
  className?: string;
}>(({ title, children, className }) => (
  <Card className={className}>
    {title && (
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
    )}
    <CardContent>{children}</CardContent>
  </Card>
));
MemoCard.displayName = "MemoCard";

// Memoized Button Component
export const MemoButton = memo<{
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  className?: string;
  disabled?: boolean;
}>(({ children, onClick, variant = "default", className, disabled }) => (
  <Button
    onClick={onClick}
    variant={variant}
    className={className}
    disabled={disabled}
  >
    {children}
  </Button>
));
MemoButton.displayName = "MemoButton";

// Memoized Badge Component
export const MemoBadge = memo<{
  children: ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}>(({ children, variant = "default", className }) => (
  <Badge variant={variant} className={className}>
    {children}
  </Badge>
));
MemoBadge.displayName = "MemoBadge";

// Memoized List Item
export const MemoListItem = memo<{
  title: string;
  subtitle?: string;
  badge?: string;
  onClick?: () => void;
  actions?: ReactNode;
}>(({ title, subtitle, badge, onClick, actions }) => (
  <div
    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-0"
    onClick={onClick}
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="font-medium truncate">{title}</h3>
        {badge && <MemoBadge>{badge}</MemoBadge>}
      </div>
      {subtitle && <p className="text-sm text-muted-foreground truncate mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
  </div>
));
MemoListItem.displayName = "MemoListItem";

// Memoized Stat Card
export const MemoStatCard = memo<{
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}>(({ title, value, icon, trend, className }) => (
  <Card className={className}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {trend && (
            <p
              className={`text-sm mt-2 ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </p>
          )}
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </CardContent>
  </Card>
));
MemoStatCard.displayName = "MemoStatCard";

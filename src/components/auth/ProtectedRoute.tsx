import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 animate-pulse">
              <Stethoscope className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-2">فوردنتست</h2>
            <p className="text-muted-foreground text-center">جاري التحميل...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
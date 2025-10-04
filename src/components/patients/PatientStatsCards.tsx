import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Archive, TrendingUp } from "lucide-react";

interface PatientStatsCardsProps {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  archivedPatients: number;
}

export default function PatientStatsCards({
  totalPatients,
  activePatients,
  inactivePatients,
  archivedPatients,
}: PatientStatsCardsProps) {
  const stats = [
    {
      title: "إجمالي المرضى",
      value: totalPatients,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "المرضى النشطين",
      value: activePatients,
      icon: UserCheck,
      gradient: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "غير نشط",
      value: inactivePatients,
      icon: UserX,
      gradient: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "مؤرشف",
      value: archivedPatients,
      icon: Archive,
      gradient: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-950/30",
      iconColor: "text-gray-600 dark:text-gray-400",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={stat.title}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className="relative overflow-hidden border-border/60 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>من إجمالي {totalPatients} مريض</span>
                </div>
              </CardContent>
              {/* Gradient accent */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            </Card>
          </div>
        );
      })}
    </div>
  );
}

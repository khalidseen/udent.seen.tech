import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

export interface PatientFilter {
  gender?: string;
  ageRange?: string;
  hasEmail?: string;
  hasPhone?: string;
  datePreset?: string;
  registrationDate?: DateRange;
}

interface PatientFiltersProps {
  filters: PatientFilter;
  onFiltersChange: (filters: PatientFilter) => void;
}

const PatientFilters = ({ filters, onFiltersChange }: PatientFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof PatientFilter, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? undefined : value,
    });
  };

  const handleDatePresetChange = (preset: string) => {
    if (preset === "all") {
      onFiltersChange({
        ...filters,
        datePreset: undefined,
        registrationDate: undefined,
      });
      return;
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let from: Date | undefined;
    let to: Date | undefined = today;

    switch (preset) {
      case "today":
        from = today;
        break;
      case "yesterday":
        from = yesterday;
        to = yesterday;
        break;
      case "this_week":
        from = new Date(today);
        from.setDate(today.getDate() - today.getDay());
        break;
      case "last_week":
        from = new Date(today);
        from.setDate(today.getDate() - today.getDay() - 7);
        to = new Date(today);
        to.setDate(today.getDate() - today.getDay() - 1);
        break;
      case "this_month":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "last_month":
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "custom":
        onFiltersChange({
          ...filters,
          datePreset: preset,
        });
        return;
    }

    onFiltersChange({
      ...filters,
      datePreset: preset,
      registrationDate: { from, to },
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const handleCustomDateChange = (dateRange: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      datePreset: dateRange ? "custom" : undefined,
      registrationDate: dateRange,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.gender) count++;
    if (filters.ageRange) count++;
    if (filters.hasEmail) count++;
    if (filters.hasPhone) count++;
    if (filters.datePreset) count++;
    return count;
  };

  const getActiveFiltersList = () => {
    const activeFilters: string[] = [];
    if (filters.gender) {
      activeFilters.push(`الجنس: ${filters.gender === "male" ? "ذكر" : "أنثى"}`);
    }
    if (filters.ageRange) {
      activeFilters.push(`العمر: ${filters.ageRange}`);
    }
    if (filters.hasEmail) {
      activeFilters.push(
        filters.hasEmail === "yes" ? "لديهم بريد إلكتروني" : "بدون بريد إلكتروني"
      );
    }
    if (filters.hasPhone) {
      activeFilters.push(
        filters.hasPhone === "yes" ? "لديهم رقم هاتف" : "بدون رقم هاتف"
      );
    }
    if (filters.datePreset) {
      const presetLabels: Record<string, string> = {
        today: "اليوم",
        yesterday: "الأمس",
        this_week: "هذا الأسبوع",
        last_week: "الأسبوع الماضي",
        this_month: "هذا الشهر",
        last_month: "الشهر الماضي",
        custom: "مدة محددة",
      };
      activeFilters.push(`الفترة: ${presetLabels[filters.datePreset] || filters.datePreset}`);
    }
    return activeFilters;
  };

  return (
    <Card className="border border-border/60 bg-card/90 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  فلترة متقدمة
                  {getActiveFiltersCount() > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
              
              {getActiveFiltersCount() > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
                  <X className="w-4 h-4" />
                  مسح الفلاتر
                </Button>
              )}
            </div>

            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-accent/20 rounded-lg border">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    الفترة الزمنية
                  </Label>
                  <Select
                    value={filters.datePreset || "all"}
                    onValueChange={handleDatePresetChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفترة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفترات</SelectItem>
                      <SelectItem value="today">اليوم</SelectItem>
                      <SelectItem value="yesterday">الأمس</SelectItem>
                      <SelectItem value="this_week">هذا الأسبوع</SelectItem>
                      <SelectItem value="last_week">الأسبوع الماضي</SelectItem>
                      <SelectItem value="this_month">هذا الشهر</SelectItem>
                      <SelectItem value="last_month">الشهر الماضي</SelectItem>
                      <SelectItem value="custom">مدة محددة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الجنس</Label>
                  <Select
                    value={filters.gender || "all"}
                    onValueChange={(value) => updateFilter("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>العمر</Label>
                  <Select
                    value={filters.ageRange || "all"}
                    onValueChange={(value) => updateFilter("ageRange", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة العمرية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأعمار</SelectItem>
                      <SelectItem value="0-18">0-18 سنة</SelectItem>
                      <SelectItem value="19-35">19-35 سنة</SelectItem>
                      <SelectItem value="36-50">36-50 سنة</SelectItem>
                      <SelectItem value="51-70">51-70 سنة</SelectItem>
                      <SelectItem value="71+">71+ سنة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Select
                    value={filters.hasEmail || "all"}
                    onValueChange={(value) => updateFilter("hasEmail", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="حالة البريد الإلكتروني" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="yes">لديهم بريد إلكتروني</SelectItem>
                      <SelectItem value="no">بدون بريد إلكتروني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Select
                    value={filters.hasPhone || "all"}
                    onValueChange={(value) => updateFilter("hasPhone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="حالة رقم الهاتف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="yes">لديهم رقم هاتف</SelectItem>
                      <SelectItem value="no">بدون رقم هاتف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filters.datePreset === "custom" && (
                <div className="space-y-2 p-4 bg-accent/20 rounded-lg border">
                  <Label className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    اختر الفترة الزمنية
                  </Label>
                  <DatePickerWithRange
                    date={filters.registrationDate}
                    onDateChange={handleCustomDateChange}
                  />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-2">
              {getActiveFiltersList().map((filter, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {filter}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientFilters;
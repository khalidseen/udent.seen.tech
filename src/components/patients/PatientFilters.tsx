import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Calendar, User } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface PatientFilter {
  gender: string;
  ageRange: string;
  hasEmail: string;
  hasPhone: string;
  dateFrom: string;
  dateTo: string;
}

interface PatientFiltersProps {
  filters: PatientFilter;
  onFiltersChange: (filters: PatientFilter) => void;
}

const PatientFilters = ({ filters, onFiltersChange }: PatientFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof PatientFilter, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      gender: 'all',
      ageRange: 'all',
      hasEmail: 'all',
      hasPhone: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      value !== '' && value !== 'all'
    ).length;
  };

  const getActiveFiltersList = () => {
    const activeFilters = [];
    if (filters.gender && filters.gender !== 'all') activeFilters.push(`الجنس: ${filters.gender === 'male' ? 'ذكر' : 'أنثى'}`);
    if (filters.ageRange && filters.ageRange !== 'all') activeFilters.push(`العمر: ${filters.ageRange}`);
    if (filters.hasEmail && filters.hasEmail !== 'all') activeFilters.push(`البريد: ${filters.hasEmail === 'yes' ? 'متوفر' : 'غير متوفر'}`);
    if (filters.hasPhone && filters.hasPhone !== 'all') activeFilters.push(`الهاتف: ${filters.hasPhone === 'yes' ? 'متوفر' : 'غير متوفر'}`);
    if (filters.dateFrom || filters.dateTo) activeFilters.push('تاريخ التسجيل محدد');
    return activeFilters;
  };

  return (
    <Card className="border border-border/60 bg-white/90 dark:bg-card/90 backdrop-blur-sm">
      <CardContent className="p-6">
          {/* Search Bar */}
          <div className="space-y-4">
            {/* Advanced Filters Toggle */}
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
              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-accent/20 rounded-lg border">
                {/* Gender Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    الجنس
                  </Label>
                  <Select value={filters.gender} onValueChange={(value) => updateFilter('gender', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Age Range Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    الفئة العمرية
                  </Label>
                  <Select value={filters.ageRange} onValueChange={(value) => updateFilter('ageRange', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="0-18">أقل من 18</SelectItem>
                      <SelectItem value="18-30">18-30</SelectItem>
                      <SelectItem value="30-50">30-50</SelectItem>
                      <SelectItem value="50-70">50-70</SelectItem>
                      <SelectItem value="70+">أكثر من 70</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Filter */}
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Select value={filters.hasEmail} onValueChange={(value) => updateFilter('hasEmail', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="yes">متوفر</SelectItem>
                      <SelectItem value="no">غير متوفر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone Filter */}
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Select value={filters.hasPhone} onValueChange={(value) => updateFilter('hasPhone', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="yes">متوفر</SelectItem>
                      <SelectItem value="no">غير متوفر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-accent/20 rounded-lg border">
                <div className="space-y-2">
                  <Label>تاريخ التسجيل من</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ التسجيل إلى</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">الفلاتر النشطة:</span>
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
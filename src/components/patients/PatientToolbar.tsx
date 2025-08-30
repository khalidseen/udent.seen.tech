import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Grid3X3, 
  List, 
  Filter, 
  Plus,
  X
} from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import PatientFilters, { PatientFilter } from "./PatientFilters";
import AddPatientDrawer from "./AddPatientDrawer";

interface PatientToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  filters: PatientFilter;
  onFiltersChange: (filters: PatientFilter) => void;
  onPatientAdded: () => void;
  activeFiltersCount: number;
}

export function PatientToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
  onPatientAdded,
  activeFiltersCount
}: PatientToolbarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const clearSearch = () => {
    onSearchChange("");
    setIsSearchExpanded(false);
  };

  return (
    <div className="bg-background border-b border-border/40 sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        
        {/* البحث السريع */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          {!isSearchExpanded ? (
            <Button
              variant="outline"
              onClick={() => setIsSearchExpanded(true)}
              className="flex items-center gap-2 min-w-[120px]"
            >
              <Search className="w-4 h-4" />
              البحث السريع
            </Button>
          ) : (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مريض..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 pr-8"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* أزرار العرض والفلاتر وإضافة المريض */}
        <div className="flex items-center gap-2">
          
          {/* زر المربعات */}
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            onClick={() => onViewModeChange('cards')}
            className="flex items-center gap-2"
          >
            <Grid3X3 className="w-4 h-4" />
            مربعات
          </Button>

          {/* زر الجدول */}
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => onViewModeChange('table')}
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            جدول
          </Button>

          {/* الفلتر المتقدم */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 relative"
              >
                <Filter className="w-4 h-4" />
                الفلتر المتقدم
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <PatientFilters 
                filters={filters} 
                onFiltersChange={onFiltersChange} 
              />
            </PopoverContent>
          </Popover>

          {/* إضافة مريض جديد */}
          <AddPatientDrawer onPatientAdded={onPatientAdded} />
        </div>
      </div>
    </div>
  );
}
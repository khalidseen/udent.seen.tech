import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Grid3X3, 
  List, 
  Filter, 
  X
} from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageToolbarProps {
  title: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (mode: 'cards' | 'table') => void;
  showViewToggle?: boolean;
  filterContent?: ReactNode;
  activeFiltersCount?: number;
  actions?: ReactNode;
  showAdvancedFilter?: boolean;
}

export function PageToolbar({
  title,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder,
  viewMode = 'cards',
  onViewModeChange,
  showViewToggle = true,
  filterContent,
  activeFiltersCount = 0,
  actions,
  showAdvancedFilter = true,
}: PageToolbarProps) {
  const { t } = useLanguage();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const clearSearch = () => {
    if (onSearchChange) {
      onSearchChange("");
    }
    setIsSearchExpanded(false);
  };

  return (
    <div className="bg-background border-b border-border/40 sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        
        {/* عنوان الصفحة */}
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>
        
        {/* البحث السريع */}
        {onSearchChange && (
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            {!isSearchExpanded ? (
              <Button
                variant="outline"
                onClick={() => setIsSearchExpanded(true)}
                className="flex items-center gap-2 min-w-[120px]"
              >
                <Search className="w-4 h-4" />
                {t('common.quickSearch')}
              </Button>
            ) : (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder || t('common.searchPlaceholder')}
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
        )}

        {/* أزرار العرض والفلاتر والإجراءات */}
        <div className="flex items-center gap-2">
          
          {/* أزرار المربعات والجدول */}
          {showViewToggle && onViewModeChange && (
            <>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                onClick={() => onViewModeChange('cards')}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="w-4 h-4" />
                {t('common.cards')}
              </Button>

              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                onClick={() => onViewModeChange('table')}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                {t('common.table')}
              </Button>
            </>
          )}

          {/* الفلتر المتقدم */}
          {showAdvancedFilter && filterContent && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 relative"
                >
                  <Filter className="w-4 h-4" />
                  {t('common.advancedFilter')}
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
                {filterContent}
              </PopoverContent>
            </Popover>
          )}

          {/* إجراءات إضافية */}
          {actions}
        </div>
      </div>
    </div>
  );
}
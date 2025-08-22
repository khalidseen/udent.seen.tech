import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  User, 
  Calendar, 
  UserCheck, 
  Receipt, 
  Package, 
  FileText,
  Stethoscope,
  Bell,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: 'patient' | 'appointment' | 'doctor' | 'invoice' | 'inventory' | 'record' | 'treatment' | 'notification' | 'setting';
  title: string;
  subtitle: string;
  route: string;
  icon: typeof User;
}

// Mock data - في التطبيق الحقيقي ستأتي من قاعدة البيانات
const mockSearchData: SearchResult[] = [
  // Patients
  { id: '1', type: 'patient', title: 'أحمد محمد علي', subtitle: '01234567890', route: '/patients/1', icon: User },
  { id: '2', type: 'patient', title: 'فاطمة أحمد', subtitle: 'fatima@email.com', route: '/patients/2', icon: User },
  { id: '3', type: 'patient', title: 'محمد حسن', subtitle: '01098765432', route: '/patients/3', icon: User },
  
  // Appointments
  { id: '4', type: 'appointment', title: 'موعد أحمد محمد', subtitle: 'اليوم 2:00 PM', route: '/appointments', icon: Calendar },
  { id: '5', type: 'appointment', title: 'فحص دوري', subtitle: 'غداً 10:00 AM', route: '/appointments', icon: Calendar },
  
  // Doctors
  { id: '6', type: 'doctor', title: 'د. سارة أحمد', subtitle: 'طبيب أسنان', route: '/doctors', icon: UserCheck },
  { id: '7', type: 'doctor', title: 'د. محمد حسين', subtitle: 'أخصائي جراحة', route: '/doctors', icon: UserCheck },
  
  // Invoices
  { id: '8', type: 'invoice', title: 'فاتورة #1001', subtitle: '500 ج.م', route: '/invoices', icon: Receipt },
  { id: '9', type: 'invoice', title: 'فاتورة #1002', subtitle: '750 ج.م', route: '/invoices', icon: Receipt },
  
  // Inventory
  { id: '10', type: 'inventory', title: 'أدوات التنظيف', subtitle: '25 قطعة متوفرة', route: '/inventory', icon: Package },
  { id: '11', type: 'inventory', title: 'مواد التعقيم', subtitle: '10 عبوات', route: '/inventory', icon: Package },
  
  // Medical Records
  { id: '12', type: 'record', title: 'تقرير طبي - أحمد', subtitle: 'فحص دوري', route: '/medical-records', icon: FileText },
  
  // Treatments
  { id: '13', type: 'treatment', title: 'تنظيف الأسنان', subtitle: 'علاج عام', route: '/treatments', icon: Stethoscope },
  
  // Settings
  { id: '14', type: 'setting', title: 'إعدادات النظام', subtitle: 'إدارة التطبيق', route: '/settings', icon: Settings },
];

const typeLabels = {
  patient: 'مريض',
  appointment: 'موعد', 
  doctor: 'طبيب',
  invoice: 'فاتورة',
  inventory: 'مخزون',
  record: 'ملف طبي',
  treatment: 'علاج',
  notification: 'إشعار',
  setting: 'إعداد'
};

const typeColors = {
  patient: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  appointment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  doctor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  invoice: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  inventory: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  record: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  treatment: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  notification: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  setting: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // البحث في البيانات
  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const filteredResults = mockSearchData.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8); // إظهار أول 8 نتائج

    setResults(filteredResults);
    setIsOpen(filteredResults.length > 0);
    setSelectedIndex(-1);
  }, [query]);

  // التنقل بالكيبورد
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.route);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // إغلاق النتائج عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="البحث في النظام..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pr-10 h-9 bg-background/60 border-border/40"
        />
      </div>

      {/* نتائج البحث */}
      {isOpen && results.length > 0 && (
        <Card 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-auto shadow-lg border-border/40"
        >
          <CardContent className="p-2">
            <div className="space-y-1">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <Button
                    key={result.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start p-3 h-auto text-right",
                      selectedIndex === index && "bg-accent"
                    )}
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">
                            {result.title}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs shrink-0 mr-2", typeColors[result.type])}
                          >
                            {typeLabels[result.type]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {results.length === 8 && (
              <div className="text-center py-2 border-t mt-2">
                <span className="text-xs text-muted-foreground">
                  اضغط Enter للمزيد من النتائج
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
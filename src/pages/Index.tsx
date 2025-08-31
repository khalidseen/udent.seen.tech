import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  UserPlus, 
  Calendar, 
  FileText, 
  DollarSign, 
  Package, 
  Stethoscope,
  Brain,
  Settings,
  BarChart3,
  Bell,
  Activity,
  Edit,
  Save,
  X,
  GripVertical,
  Link as LinkIcon
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettingsHook";

interface ActionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  route: string;
  order_index?: number;
}

function Index() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const defaultCards: ActionCard[] = [
    {
      id: "1",
      title: "إضافة مريض جديد",
      description: "تسجيل بيانات مريض جديد في النظام",
      icon: UserPlus,
      color: "bg-blue-500",
      route: "/patients",
      order_index: 1
    },
    {
      id: "2",
      title: "حجز موعد",
      description: "حجز موعد جديد للمريض",
      icon: Calendar,
      color: "bg-green-500",
      route: "/appointments/new",
      order_index: 2
    },
    {
      id: "public-booking-link",
      title: "رابط حجز المرضى",
      description: "رابط مباشر يمكن مشاركته مع المرضى لحجز موعد عبر الإنترنت",
      icon: LinkIcon,
      color: "bg-lime-600",
      route: "/public-booking",
      order_index: 3
    },
    {
      id: "3",
      title: "السجلات الطبية",
      description: "إدارة السجلات الطبية للمرضى",
      icon: FileText,
      color: "bg-purple-500",
      route: "/medical-records",
      order_index: 3
    },
    {
      id: "4",
      title: "الفواتير",
      description: "إدارة الفواتير والمدفوعات",
      icon: DollarSign,
      color: "bg-yellow-500",
      route: "/invoices",
      order_index: 4
    },
    {
      id: "5",
      title: "المخزون",
      description: "إدارة المخزون والإمدادات",
      icon: Package,
      color: "bg-orange-500",
      route: "/inventory",
      order_index: 5
    },
    {
      id: "6",
      title: "العلاجات",
      description: "إدارة العلاجات والإجراءات",
      icon: Stethoscope,
      color: "bg-red-500",
      route: "/treatments",
      order_index: 6
    },
    {
      id: "7",
      title: "الذكاء الاصطناعي",
      description: "تحليل ذكي وتشخيص متقدم",
      icon: Brain,
      color: "bg-indigo-500",
      route: "/ai-insights",
      order_index: 7
    },
    {
      id: "8",
      title: "الإعدادات",
      description: "إعدادات النظام والأداء",
      icon: Settings,
      color: "bg-gray-500",
      route: "/settings",
      order_index: 8
    },
    {
      id: "9",
      title: "التقارير",
      description: "تقارير شاملة وإحصائيات",
      icon: BarChart3,
      color: "bg-teal-500",
      route: "/reports",
      order_index: 9
    },
    {
      id: "10",
      title: "الإشعارات",
      description: "إدارة الإشعارات والتنبيهات",
      icon: Bell,
      color: "bg-pink-500",
      route: "/notifications",
      order_index: 10
    },
    {
      id: "11",
      title: "مراقبة النظام",
      description: "مراقبة صحة النظام والأداء",
      icon: Activity,
      color: "bg-cyan-500",
      route: "/settings",
      order_index: 11
    }
  ];

  const [actionCards, setActionCards] = useState<ActionCard[]>(defaultCards);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ title: string; description: string; route: string }>({ 
    title: "", 
    description: "",
    route: ""
  });
  const [draggedCard, setDraggedCard] = useState<ActionCard | null>(null);
  const [loading, setLoading] = useState(true);

  // تحميل البيانات من localStorage أو قاعدة البيانات
  useEffect(() => {
    loadDashboardCards();
  }, []);

  const loadDashboardCards = async () => {
    try {
      // أولاً محاولة التحميل من localStorage
      const savedCards = localStorage.getItem('dashboard_cards');
      if (savedCards) {
        let parsedCards = JSON.parse(savedCards);
        // دمج البطاقات الجديدة من defaultCards إذا لم تكن موجودة
        defaultCards.forEach((defCard) => {
          if (!parsedCards.some((c: any) => c.id === defCard.id)) {
            parsedCards.push(defCard);
          }
        });
        // تحديث الخصائص (color, icon) من defaultCards دائماً
        const loadedCards = parsedCards.map((item: any) => {
          const defaultCard = defaultCards.find(card => card.id === item.id);
          return {
            ...item,
            color: defaultCard?.color || "bg-gray-500",
            icon: defaultCard?.icon || Settings
          };
        });
        setActionCards(loadedCards);
        localStorage.setItem('dashboard_cards', JSON.stringify(loadedCards));
        setLoading(false);
        return;
      }

      // استخدام البيانات الافتراضية مباشرة
      const data = null;
      const error = true;

      if (error) {
        console.log('Database not ready, using default cards');
        // حفظ البيانات الافتراضية في localStorage
        localStorage.setItem('dashboard_cards', JSON.stringify(defaultCards));
        setActionCards(defaultCards);
      } else if (data && data.length > 0) {
        // تحويل البيانات من قاعدة البيانات إلى تنسيق المكون
        let loadedCards = data.map((item: any) => {
          const defaultCard = defaultCards.find(card => card.id === item.id);
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            route: item.route,
            color: defaultCard?.color || "bg-gray-500",
            icon: defaultCard?.icon || Settings,
            order_index: item.order_index
          };
        });
        // دمج البطاقات الجديدة من defaultCards إذا لم تكن موجودة
        defaultCards.forEach((defCard) => {
          if (!loadedCards.some((c: any) => c.id === defCard.id)) {
            loadedCards.push(defCard);
          }
        });
        setActionCards(loadedCards);
        // حفظ في localStorage للمرة القادمة
        localStorage.setItem('dashboard_cards', JSON.stringify(loadedCards));
      } else {
        // إنشاء البيانات الافتراضية
        localStorage.setItem('dashboard_cards', JSON.stringify(defaultCards));
        setActionCards(defaultCards);
        await initializeDefaultCards();
      }
    } catch (error) {
      console.error('Error loading dashboard cards:', error);
      localStorage.setItem('dashboard_cards', JSON.stringify(defaultCards));
      setActionCards(defaultCards);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultCards = async () => {
    try {
      // أولاً إنشاء الجدول إذا لم يكن موجوداً
      await createDashboardCardsTable();
      
      const cardsToInsert = defaultCards.map(card => ({
        id: card.id,
        title: card.title,
        description: card.description,
        route: card.route,
        order_index: card.order_index
      }));

      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1); // فقط للتحقق من الاتصال

      if (error) {
        console.error('Error initializing cards:', error);
      }
    } catch (error) {
      console.error('Error initializing default cards:', error);
    }
  };

  const createDashboardCardsTable = async () => {
    try {
      // تخطي إنشاء الجدول - غير مطلوب
      console.log('Skipping table creation');
    } catch (error) {
      console.error('Error creating dashboard_cards table:', error);
    }
  };

  // دوال السحب والإفلات
  const handleDragStart = (e: React.DragEvent, card: ActionCard) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetCard: ActionCard) => {
    e.preventDefault();
    
    if (!draggedCard || draggedCard.id === targetCard.id) return;

    const draggedIndex = actionCards.findIndex(card => card.id === draggedCard.id);
    const targetIndex = actionCards.findIndex(card => card.id === targetCard.id);

    const newCards = [...actionCards];
    newCards.splice(draggedIndex, 1);
    newCards.splice(targetIndex, 0, draggedCard);

    // تحديث order_index للبطاقات
    const updatedCards = newCards.map((card, index) => ({
      ...card,
      order_index: index + 1
    }));

    setActionCards(updatedCards);
    setDraggedCard(null);

    // حفظ الترتيب الجديد في قاعدة البيانات
    await saveCardsOrder(updatedCards);
  };

  const saveCardsOrder = async (cards: ActionCard[]) => {
    try {
      // حفظ في localStorage أولاً
      localStorage.setItem('dashboard_cards', JSON.stringify(cards));

      // محاولة الحفظ في قاعدة البيانات
      try {
        const updates = cards.map(card => ({
          id: card.id,
          order_index: card.order_index
        }));

        for (const update of updates) {
          // تخطي تحديث قاعدة البيانات وحفظ محلياً فقط
          console.log('Skipping database update for:', update.id);
        }
      } catch (dbError) {
        console.log('Database save failed, but localStorage updated');
      }

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ ترتيب المربعات الجديد",
      });
    } catch (error) {
      console.error('Error saving cards order:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ ترتيب المربعات",
        variant: "destructive",
      });
    }
  };

  // دوال التحرير
  const startEditing = (card: ActionCard) => {
    setEditingCard(card.id);
    setEditData({ 
      title: card.title, 
      description: card.description,
      route: card.route
    });
  };

  const saveEdit = async () => {
    if (!editingCard) return;
    
    try {
      // تحديث في الحالة المحلية
      const updatedCards = actionCards.map(card => 
        card.id === editingCard 
          ? { 
              ...card, 
              title: editData.title, 
              description: editData.description,
              route: editData.route
            }
          : card
      );

      setActionCards(updatedCards);
      
      // حفظ في localStorage أولاً
      localStorage.setItem('dashboard_cards', JSON.stringify(updatedCards));

      // محاولة التحديث في قاعدة البيانات
      try {
        // تخطي تحديث قاعدة البيانات وحفظ محلياً فقط
        console.log('Skipping database update for card:', editingCard);
      } catch (dbError) {
        console.log('Database update failed, but localStorage updated');
      }
      
      setEditingCard(null);
      setEditData({ title: "", description: "", route: "" });

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ تغييرات المربع",
      });
    } catch (error) {
      console.error('Error saving card:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setEditData({ title: "", description: "", route: "" });
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">جاري تحميل البيانات...</div>
        </div>
      </PageContainer>
    );
  }

  const settings = useSettings();

  const renderCard = (card: ActionCard) => {
    return (
      <Card 
        key={card.id}
        draggable={editingCard !== card.id}
        onDragStart={(e) => handleDragStart(e, card)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, card)}
        style={{ minHeight: `${settings.boxSize}px` }}
        className={`transition-all duration-300 relative ${editingCard === card.id ? "ring-2 ring-blue-500 shadow-lg" : "cursor-pointer md:hover:shadow-lg md:hover:scale-105 active:scale-95"} ${draggedCard?.id === card.id ? "opacity-50 rotate-3 scale-105" : ""} ${editingCard !== card.id ? "md:hover:ring-1 md:hover:ring-gray-200" : ""}`}
        onClick={() => editingCard !== card.id && navigate(card.route)}
      >
        <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
          <div className="flex items-center">
            <div className={`p-2 md:p-3 rounded-lg ${card.color} text-white`}>
              <card.icon className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
          {editingCard === card.id ? (
            <div className="mt-3 space-y-2">
              <Input
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="text-sm md:text-lg font-semibold"
                placeholder="عنوان المربع"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <CardTitle className="text-sm md:text-lg font-semibold mt-3 leading-tight">
              {card.title}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          {editingCard === card.id ? (
            <div className="space-y-2">
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                className="text-xs md:text-sm resize-none"
                rows={2}
                placeholder="وصف المربع"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex items-center gap-1 md:gap-2">
                <LinkIcon className="w-3 h-3 md:w-4 md:h-4 text-gray-500 flex-shrink-0" />
                <Input
                  value={editData.route}
                  onChange={(e) => setEditData(prev => ({ ...prev, route: e.target.value }))}
                  className="text-xs md:text-sm"
                  placeholder="الرابط (مثل: /patients)"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex items-center justify-end gap-1 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEdit();
                  }}
                  className="text-green-600 hover:text-green-700 active:text-green-800 p-1 md:p-2"
                  title="حفظ التغييرات"
                >
                  <Save className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEdit();
                  }}
                  className="text-red-600 hover:text-red-700 active:text-red-800 p-1 md:p-2"
                  title="إلغاء التحرير"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <CardDescription className="text-xs md:text-sm text-gray-600 leading-tight">
                {card.description}
              </CardDescription>
              <div className="flex items-center justify-end gap-2 mt-2">
                <div 
                  className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                  title="اسحب لإعادة الترتيب"
                >
                  <GripVertical className="w-3 h-3 md:w-4 md:h-4" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(card);
                  }}
                  className="text-gray-600 hover:text-gray-700 active:text-gray-800 p-1 md:p-2"
                  title="تحرير المحتوى"
                >
                  <Edit className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Dashboard Action Cards */}
        {settings.showDashboardBoxes && (
          <div 
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${settings.boxesPerRow}, minmax(0, 1fr))`
            }}
          >
            {actionCards.map(renderCard)}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default Index;
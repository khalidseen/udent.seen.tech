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
  Users,
  Activity,
  Edit,
  Save,
  X,
  GripVertical,
  Link as LinkIcon,
  Pill,
  Receipt,
  Bell,
  Shield,
  Crown,
  CreditCard,
  UserCheck,
  ClipboardList,
  Box,
  TrendingUp,
  Boxes,
  ShoppingCart,
  Archive,
  Calendar as CalendarIcon,
  FileTextIcon,
  Globe,
  Share2,
  Copy,
  MessageCircle,
  Smartphone
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettingsHook";
import styles from "./Index.module.css";
import { printDashboardValidationReport, validateDashboardCards } from "@/utils/dashboardValidation";
// import { DashboardValidator } from "@/components/dashboard/DashboardValidator"; // تم نقله إلى الإعدادات
// import { SmartNotificationSystem } from "@/components/dashboard/SmartNotificationSystem"; // مُعطل مؤقتاً

interface ActionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  route: string;
  order_index?: number;
}

const defaultCards: ActionCard[] = [
  {
    id: "patients-list",
    title: "قائمة المرضى",
    description: "عرض وإدارة جميع المرضى المسجلين في النظام",
    icon: Users,
    color: "bg-emerald-500",
    route: "/patients",
    order_index: 1
  },
  {
    id: "appointments",
    title: "المواعيد",
    description: "عرض وإدارة مواعيد المرضى",
    icon: Calendar,
    color: "bg-blue-500",
    route: "/appointments",
    order_index: 2
  },
  {
    id: "new-appointment",
    title: "حجز موعد جديد",
    description: "حجز موعد جديد للمريض",
    icon: CalendarIcon,
    color: "bg-green-500",
    route: "/appointments/new",
    order_index: 3
  },
  {
    id: "public-booking",
    title: "رابط الحجز العام",
    description: "رابط مباشر للحجز عبر الإنترنت للمرضى",
    icon: Globe,
    color: "bg-lime-600",
    route: "/book",
    order_index: 4
  },
  {
    id: "medical-records",
    title: "السجلات الطبية",
    description: "إدارة السجلات الطبية للمرضى",
    icon: FileText,
    color: "bg-purple-500",
    route: "/medical-records",
    order_index: 5
  },
  {
    id: "dental-treatments",
    title: "العلاجات السنية",
    description: "إدارة العلاجات والإجراءات السنية",
    icon: Stethoscope,
    color: "bg-red-500",
    route: "/dental-treatments",
    order_index: 6
  },
  {
    id: "invoices",
    title: "الفواتير",
    description: "إدارة الفواتير والمدفوعات",
    icon: Receipt,
    color: "bg-yellow-500",
    route: "/invoices",
    order_index: 7
  },
  {
    id: "inventory",
    title: "المخزون",
    description: "إدارة المخزون والإمدادات الطبية",
    icon: Box,
    color: "bg-orange-500",
    route: "/inventory",
    order_index: 8
  },
  {
    id: "doctors",
    title: "إدارة الأطباء",
    description: "إدارة بيانات الأطباء والاختصاصات",
    icon: UserCheck,
    color: "bg-blue-600",
    route: "/doctors",
    order_index: 9
  },
  {
    id: "ai-insights",
    title: "التحليل الذكي",
    description: "تحليل ذكي وتشخيص متقدم بالذكاء الاصطناعي",
    icon: Brain,
    color: "bg-indigo-500",
    route: "/ai-insights",
    order_index: 10
  },
  {
    id: "medications",
    title: "الأدوية",
    description: "إدارة قاعدة بيانات الأدوية",
    icon: Pill,
    color: "bg-rose-500",
    route: "/medications",
    order_index: 11
  },
  {
    id: "prescriptions",
    title: "الوصفات الطبية",
    description: "إنشاء وإدارة الوصفات الطبية",
    icon: ClipboardList,
    color: "bg-emerald-600",
    route: "/prescriptions",
    order_index: 12
  },
  {
    id: "reports",
    title: "التقارير",
    description: "تقارير شاملة وإحصائيات مفصلة",
    icon: BarChart3,
    color: "bg-teal-500",
    route: "/reports",
    order_index: 13
  },
  {
    id: "notifications",
    title: "الإشعارات",
    description: "إدارة الإشعارات والتنبيهات",
    icon: Bell,
    color: "bg-lime-500",
    route: "/notifications",
    order_index: 14
  },
  {
    id: "users",
    title: "إدارة المستخدمين",
    description: "إدارة المستخدمين والصلاحيات",
    icon: Users,
    color: "bg-slate-500",
    route: "/users",
    order_index: 15
  },
  {
    id: "settings",
    title: "الإعدادات",
    description: "إعدادات النظام والتكوين العام",
    icon: Settings,
    color: "bg-gray-500",
    route: "/settings",
    order_index: 16
  }
];

function Index() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = useSettings(); // Move this before conditional rendering

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
    let mounted = true;
    
    const loadDashboardCards = async () => {
      try {
        // مسح البيانات القديمة لضمان ظهور التحديثات الجديدة
        localStorage.removeItem('dashboard_cards');
        
        if (mounted) {
          console.log('تم تحديث مربعات لوحة التحكم - استخدام البيانات الجديدة');
          // استخدام البيانات الجديدة مباشرة
          localStorage.setItem('dashboard_cards', JSON.stringify(defaultCards));
          setActionCards(defaultCards);
          
          // التحقق من صحة الربط للبطاقات الجديدة
          printDashboardValidationReport(defaultCards);
        }
      } catch (error) {
        console.error('Error loading dashboard cards:', error);
        if (mounted) {
          localStorage.setItem('dashboard_cards', JSON.stringify(defaultCards));
          setActionCards(defaultCards);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardCards();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once

  const loadDashboardCards = async () => {
    try {
      // أولاً محاولة التحميل من localStorage
      const savedCards = localStorage.getItem('dashboard_cards');
      if (savedCards) {
        const parsedCards = JSON.parse(savedCards);
        // دمج البطاقات الجديدة من defaultCards إذا لم تكن موجودة
        defaultCards.forEach((defCard) => {
          if (!parsedCards.some((c: ActionCard) => c.id === defCard.id)) {
            parsedCards.push(defCard);
          }
        });
        // تحديث الخصائص (color, icon) من defaultCards دائماً
        const loadedCards = parsedCards.map((item: Partial<ActionCard>) => {
          const defaultCard = defaultCards.find(card => card.id === item.id);
          return {
            ...item,
            color: defaultCard?.color || "bg-gray-500",
            icon: defaultCard?.icon || Settings
          } as ActionCard;
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
        const loadedCards = data.map((item: Partial<ActionCard>) => {
          const defaultCard = defaultCards.find(card => card.id === item.id);
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            route: item.route,
            color: defaultCard?.color || "bg-gray-500",
            icon: defaultCard?.icon || Settings,
            order_index: item.order_index
          } as ActionCard;
        });
        // دمج البطاقات الجديدة من defaultCards إذا لم تكن موجودة
        defaultCards.forEach((defCard) => {
          if (!loadedCards.some((c: ActionCard) => c.id === defCard.id)) {
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

  const shareBookingLink = () => {
    const currentDomain = window.location.origin;
    const bookingUrl = `${currentDomain}/book`;
    
    if (navigator.share) {
      navigator.share({
        title: 'رابط حجز المواعيد',
        text: 'احجز موعدك في العيادة مباشرة عبر هذا الرابط',
        url: bookingUrl
      }).catch((error) => {
        console.log('Error sharing:', error);
        copyToClipboard(bookingUrl);
      });
    } else {
      copyToClipboard(bookingUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط الحجز إلى الحافظة",
      });
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط الحجز إلى الحافظة",
      });
    });
  };

  const shareViaWhatsApp = () => {
    const currentDomain = window.location.origin;
    const bookingUrl = `${currentDomain}/book`;
    const message = `مرحباً! 🦷\n\nيمكنك حجز موعدك في العيادة مباشرة عبر هذا الرابط:\n${bookingUrl}\n\nنتطلع لخدمتك 😊`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaSMS = () => {
    const currentDomain = window.location.origin;
    const bookingUrl = `${currentDomain}/book`;
    const message = `احجز موعدك في العيادة عبر هذا الرابط: ${bookingUrl}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
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
        onClick={() => {
          if (editingCard !== card.id) {
            // التحقق من صحة الرابط قبل التنقل
            const validation = validateDashboardCards([card]);
            if (validation.valid.length > 0) {
              console.log(`✅ التنقل إلى: ${card.title} → ${card.route}`);
              navigate(card.route);
            } else {
              console.error(`❌ رابط خاطئ: ${card.title} → ${card.route}`);
              toast({
                title: "رابط خاطئ",
                description: `الرابط ${card.route} غير متاح`,
                variant: "destructive",
              });
            }
          }
        }}
      >
        {/* أزرار المشاركة في الزاوية العلوية اليسرى - خاصة بمربع الحجز العام */}
        {card.id === 'public-booking' && (
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                shareViaWhatsApp();
              }}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 active:text-green-800 p-1.5 rounded-lg transition-all duration-200 w-8 h-8"
              title="مشاركة عبر الواتساب"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                shareViaSMS();
              }}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 active:text-orange-800 p-1.5 rounded-lg transition-all duration-200 w-8 h-8"
              title="مشاركة عبر الرسائل النصية"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                shareBookingLink();
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:text-blue-800 p-1.5 rounded-lg transition-all duration-200 w-8 h-8"
              title="مشاركة رابط الحجز"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        )}
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
              <div className="flex items-center justify-end gap-3 mt-2">
                {/* أزرار التحكم - التعديل والسحب */}
                <div className="flex items-center gap-2">
                  <div 
                    className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 p-2 rounded-lg transition-colors"
                    title="اسحب لإعادة الترتيب"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(card);
                    }}
                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 active:text-gray-800 p-2 rounded-lg transition-all duration-200"
                    title="تحرير المحتوى"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
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
        {/* تم نقل مكون التحقق من صحة الربط إلى الإعدادات → فحص الروابط */}

        {/* Dashboard Action Cards */}
        {settings.showDashboardBoxes && (
          <div 
            className={`${styles.dashboardGrid} dashboard-grid-${settings.boxesPerRow}`}
          >
            {actionCards.map(renderCard)}
          </div>
        )}

        {/* نظام الإشعارات الذكي - مُعطل مؤقتاً */}
        {/* يمكن تفعيله عبر إلغاء التعليق أدناه */}
        {/* <SmartNotificationSystem /> */}
      </div>
    </PageContainer>
  );
}

export default Index;
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Trash2,
  Link as LinkIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  route: string;
  order_index?: number;
}

const availableRoutes = [
  { route: "/patients", name: "المرضى", icon: UserPlus, color: "bg-blue-500" },
  { route: "/appointments", name: "المواعيد", icon: Calendar, color: "bg-green-500" },
  { route: "/appointments/new", name: "موعد جديد", icon: Calendar, color: "bg-green-600" },
  { route: "/public-booking", name: "حجز عام", icon: LinkIcon, color: "bg-lime-600" },
  { route: "/medical-records", name: "السجلات الطبية", icon: FileText, color: "bg-purple-500" },
  { route: "/invoices", name: "الفواتير", icon: DollarSign, color: "bg-yellow-500" },
  { route: "/inventory", name: "المخزون", icon: Package, color: "bg-orange-500" },
  { route: "/treatments", name: "العلاجات", icon: Stethoscope, color: "bg-red-500" },
  { route: "/ai-insights", name: "الذكاء الاصطناعي", icon: Brain, color: "bg-indigo-500" },
  { route: "/settings", name: "الإعدادات", icon: Settings, color: "bg-gray-500" },
  { route: "/reports", name: "التقارير", icon: BarChart3, color: "bg-teal-500" },
  { route: "/notifications", name: "الإشعارات", icon: Bell, color: "bg-pink-500" },
  { route: "/payments", name: "المدفوعات", icon: DollarSign, color: "bg-emerald-500" },
  { route: "/doctors", name: "الأطباء", icon: Activity, color: "bg-cyan-500" },
  { route: "/prescriptions", name: "الوصفات", icon: FileText, color: "bg-violet-500" },
];

export function DashboardCardsSettings() {
  const { toast } = useToast();
  const [cards, setCards] = useState<ActionCard[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({
    title: "",
    description: "",
    route: "",
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  // تحميل البطاقات من localStorage
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = () => {
    try {
      const savedCards = localStorage.getItem('dashboard_cards');
      if (savedCards) {
        const parsedCards = JSON.parse(savedCards);
        setCards(parsedCards);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات الصناديق",
        variant: "destructive",
      });
    }
  };

  const saveCards = (updatedCards: ActionCard[]) => {
    try {
      localStorage.setItem('dashboard_cards', JSON.stringify(updatedCards));
      setCards(updatedCards);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ التغييرات بنجاح",
      });
    } catch (error) {
      console.error('Error saving cards:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive",
      });
    }
  };

  const updateCard = (id: string, field: string, value: string) => {
    const updatedCards = cards.map(card => 
      card.id === id ? { ...card, [field]: value } : card
    );
    
    // إذا كان الحقل route، نحتاج لتحديث الأيقونة واللون
    if (field === 'route') {
      const routeData = availableRoutes.find(r => r.route === value);
      if (routeData) {
        updatedCards.forEach(card => {
          if (card.id === id) {
            card.icon = routeData.icon;
            card.color = routeData.color;
          }
        });
      }
    }
    
    saveCards(updatedCards);
  };

  const addNewCard = () => {
    if (!newCard.title || !newCard.route) {
      toast({
        title: "بيانات ناقصة",
        description: "يجب ملء العنوان والرابط على الأقل",
        variant: "destructive",
      });
      return;
    }

    const routeData = availableRoutes.find(r => r.route === newCard.route);
    const newCardData: ActionCard = {
      id: Date.now().toString(),
      title: newCard.title,
      description: newCard.description,
      route: newCard.route,
      icon: routeData?.icon || Settings,
      color: routeData?.color || "bg-gray-500",
      order_index: cards.length + 1,
    };

    const updatedCards = [...cards, newCardData];
    saveCards(updatedCards);
    setNewCard({ title: "", description: "", route: "" });
    setIsAddingNew(false);
  };

  const deleteCard = (id: string) => {
    const updatedCards = cards.filter(card => card.id !== id);
    saveCards(updatedCards);
  };

  const moveCard = (id: string, direction: 'up' | 'down') => {
    const currentIndex = cards.findIndex(card => card.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= cards.length) return;

    const updatedCards = [...cards];
    [updatedCards[currentIndex], updatedCards[newIndex]] = 
    [updatedCards[newIndex], updatedCards[currentIndex]];

    // تحديث order_index
    updatedCards.forEach((card, index) => {
      card.order_index = index + 1;
    });

    saveCards(updatedCards);
  };

  const getRouteDisplayName = (route: string) => {
    const routeData = availableRoutes.find(r => r.route === route);
    return routeData ? routeData.name : route;
  };

  const getRouteIcon = (route: string) => {
    const routeData = availableRoutes.find(r => r.route === route);
    return routeData?.icon || Settings;
  };

  const getRouteColor = (route: string) => {
    const routeData = availableRoutes.find(r => r.route === route);
    return routeData?.color || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إدارة صناديق لوحة القيادة</CardTitle>
          <CardDescription>
            يمكنك تخصيص الصناديق الظاهرة في لوحة القيادة الرئيسية، تغيير أسمائها، أوصافها، وروابطها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">الصناديق الحالية ({cards.length})</h3>
            <Button 
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة صندوق جديد
            </Button>
          </div>

          {/* جدول الصناديق */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الترتيب</TableHead>
                  <TableHead>الأيقونة</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الرابط</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card, index) => {
                  const IconComponent = card.icon;
                  return (
                    <TableRow key={card.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">#{index + 1}</span>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveCard(card.id, 'up')}
                              disabled={index === 0}
                              className="h-6 w-6 p-0"
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveCard(card.id, 'down')}
                              disabled={index === cards.length - 1}
                              className="h-6 w-6 p-0"
                            >
                              ↓
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`p-2 rounded-lg ${card.color} text-white w-fit`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {editingId === card.id ? (
                          <Input
                            value={card.title}
                            onChange={(e) => updateCard(card.id, 'title', e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <span className="font-medium">{card.title}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        {editingId === card.id ? (
                          <Textarea
                            value={card.description}
                            onChange={(e) => updateCard(card.id, 'description', e.target.value)}
                            rows={2}
                            className="w-full resize-none"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{card.description}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {editingId === card.id ? (
                          <Select
                            value={card.route}
                            onValueChange={(value) => updateCard(card.id, 'route', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoutes.map((route) => (
                                <SelectItem key={route.route} value={route.route}>
                                  <div className="flex items-center gap-2">
                                    <route.icon className="w-4 h-4" />
                                    <span>{route.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {route.route}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {getRouteDisplayName(card.route)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{card.route}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {editingId === card.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingId(null)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingId(null)}
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingId(card.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCard(card.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* نموذج إضافة صندوق جديد */}
          {isAddingNew && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">إضافة صندوق جديد</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">العنوان</label>
                  <Input
                    value={newCard.title}
                    onChange={(e) => setNewCard(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="اسم الصندوق"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">الوصف</label>
                  <Textarea
                    value={newCard.description}
                    onChange={(e) => setNewCard(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف قصير للصندوق"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">الرابط والأيقونة</label>
                  <Select
                    value={newCard.route}
                    onValueChange={(value) => setNewCard(prev => ({ ...prev, route: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القسم أو الصفحة" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoutes.map((route) => (
                        <SelectItem key={route.route} value={route.route}>
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${route.color} text-white`}>
                              <route.icon className="w-3 h-3" />
                            </div>
                            <span>{route.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {route.route}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewCard({ title: "", description: "", route: "" });
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button onClick={addNewCard}>
                    إضافة الصندوق
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
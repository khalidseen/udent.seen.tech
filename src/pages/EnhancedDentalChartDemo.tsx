// 🦷 Enhanced Dental Chart Demo Page
// صفحة تجريبية لنظام مخطط الأسنان المحسن

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EnhancedDentalChart from '@/components/dental/EnhancedDentalChart';
import { ToothNumberingSystem } from '@/types/dentalChart';
import {
  ArrowLeft,
  BookOpen,
  Camera,
  Star,
  Sparkles,
  CheckCircle,
  Users,
  Globe,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EnhancedDentalChartDemoProps {
  patientId: string;
  patientName?: string;
}

const EnhancedDentalChartDemo: React.FC<EnhancedDentalChartDemoProps> = ({
  patientId,
  patientName = "مريض تجريبي"
}) => {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const navigate = useNavigate();

  const features = [
    {
      icon: <Camera className="w-6 h-6 text-green-600" />,
      title: "رفع صور الأسنان",
      description: "رفع صورة عالية الجودة لكل سن مع ضغط تلقائي وعرض مباشر"
    },
    {
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      title: "5 تبويبات شاملة",
      description: "التشخيص، الأسطح، القياسات السريرية، الجذور، الملاحظات"
    },
    {
      icon: <Globe className="w-6 h-6 text-purple-600" />,
      title: "أنظمة ترقيم متعددة",
      description: "دعم FDI، Universal، Palmer مع ألوان WHO المعتمدة"
    },
    {
      icon: <Shield className="w-6 h-6 text-orange-600" />,
      title: "حفظ تلقائي",
      description: "حفظ فوري للبيانات مع نسخ احتياطية محلية"
    },
    {
      icon: <Star className="w-6 h-6 text-yellow-600" />,
      title: "تصدير متقدم",
      description: "تصدير البيانات بصيغ JSON، CSV، PDF مع تقارير مفصلة"
    },
    {
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      title: "واجهة احترافية",
      description: "تصميم حديث وسهل الاستخدام مع دعم اللغة العربية"
    }
  ];

  const benefits = [
    "📊 إحصائيات شاملة ومؤشرات الأداء",
    "🔍 بحث متقدم وفلترة ذكية",
    "⚡ أداء سريع مع تحديثات فورية",
    "🌐 متوافق مع المعايير العالمية WHO",
    "💾 نظام نسخ احتياطية موثوق",
    "🎨 تخصيص الألوان والأولويات",
    "📱 تصميم متجاوب لجميع الشاشات",
    "🔒 أمان عالي وحماية البيانات"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* الهيدر */}
        <Card className="border-none shadow-lg bg-gradient-to-r from-blue-600 to-green-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  العودة
                </Button>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    🦷 نظام مخطط الأسنان المحسن
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Sparkles className="w-3 h-3 mr-1" />
                      الإصدار المتقدم
                    </Badge>
                  </CardTitle>
                  <p className="text-blue-100 mt-1">
                    نظام متطور لإدارة وتتبع حالة الأسنان مع رفع الصور والتشخيص الشامل
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold">{patientName}</div>
                <div className="text-blue-200 text-sm">رقم المريض: {patientId}</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* المميزات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* النظام التجريبي */}
        <Card className="shadow-xl border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              النظام التفاعلي - جرب الآن!
            </CardTitle>
            <p className="text-sm text-gray-600">
              انقر على أي سن لفتح النافذة الشاملة مع 5 تبويبات متخصصة ورفع الصور
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <EnhancedDentalChart
              patientId={patientId}
              onToothSelect={(tooth) => setSelectedTooth(tooth)}
              selectedTooth={selectedTooth || undefined}
            />
          </CardContent>
        </Card>

        {/* الفوائد والمزايا */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* قائمة الفوائد */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Star className="w-5 h-5" />
                المزايا والفوائد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition-colors">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* الإحصائيات السريعة */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <BookOpen className="w-5 h-5" />
                نظرة سريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">5</div>
                    <div className="text-xs text-blue-700">تبويبات متخصصة</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">32</div>
                    <div className="text-xs text-green-700">سن مدعوم</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">3</div>
                    <div className="text-xs text-purple-700">أنظمة ترقيم</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">∞</div>
                    <div className="text-xs text-orange-700">صور مدعومة</div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold">🏆 معايير عالمية</div>
                    <div className="text-sm opacity-90">متوافق مع معايير WHO الطبية</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* دعوة للعمل */}
        <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-xl">
          <CardContent className="p-6 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-2">
                🚀 ابدأ استخدام النظام المحسن الآن!
              </h3>
              <p className="text-green-100 mb-4">
                اكتشف قوة النظام المتطور لإدارة مخططات الأسنان مع رفع الصور والتشخيص الشامل
              </p>
              <div className="flex justify-center gap-3">
                <Button 
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    const firstTooth = "11";
                    setSelectedTooth(firstTooth);
                  }}
                  className="bg-white text-green-600 hover:bg-gray-100"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  جرب رفع صورة
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/patients')}
                  className="border-white text-white hover:bg-white hover:text-green-600"
                >
                  <Users className="w-4 h-4 mr-2" />
                  عودة للمرضى
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedDentalChartDemo;

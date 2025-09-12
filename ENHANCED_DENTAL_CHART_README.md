# 🦷 نظام مخطط الأسنان المحسن - Enhanced Dental Chart System

## 📋 نظرة عامة

نظام مخطط الأسنان المحسن هو حل شامل لإدارة سجلات الأسنان في العيادات الطبية. يتضمن النظام واجهة تفاعلية متطورة مع 5 تبويبات متخصصة لكل سن، ونظام رفع الصور، ومعايير منظمة الصحة العالمية.

## ✨ المزايا الرئيسية

### 🎯 نظام التبويبات الخمسة
- **التشخيص**: تسجيل الحالة الأساسية، الأولوية، كود ICD-10
- **الأسطح**: تفصيل حالة كل سطح من أسطح السن
- **القياسات السريرية**: عمق الجيوب، نزيف اللثة، الحركة
- **الجذور**: عدد الجذور، علاج العصب، حالة كل جذر
- **الملاحظات**: خطة العلاج، المتابعة، تعليقات إضافية

### 📸 نظام الصور المتطور
- رفع الصور بالسحب والإفلات
- ضغط تلقائي للصور
- معاينة فورية قبل الحفظ
- دعم تنسيقات متعددة (JPEG, PNG, WebP)
- تخزين آمن في Supabase Storage

### 🌍 المعايير الدولية
- ألوان منظمة الصحة العالمية (WHO Colors)
- أكواد ICD-10 للحالات السنية
- أنظمة ترقيم متعددة (FDI, Universal, Palmer)
- متوافق مع المعايير الطبية الدولية

### 📊 الإحصائيات والتقارير
- إحصائيات شاملة لحالة الأسنان
- تصدير البيانات (JSON, CSV, PDF قريباً)
- تتبع الحالات الطارئة
- مؤشرات الأداء والجودة

## 🏗️ البنية التقنية

### المكونات الأساسية

```
src/
├── components/dental/
│   ├── EnhancedDentalChart.tsx    # المكون الرئيسي
│   ├── ToothModal.tsx             # نافذة السن (5 تبويبات)
│   └── ImageUpload.tsx            # رفع الصور
├── hooks/
│   └── useDentalChartEnhanced.ts  # إدارة الحالة والبيانات
├── types/
│   ├── dentalChart.ts             # أنواع UI
│   └── dentalChartDatabase.ts     # أنواع قاعدة البيانات
└── pages/
    └── EnhancedDentalChartDemo.tsx # صفحة التجريب
```

### قاعدة البيانات

```sql
-- الجداول الأساسية
tooth_records              # سجلات الأسنان الرئيسية
tooth_root_conditions      # تفاصيل حالة الجذور
tooth_treatment_history    # تاريخ العلاجات
tooth_images              # صور الأسنان
diagnosis_templates       # قوالب التشخيص الجاهزة
```

## 🚀 التثبيت والإعداد

### 1. إعداد قاعدة البيانات

```bash
# تشغيل المايجريشن
node run-dental-migration.js

# أو يدوياً
npx supabase db push
```

### 2. إعداد Storage

```bash
# إنشاء bucket للصور
npx supabase storage buckets create dental-images --public
```

### 3. تشغيل النظام

```bash
npm run dev
```

## 📝 استخدام النظام

### إنشاء مخطط أسنان جديد

```tsx
import EnhancedDentalChart from '@/components/dental/EnhancedDentalChart';

function PatientChart() {
  return (
    <EnhancedDentalChart
      patientId="patient-123"
      clinicId="clinic-456"
      numberingSystem={ToothNumberingSystem.FDI}
    />
  );
}
```

### استخدام Hook مخصص

```tsx
import { useDentalChartEnhanced } from '@/hooks/useDentalChartEnhanced';

function MyComponent() {
  const {
    records,
    statistics,
    saveToothRecord,
    uploadToothImage,
    exportData
  } = useDentalChartEnhanced({
    patientId: 'patient-123',
    clinicId: 'clinic-456'
  });

  return (
    // واجهتك المخصصة
  );
}
```

## 🎨 التخصيص

### ألوان الحالات (WHO Standards)

```typescript
const WHO_COLORS = {
  sound: '#22c55e',      // أخضر - سليم
  decay: '#ef4444',      // أحمر - تسوس
  filled: '#3b82f6',     // أزرق - محشو
  missing: '#6b7280',    // رمادي - مفقود
  // ... المزيد
};
```

### إضافة حالات جديدة

```typescript
enum ConditionType {
  SOUND = 'sound',
  DECAY = 'decay',
  FILLED = 'filled',
  CUSTOM_CONDITION = 'custom_condition'  // إضافة جديدة
}
```

## 📊 الإحصائيات المتاحة

- إجمالي الأسنان: 32
- الأسنان المسجلة: عدد الأسنان التي لها سجلات
- الأسنان السليمة: حالة صحية جيدة
- الأسنان المتسوسة: تحتاج علاج
- الأسنان المحشوة: تم علاجها
- الأسنان المفقودة: غير موجودة
- الحالات الطارئة: تحتاج تدخل فوري
- الأسنان بصور: لها صور مرفقة

## 🔒 الأمان والصلاحيات

- Row Level Security (RLS) مفعل
- صلاحيات على مستوى العيادة
- تشفير البيانات الحساسة
- حماية رفع الصور
- سجل العمليات والتغييرات

## 🌐 الدعم اللغوي

- واجهة باللغة العربية
- دعم النصوص من اليمين لليسار (RTL)
- مصطلحات طبية دقيقة
- ترجمة شاملة للمكونات

## 🔧 المشاكل الشائعة

### خطأ في تحميل البيانات
```bash
# التحقق من اتصال قاعدة البيانات
npx supabase status
```

### مشاكل رفع الصور
```bash
# التحقق من إعدادات Storage
npx supabase storage ls dental-images
```

### مشاكل الصلاحيات
```sql
-- إعادة تطبيق السياسات
DROP POLICY IF EXISTS "Users can view tooth records from their clinic" ON tooth_records;
-- ثم إعادة إنشائها من ملف SQL
```

## 📈 التطوير المستقبلي

- [ ] تصدير PDF متقدم
- [ ] تقارير تحليلية
- [ ] تكامل مع أنظمة الأشعة
- [ ] ذكاء اصطناعي للتشخيص
- [ ] تطبيق الهاتف المحمول
- [ ] تزامن الصور مع الأجهزة

## 💡 المساهمة

نرحب بالمساهمات! يرجى:
1. Fork المشروع
2. إنشاء branch للميزة الجديدة
3. كتابة الاختبارات
4. إرسال Pull Request

## 📞 الدعم الفني

للحصول على الدعم:
- فتح issue في GitHub
- مراجعة الوثائق التقنية
- الانضمام لمجتمع المطورين

---

## 📄 الترخيص

MIT License - راجع ملف LICENSE للتفاصيل

---

**🦷 نظام مخطط الأسنان المحسن - صُنع بحب للمجتمع الطبي العربي**

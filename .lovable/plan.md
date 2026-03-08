

# خطة: لوحة تحكم مركزية متعددة العيادات في /integrations

## الهدف
تحويل صفحة التكاملات إلى مركز إدارة مركزي يتيح للمدير (super_admin/admin) رؤية جميع العيادات المربوطة، مع تحليلات مجمّعة وإمكانية التحكم عن بُعد بكل عيادة.

## المكونات الجديدة

### 1. جدول `clinic_settings` (Migration)
```sql
CREATE TABLE public.clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL UNIQUE,
  currency TEXT DEFAULT 'IQD',
  language TEXT DEFAULT 'ar',
  time_format TEXT DEFAULT '24',
  timezone TEXT DEFAULT 'Asia/Baghdad',
  custom_preferences JSONB DEFAULT '{}',
  remote_access_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
```
مع RLS policies تسمح للمالك والمدير بالقراءة/الكتابة.

### 2. مكون `MultiClinicDashboard.tsx` (جديد)
- **قائمة العيادات**: عرض كل العيادات المتاحة مع حالة كل عيادة (نشطة/غير نشطة)، عدد المرضى، المواعيد، الإيرادات
- **تحليلات مجمّعة**: رسوم بيانية تجمع بيانات كل العيادات (إجمالي المرضى، الإيرادات الكلية، المواعيد)
- **مقارنة بين العيادات**: جدول مقارنة أداء العيادات

### 3. مكون `ClinicRemoteControl.tsx` (جديد)
- **تبديل سريع**: اختيار عيادة من القائمة للتحكم بها
- **إعدادات العيادة**: تعديل تفضيلات العيادة عن بُعد (العملة، اللغة، الوقت)
- **إجراءات سريعة**: تفعيل/إيقاف العيادة، تجديد الاشتراك، إدارة المستخدمين

### 4. مكون `AggregatedAnalytics.tsx` (جديد)
- تحليلات مجمّعة عبر كل العيادات
- مخططات: إيرادات حسب العيادة، مرضى حسب العيادة، مواعيد حسب العيادة
- تقارير مقارنة شهرية

### 5. Hook `useMultiClinicAnalytics.ts` (جديد)
يستخدم `get_clinic_stats_batch()` الموجود فعلاً + يجلب تفاصيل إضافية من كل عيادة.

## التعديلات على الملفات الحالية

### `src/pages/Integrations.tsx`
- إضافة تبويب "إدارة العيادات" و "تحليلات مجمّعة" للمستخدمين ذوي صلاحية الوصول المتعدد
- إظهار التبويبات الجديدة فقط إذا كان `accessibleClinics.length > 1` أو المستخدم admin

### `src/hooks/useClinicContext.ts`
- إضافة دالة `updateClinicSettings` لتحديث إعدادات عيادة معينة عن بُعد

## الهيكل النهائي للتبويبات

```text
التكاملات
├── نظرة عامة (موجود)
├── إدارة العيادات (جديد) ← قائمة العيادات + حالتها + تحكم عن بُعد
├── تحليلات مجمّعة (جديد) ← رسوم بيانية مقارنة لكل العيادات
├── التحليلات (موجود - للعيادة الحالية)
├── مفاتيح API (موجود)
├── السجلات (موجود)
└── التوثيق (موجود)
```

## Database Migration
1. إنشاء جدول `clinic_settings`
2. إضافة RLS policies
3. إنشاء دالة `get_all_clinics_analytics()` (security definer) تجلب تحليلات مجمّعة لكل العيادات المتاحة للمستخدم

## الأمان
- التحكم عن بُعد متاح فقط لـ admin/owner عبر `has_clinic_permission`
- التحليلات المجمّعة تعتمد على `get_user_accessible_clinics()` الموجود فعلاً
- RLS على `clinic_settings` يمنع الوصول غير المصرح


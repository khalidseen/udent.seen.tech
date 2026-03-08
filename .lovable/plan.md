

# خطة: تطبيق إعدادات العملة والوقت واللغة على كل الصفحات

## المشكلة الحالية
1. **اللغة**: موجودة كـ context لكن معظم الصفحات تستخدم نصوص عربية ثابتة (hardcoded) بدلاً من `t()` — التبديل للإنجليزية لا يغير شيئاً فعلياً
2. **الوقت**: التواريخ تستخدم locales ثابتة (`ar-SA`, `ar-IQ`, `en-US`) بدلاً من الاعتماد على اللغة المختارة
3. **العملة**: `formatAmount` يستخدم locale ثابت `ar-IQ` بدلاً من اللغة المختارة

## الحل

### 1. إنشاء hook مركزي للتنسيق `useFormatters`
ملف جديد `src/hooks/useFormatters.ts` يوفر:
- `formatDate(date)` — يستخدم اللغة المختارة تلقائياً
- `formatTime(date)` — يستخدم اللغة المختارة تلقائياً  
- `formatDateTime(date)` — تاريخ + وقت
- `locale` — الـ locale المناسب للغة (`ar-IQ` أو `en-US`)

### 2. تحديث `CurrencyContext` ليستخدم اللغة المختارة
- جعل `formatAmount` يستخدم `language` من `LanguageContext` لتحديد الـ locale

### 3. تحديث `DateTime` في الشريط العلوي
- استخدام `useFormatters` بدلاً من locale ثابت

### 4. إضافة إعدادات اللغة والوقت في صفحة الإعدادات
- إضافة قسم اللغة (عربي/إنجليزي) في `InterfaceSettings`
- إضافة قسم تنسيق الوقت (12 ساعة / 24 ساعة) في `InterfaceSettings`

### 5. تحديث الصفحات الرئيسية لاستخدام `useFormatters`
تحديث استخدامات `toLocaleDateString` و `toLocaleTimeString` المباشرة في:
- `ClinicReports.tsx`
- `ViewPrescriptionDialog.tsx`
- `SystemHealthMonitor.tsx`
- `FinancialReports.tsx`
- `SmartNotificationSystem.tsx`
- `PhotoGalleryDialog.tsx`
- `OverviewTab.tsx`
- `AIAnalysisPanel.tsx`
- `SmartDiagnosisEngine.tsx`
- وغيرها (~37 ملف)

## الملفات
1. **جديد**: `src/hooks/useFormatters.ts` — hook مركزي
2. **تعديل**: `src/contexts/CurrencyContext.tsx` — ربط بـ language
3. **تعديل**: `src/components/layout/DateTime.tsx` — استخدام useFormatters
4. **تعديل**: `src/components/settings/InterfaceSettings.tsx` — إضافة أقسام اللغة والوقت
5. **تعديل**: ~37 ملف — استبدال locale الثابت بـ `useFormatters`

## التفاصيل التقنية
- `useFormatters` يقرأ `language` من `useLanguage()` ويحوله لـ locale مناسب
- إعداد الوقت (12/24 ساعة) يُحفظ في `localStorage` ويُدار عبر `SettingsContext`
- لا حاجة لتعديل قاعدة البيانات


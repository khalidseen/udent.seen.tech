# 🦷 UDent Dental System - دليل التنصيب

## المتطلبات الأساسية

| المتطلب | الحد الأدنى |
|---------|------------|
| Supabase Project | مشروع جديد |
| Node.js | v18+ |
| npm/yarn/bun | أي مدير حزم |

---

## الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com) وأنشئ حساباً
2. أنشئ مشروعاً جديداً واختر المنطقة الأقرب
3. احفظ بيانات المشروع:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: مفتاح العميل العام
   - **Service Role Key**: المفتاح الخاص (لا تشاركه!)

---

## الخطوة 2: إعداد قاعدة البيانات

افتح **SQL Editor** في لوحة تحكم Supabase ونفّذ الملفات بالترتيب:

```bash
# الترتيب مهم!
1. setup/01_schema.sql      ← إنشاء الجداول
2. setup/02_functions.sql    ← الدوال والـ Triggers
3. setup/03_rls_policies.sql ← سياسات الأمان
4. setup/04_seed_data.sql    ← البيانات الأولية
```

> ⚠️ نفّذ كل ملف بالكامل وتأكد من عدم وجود أخطاء قبل الانتقال للملف التالي.

---

## الخطوة 3: إعداد التطبيق

### 3.1 نسخ الكود

```bash
git clone <repository-url> udent-clinic
cd udent-clinic
npm install
```

### 3.2 إعداد المتغيرات البيئية

أنشئ ملف `.env` في جذر المشروع:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 3.3 تحديث ملف العميل

في `src/integrations/supabase/client.ts`، تأكد من أن المتغيرات تشير لمشروعك:

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

### 3.4 تشغيل التطبيق محلياً

```bash
npm run dev
```

---

## الخطوة 4: إنشاء أول مستخدم وعيادة

### 4.1 إنشاء مستخدم

- من لوحة Supabase → Authentication → Users → Invite User
- أو عبر صفحة التسجيل في التطبيق

### 4.2 إنشاء عيادة

بعد تسجيل الدخول، يمكنك إنشاء عيادة عبر:

**الطريقة 1: SQL Editor**
```sql
-- استبدل USER_ID بمعرف المستخدم الفعلي
SELECT create_clinic_with_owner(
  'اسم العيادة',           -- clinic_name
  'LIC-001',              -- license_number
  '+964XXXXXXXXX',        -- phone
  'clinic@example.com',   -- email
  'العنوان',              -- address
  'بغداد'                 -- city
);
```

**الطريقة 2: لوحة إنشاء العيادة** (في /integrations → إدارة العيادات)

---

## الخطوة 5: النشر (Deploy)

### Lovable (الأسهل)
1. ارفع المشروع إلى Lovable
2. اربط Supabase Project
3. انشر تلقائياً

### Vercel/Netlify
```bash
npm run build
# ارفع مجلد dist/ إلى منصة الاستضافة
```

### Docker (للخوادم الخاصة)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

---

## الخطوة 6: إعداد Storage (اختياري)

لتفعيل رفع الصور والملفات:

```sql
-- إنشاء Bucket للصور الطبية
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-images', 'medical-images', false);

-- سياسة رفع الملفات
CREATE POLICY "Clinic users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'medical-images');

CREATE POLICY "Clinic users can view" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'medical-images');
```

---

## هيكل المجلدات

```
udent-clinic/
├── setup/                   ← سكربتات التنصيب
│   ├── 01_schema.sql
│   ├── 02_functions.sql
│   ├── 03_rls_policies.sql
│   ├── 04_seed_data.sql
│   └── INSTALL_GUIDE.md     ← هذا الملف
├── src/
│   ├── components/          ← المكونات
│   ├── pages/               ← الصفحات
│   ├── hooks/               ← الـ Hooks
│   └── integrations/        ← Supabase Client
├── supabase/
│   ├── config.toml          ← إعدادات Supabase
│   ├── functions/            ← Edge Functions
│   └── migrations/           ← الترحيلات
└── .env                     ← المتغيرات البيئية
```

---

## استنساخ عيادة جديدة (Checklist)

- [ ] إنشاء مشروع Supabase جديد
- [ ] تنفيذ سكربتات SQL بالترتيب (01 → 04)
- [ ] نسخ الكود وتعديل `.env`
- [ ] إنشاء مستخدم Admin
- [ ] إنشاء العيادة عبر `create_clinic_with_owner()`
- [ ] نشر التطبيق
- [ ] إعداد Storage (اختياري)
- [ ] إعداد Edge Functions (إن وجدت)

---

## الدعم والمساعدة

- **المشاكل الشائعة**: تحقق من RLS policies إذا ظهر خطأ "row-level security"
- **فقدان البيانات**: تأكد من `clinic_id` في كل الاستعلامات
- **الأداء**: فعّل الفهارس على الأعمدة المستخدمة في البحث

---

*آخر تحديث: مارس 2026*



# خطة المصادقة الثنائية عبر واتساب (WhatsApp OTP 2FA)

## ملخص

تنفيذ نظام تحقق ثنائي يرسل رمز OTP عبر واتساب بعد تسجيل الدخول بنجاح، مع خيار تذكر الجهاز لمدة 30 يوم.

---

## الملاحظات المهمة

- جدول `profiles` لا يحتوي حالياً على عمود `whatsapp_number` — يجب إضافته.
- النظام يستخدم `whatsapp_config` لكل عيادة مع Meta Graph API — سنستخدم نفس البنية.
- مكون `InputOTP` موجود بالفعل ويمكن استخدامه مباشرة.

---

## التغييرات المطلوبة

### 1. تغييرات قاعدة البيانات (3 migrations)

**Migration 1**: إضافة عمود `whatsapp_number` لجدول `profiles`
```sql
ALTER TABLE public.profiles ADD COLUMN whatsapp_number text;
```

**Migration 2**: إنشاء جدول `otp_codes`
- `id`, `user_id` (FK → auth.users, ON DELETE CASCADE), `code` (text, مشفر), `expires_at` (timestamptz), `verified` (boolean default false), `attempts` (integer default 0), `created_at`
- RLS: المستخدم يقرأ سجلاته فقط
- دالة تنظيف تلقائي للرموز المنتهية

**Migration 3**: إنشاء جدول `trusted_devices`
- `id`, `user_id` (FK → auth.users, ON DELETE CASCADE), `device_hash` (text), `expires_at` (timestamptz, 30 يوم), `created_at`
- RLS: المستخدم يقرأ/يحذف أجهزته فقط
- فهرس فريد على `(user_id, device_hash)`

### 2. Edge Functions (2 دوال جديدة)

**`send-otp-whatsapp`** (`verify_jwt = false`, يتحقق يدوياً):
- يستقبل `user_id` بعد التحقق من JWT
- يجلب `whatsapp_number` من `profiles` و `clinic_id`
- يجلب إعدادات واتساب من `whatsapp_config` للعيادة
- يولّد رمز عشوائي 6 أرقام، يحفظه مشفراً في `otp_codes` (بعد حذف الرموز السابقة)
- يرسل الرمز كرسالة نصية عبر Meta Graph API
- يحد المحاولات: max 3 رموز في 15 دقيقة

**`verify-otp`** (`verify_jwt = false`, يتحقق يدوياً):
- يستقبل `code` + `device_hash` (اختياري) + `remember_device`
- يتحقق من الرمز وصلاحيته (5 دقائق) وعدد المحاولات (max 3)
- إذا صحيح: `verified = true`
- إذا `remember_device = true`: يحفظ `device_hash` في `trusted_devices` (30 يوم)
- يعيد `{ verified: true }` أو `{ verified: false, error: "..." }`

### 3. تعديلات الواجهة الأمامية

**`src/lib/deviceFingerprint.ts`** (ملف جديد):
- دالة `generateDeviceHash()`: تبني hash من `navigator.userAgent` + دقة الشاشة + اللغة + timezone → SHA-256

**`src/contexts/AuthContext.tsx`**:
- إضافة حالات: `needsOtp`, `otpUserId`, `otpPending`
- تعديل `signIn`: بعد النجاح، يفحص `trusted_devices` عبر Supabase query. إذا غير موثوق ولديه `whatsapp_number` → يضبط `needsOtp = true` ويستدعي `send-otp-whatsapp`. إذا لا يوجد `whatsapp_number` → دخول مباشر.
- إضافة دالة `verifyOtp(code, rememberDevice)` و `resendOtp()`
- تحديث `AuthContextType` بالحالات والدوال الجديدة

**`src/pages/Auth.tsx`**:
- إضافة حالة OTP: عندما `needsOtp = true`، يعرض شاشة إدخال OTP بدلاً من نموذج الدخول
- شاشة OTP تتضمن:
  - مكون `InputOTP` (6 خانات) من المكونات الموجودة
  - عداد تنازلي (5 دقائق) لصلاحية الرمز
  - زر "إعادة إرسال" (مع cooldown 60 ثانية)
  - Checkbox "تذكر هذا الجهاز لمدة 30 يوم"
  - رسالة توضح أن الرمز أُرسل لرقم الواتساب (مع إخفاء جزء من الرقم)

**`supabase/config.toml`**:
- إضافة الدالتين الجديدتين مع `verify_jwt = false`

### 4. التدفق النهائي

```text
بريد + كلمة مرور → Supabase signIn
  ├─ فشل → رسالة خطأ
  └─ نجاح → فحص whatsapp_number في profiles
       ├─ لا يوجد رقم → دخول مباشر (بدون OTP)
       └─ يوجد رقم → فحص trusted_devices
            ├─ جهاز موثوق → دخول مباشر
            └─ غير موثوق → إرسال OTP → شاشة إدخال
                 ├─ رمز صحيح → (تذكر؟) → دخول
                 └─ رمز خاطئ → رسالة خطأ (max 3 محاولات)
```

### 5. الأمان
- الرموز تنتهي بعد 5 دقائق
- 3 محاولات كحد أقصى لكل رمز
- 3 رموز كحد أقصى كل 15 دقيقة
- تنظيف تلقائي للرموز المنتهية
- بصمة الجهاز مبنية على عوامل متعددة (لا يمكن نسخها بسهولة)


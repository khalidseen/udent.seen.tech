

# تحليل مشكلة البطء والصفحات البيضاء

## السبب الجذري: `useAuth` ليس Context — يتكرر 26 مرة

`useAuth()` هو hook عادي وليس context. كل مكون يستدعيه يُنشئ:
- اشتراك `onAuthStateChange` مستقل
- استدعاء `supabase.auth.getSession()` مستقل  
- حالة `loading/initialized` مستقلة

النتيجة: عند فتح أي صفحة، يتم إنشاء 5-10 اشتراكات auth متزامنة، كل واحد يُعيد render المكون → **صفحات بيضاء أثناء التحميل المتعدد**.

الدليل من console logs: `🔐 Initializing auth...` يظهر 5 مرات و `Protected Route State` يظهر 10+ مرات عند تحميل صفحة واحدة.

## مشاكل إضافية

1. **`database-init.ts` يُنفذ عند import** (سطر 44) — استدعاء Supabase قبل أن يكون المستخدم جاهزاً
2. **console.log في SimpleProtectedRoute** يُنفذ في كل render (والـ renders كثيرة بسبب مشكلة useAuth)
3. **`offlineDB.init()` في App.tsx** يُنفذ عند تحميل الوحدة

## خطة الإصلاح

### 1. تحويل `useAuth` إلى AuthContext (الإصلاح الأساسي)
- إنشاء `src/contexts/AuthContext.tsx` يحتوي على `AuthProvider` مع اشتراك واحد فقط
- تحويل `useAuth()` إلى قراءة من Context بدلاً من إنشاء state جديد كل مرة
- إضافة `AuthProvider` في `AppProviders.tsx` (قبل باقي الـ Providers)

### 2. إزالة التهيئة على مستوى الوحدة في `database-init.ts`
- حذف السطرين 44-46 (الاستدعاء التلقائي عند الاستيراد)
- الإبقاء على الاستدعاء المؤجل في `main.tsx` فقط

### 3. إزالة console.log من SimpleProtectedRoute
- حذف 3 أسطر `console.log` التي تُنفذ في كل render

### 4. تأجيل `offlineDB.init()` 
- نقله من مستوى الوحدة إلى داخل `useEffect` أو `window.addEventListener('load')`

## النتيجة المتوقعة
- اشتراك auth واحد بدلاً من 5-10
- renders أقل بنسبة ~80%
- اختفاء الصفحات البيضاء عند التنقل
- تحميل أسرع بشكل ملحوظ


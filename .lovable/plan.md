

# ملف ذاكرة التطبيق + قائمة فحص شاملة لكل الصفحات

## ما سيتم إنشاؤه

### 1. ملف ذاكرة المشروع `PROJECT_MEMORY.md`
ملف مرجعي في جذر المشروع يحتوي على:
- **هيكل التطبيق**: كل الصفحات مع مساراتها وحالتها
- **سجل التعديلات**: ما تم إصلاحه حتى الآن (إحصائيات المرضى، AuthContext، أزرار التعديل...)
- **قائمة المشاكل المعروفة**: لمنع تكرار الأخطاء
- **قواعد التطوير**: أنماط يجب اتباعها (مثل: استخدم AuthContext وليس useAuth مستقل)

### 2. قائمة الصفحات الكاملة (55 صفحة) مع تصنيف الحالة

سأصنف كل صفحة إلى:
- ✅ **تعمل** - متصلة بالـ DB وأزرارها فعالة
- ⚠️ **تحتاج مراجعة** - موجودة لكن قد تحتوي على أزرار معطلة أو مشاكل
- ❌ **غير مربوطة** - موجودة كملف لكن بدون route أو بدون رابط في القائمة الجانبية
- 🗑️ **مكررة/غير ضرورية** - يمكن حذفها أو دمجها

#### التصنيف المبدئي:

| # | الصفحة | المسار | في القائمة الجانبية | الحالة |
|---|--------|--------|---------------------|--------|
| 1 | Index (لوحة التحكم) | `/` | ✅ | ⚠️ تحتاج مراجعة |
| 2 | Patients | `/patients` | ✅ | ✅ تم إصلاحه |
| 3 | PatientProfile | `/patients/:id` | - | ✅ تم إصلاحه |
| 4 | EditPatient | `/patients/edit/:id` | - | ✅ تم إصلاحه |
| 5 | Appointments | `/appointments` | ✅ | ⚠️ |
| 6 | NewAppointment | `/appointments/new` | ✅ | ⚠️ |
| 7 | PublicBooking | `/book` | ❌ لا رابط في القائمة | ⚠️ |
| 8 | AppointmentRequests | `/appointment-requests` | ✅ | ⚠️ |
| 9 | DoctorApplications | `/doctor-applications` | ✅ (super_admin) | ⚠️ |
| 10 | Doctors | `/doctors` | ✅ | ⚠️ |
| 11 | DoctorAssistants | `/doctor-assistants` | ✅ | ⚠️ |
| 12 | Secretaries | `/secretaries` | ✅ | ⚠️ |
| 13 | MedicalRecords | `/medical-records` | ❌ لا رابط | ⚠️ |
| 14 | AdvancedMedicalRecords | `/advanced-medical-records` | ✅ | ⚠️ |
| 15 | DentalTreatments | `/dental-treatments` | ❌ لا رابط | ⚠️ مكرر؟ |
| 16 | DentalTreatmentsManagement | `/dental-treatments-management` | ✅ | ⚠️ |
| 17 | Prescriptions | `/prescriptions` | ✅ | ⚠️ |
| 18 | SmartDiagnosis | `/smart-diagnosis-system` | ✅ | ⚠️ |
| 19 | AIInsights | `/ai-insights` + `/ai-insights-page` | ✅ | ⚠️ مسار مكرر |
| 20 | AIManagementDashboard | `/ai-management-dashboard` | ✅ | ⚠️ |
| 21 | FinancialOverview | `/financial-overview` | ✅ | ⚠️ |
| 22 | InvoiceManagement | `/invoice-management` | ✅ | ⚠️ |
| 23 | PaymentManagement | `/payment-management` | ✅ | ⚠️ |
| 24 | TreatmentPlans | `/treatment-plans` | ✅ | ⚠️ |
| 25 | FinancialReports | `/financial-reports` | ✅ | ⚠️ |
| 26 | PatientFinancialTransactions | `/financial-transactions` | ✅ | ⚠️ |
| 27 | Invoices | `/invoices` | ❌ لا رابط | ⚠️ مكرر مع InvoiceManagement؟ |
| 28 | Payments | `/payments` | ❌ لا رابط | ⚠️ مكرر مع PaymentManagement؟ |
| 29 | Inventory | `/inventory` | ✅ | ⚠️ |
| 30 | Medications | `/medications` | ✅ | ⚠️ |
| 31 | PurchaseOrders | `/purchase-orders` | ✅ | ⚠️ |
| 32 | StockMovements | `/stock-movements` | ✅ | ⚠️ |
| 33 | Reports | `/reports` | ❌ لا رابط | ⚠️ |
| 34 | DetailedReports | `/detailed-reports` | ✅ | ⚠️ |
| 35 | Notifications | `/notifications` | ❌ لا رابط | ⚠️ |
| 36 | AdvancedNotificationManagement | `/advanced-notification-management` | ✅ | ⚠️ |
| 37 | CustomNotificationTemplates | `/custom-notification-templates` | ✅ | ⚠️ |
| 38 | NotificationTemplates | `/notification-templates` | ❌ لا رابط | ⚠️ مكرر؟ |
| 39 | Settings | `/settings` | ✅ | ⚠️ |
| 40 | Profile | `/profile` | ❌ لا رابط (عبر TopNavbar) | ⚠️ |
| 41 | Users | `/users` | ❌ لا رابط | ⚠️ مكرر مع AdvancedUserManagement؟ |
| 42 | Permissions | `/permissions` | ❌ لا رابط | ⚠️ مكرر؟ |
| 43 | AdvancedPermissionsManagement | `/advanced-permissions-management` | ✅ | ⚠️ |
| 44 | AdvancedUserManagement | `/advanced-user-management` | ✅ | ⚠️ |
| 45 | SecurityAudit | `/security-audit` | ❌ لا رابط | ⚠️ مكرر؟ |
| 46 | ComprehensiveSecurityAudit | `/comprehensive-security-audit` | ✅ | ⚠️ |
| 47 | ServicePrices | `/service-prices` | ❌ لا رابط | ⚠️ |
| 48 | SuperAdmin | `/super-admin` | ✅ (super_admin) | ⚠️ |
| 49 | SubscriptionPlans | `/subscription-plans` | ✅ (super_admin) | ⚠️ |
| 50 | SubscriptionManagement | `/subscription` | ✅ (owner) | ⚠️ |
| 51 | Integrations | `/integrations` | ✅ | ⚠️ |
| 52 | Dental3DModelsManagement | `/dental-3d-models-management` | ✅ | ⚠️ |
| 53 | Auth | `/auth` | - (صفحة تسجيل دخول) | ⚠️ |
| **لا route** | Advanced3DDental | ❌ | ❌ | 🗑️ |
| **لا route** | Advanced3DDentalEditor | ❌ | ❌ | 🗑️ |
| **لا route** | AdvancedToothEditor | ❌ | ❌ | 🗑️ |
| **لا route** | DentalModelsManager | ❌ | ❌ | 🗑️ |

### 3. المشاكل الهيكلية المكتشفة

1. **صفحات مكررة** (13 صفحة بدون رابط في القائمة الجانبية): يجب إما حذفها أو دمجها مع نظيرتها "المتقدمة"
2. **4 صفحات بدون route أصلاً**: ملفات ميتة يجب حذفها
3. **مسار مكرر لـ AIInsights**: `/ai-insights` و `/ai-insights-page` يؤديان لنفس المكون
4. **ملفات .tmp و .backup** في مجلد layout: 6 ملفات مؤقتة يجب حذفها

### 4. خطة العمل المقترحة (صفحة بصفحة)

سنعمل بترتيب الأولوية:

**المرحلة 1 - تنظيف فوري:**
- حذف 4 صفحات بدون route
- حذف 6 ملفات .tmp/.backup من layout
- إزالة المسار المكرر `/ai-insights`
- دمج أو حذف الصفحات المكررة (`Invoices` vs `InvoiceManagement`, `Payments` vs `PaymentManagement`, etc.)

**المرحلة 2 - فحص الصفحات الأساسية (واحدة تلو الأخرى):**
1. لوحة التحكم (Index)
2. المواعيد (Appointments + NewAppointment)
3. الأطباء (Doctors)
4. الفواتير (InvoiceManagement)
5. المدفوعات (PaymentManagement)
6. المخزون (Inventory + Medications)
7. الوصفات (Prescriptions)
8. الإعدادات (Settings)
9. باقي الصفحات...

**المرحلة 3 - ربط الصفحات:**
- التأكد من أن كل زر "جديد" يفتح الصفحة/الحوار الصحيح
- التأكد من أن الروابط بين الصفحات تعمل (مثل: من فاتورة → ملف مريض)

### ما سيحتويه ملف `PROJECT_MEMORY.md`

```text
# ذاكرة مشروع نظام طب الأسنان

## التعديلات المنجزة
- [تاريخ] إصلاح إحصائيات المرضى
- [تاريخ] تفعيل أزرار التعديل والحفظ
- [تاريخ] مركزة AuthContext
- [تاريخ] تنظيف ملفات غير مستخدمة

## قواعد التطوير
1. استخدم useAuth() من AuthContext دائماً
2. لا تنشئ ملفات .tmp أو .backup
3. كل صفحة جديدة يجب أن تُضاف للـ router + القائمة الجانبية
4. لا تكرر صفحات (مثل Invoices vs InvoiceManagement)

## الصفحات وحالتها
[جدول كامل بكل صفحة وحالتها]

## المشاكل المعروفة
[قائمة بالمشاكل التي لم تُحل بعد]
```

### التنفيذ
1. إنشاء `PROJECT_MEMORY.md` في جذر المشروع
2. حذف الملفات الميتة والمؤقتة فوراً
3. البدء بفحص الصفحات واحدة تلو الأخرى بالترتيب المذكور


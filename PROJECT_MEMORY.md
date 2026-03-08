# 🦷 ذاكرة مشروع نظام إدارة العيادات السنية

> آخر تحديث: 2026-03-08

---

## 📌 قواعد التطوير (يجب اتباعها دائماً)

1. **Auth**: استخدم `useAuth()` فقط — يقرأ من `AuthContext` المركزي. لا تنشئ اشتراكات auth مستقلة.
2. **لا ملفات مؤقتة**: ممنوع إنشاء `.tmp`, `.backup`, `.bak`, `.fixed`, `.latest`, `.new` في المشروع.
3. **كل صفحة جديدة** يجب أن تُضاف في 3 أماكن: الملف في `src/pages/` + Route في `App.tsx` + رابط في `AppSidebar.tsx`.
4. **لا تكرار صفحات**: إذا وُجدت صفحة "متقدمة" (Advanced)، احذف النسخة البسيطة أو وجّه مسارها للمتقدمة.
5. **Supabase clinic_id**: كل query يجب أن يفلتر بـ `clinic_id` من `profiles` table.
6. **الألوان**: استخدم semantic tokens من `index.css` فقط (مثل `--primary`, `--background`). لا ألوان مباشرة.
7. **الأدوار**: لا تخزن الأدوار في جدول `profiles`. استخدم `clinic_memberships` + `clinic_role_hierarchy`.

---

## ✅ التعديلات المنجزة

| التاريخ | التعديل | الملفات |
|---------|---------|---------|
| 2026-03-08 | مركزة AuthContext — اشتراك auth واحد بدل 26 | `AuthContext.tsx`, `useAuth.ts`, `AppProviders.tsx` |
| 2026-03-08 | تأجيل database-init.ts و offlineDB.init() | `database-init.ts`, `App.tsx` |
| 2026-03-08 | إزالة console.log من SimpleProtectedRoute | `SimpleProtectedRoute.tsx` |
| 2026-03-08 | حذف ملفات ميتة ومؤقتة (12 ملف) | layout/*.tmp, pages/dead files |
| 2026-03-08 | إزالة مسار مكرر `/ai-insights` (أبقينا `/ai-insights-page`) | `App.tsx` |
| سابقاً | إصلاح إحصائيات المرضى | `Index.tsx` |
| سابقاً | تفعيل أزرار تعديل/حفظ المرضى | `PatientProfile.tsx`, `EditPatient.tsx` |

---

## 📄 قائمة الصفحات الكاملة وحالتها

### الرموز
- ✅ تعمل ومتصلة بالـ DB
- ⚠️ تحتاج فحص/مراجعة
- 🔗 موجودة لكن بدون رابط في القائمة الجانبية (accessible via URL only)
- ❌ محذوفة/مدمجة

### لوحة التحكم
| # | الصفحة | المسار | القائمة الجانبية | الحالة |
|---|--------|--------|-----------------|--------|
| 1 | Index | `/` | ✅ | ⚠️ فحص الأزرار والإحصائيات |

### إدارة المرضى
| # | الصفحة | المسار | القائمة الجانبية | الحالة |
|---|--------|--------|-----------------|--------|
| 2 | Patients | `/patients` | ✅ | ✅ |
| 3 | PatientProfile | `/patients/:id` | — (رابط داخلي) | ✅ |
| 4 | EditPatient | `/patients/edit/:id` | — (رابط داخلي) | ✅ |
| 5 | AdvancedMedicalRecords | `/advanced-medical-records` | ✅ | ⚠️ |
| 6 | MedicalRecords | `/medical-records` | 🔗 بدون رابط | ⚠️ مكرر — يجب توجيهه لـ advanced |

### المواعيد والحجوزات
| # | الصفحة | المسار | القائمة الجانبية | الحالة |
|---|--------|--------|-----------------|--------|
| 7 | Appointments | `/appointments` | ✅ | ⚠️ |
| 8 | NewAppointment | `/appointments/new` | ✅ | ⚠️ |
| 9 | AppointmentRequests | `/appointment-requests` | ✅ | ⚠️ |
| 10 | PublicBooking | `/book` | 🔗 (صفحة عامة) | ⚠️ |

### العلاج والتشخيص
| # | الصفحة | المسار | القائمة الجانبية | الحالة |
|---|--------|--------|-----------------|--------|
| 11 | DentalTreatmentsManagement | `/dental-treatments-management` | ✅ | ⚠️ |
| 12 | DentalTreatments | `/dental-treatments` | 🔗 بدون رابط | ⚠️ مكرر — يجب توجيهه |
| 13 | Prescriptions | `/prescriptions` | ✅ | ⚠️ |
| 14 | SmartDiagnosis | `/smart-diagnosis-system` | ✅ | ⚠️ |
| 15 | AIInsights | `/ai-insights-page` | ✅ | ⚠️ |
| 16 | AIManagementDashboard | `/ai-management-dashboard` | ✅ | ⚠️ |

### الإدارة المالية
| # | الصفحة | المسار | القائمة الجانبية | الحالة |
|---|--------|--------|-----------------|--------|
| 17 | FinancialOverview | `/financial-overview` | ✅ | ⚠️ |
| 18 | InvoiceManagement | `/invoice-management` | ✅ | ⚠️ |
| 19 | PaymentManagement | `/payment-management` | ✅ | ⚠️ |
| 20 | TreatmentPlans | `/treatment-plans` | ✅ | ⚠️ |
| 21 | FinancialReports | `/financial-reports` | ✅ | ⚠️ |
| 22 | PatientFinancialTransactions | `/financial-transactions` | ✅ | ⚠️ |
| 23 | Invoices | `/invoices` | 🔗 بدون رابط | ⚠️ مكرر مع InvoiceManagement |
| 24 | Payments | `/payments` | 🔗 بدون رابط | ⚠️ مكرر مع PaymentManagement |
| 25 | ServicePrices | `/service-prices` | 🔗 بدون رابط | ⚠️ |

### المخزون والمستلزمات
| # | الصفحة | المسار | القائمة الجانبية | الحالة |
|---|--------|--------|-----------------|--------|
| 26 | Inventory | `/inventory` | ✅ | ⚠️ |
| 27 | Medications | `/medications` | ✅ | ⚠️ |
| 28 | PurchaseOrders | `/purchase-orders` | ✅ | ⚠️ |
| 29 | StockMovements | `/stock-movements` | ✅ | ⚠️ |

### الكادر الطبي
| # | الصفحة | المسار | القائمة الجانبية | الحالة |
|---|--------|--------|-----------------|--------|
| 30 | Doctors | `/doctors` | ✅ | ⚠️ |
| 31 | DoctorAssistants | `/doctor-assistants` | ✅ | ⚠️ |
| 32 | Secretaries | `/secretaries` | ✅ | ⚠️ |
| 33 | DoctorApplications | `/doctor-applications` | ✅ (super_admin) | ⚠️ |

### التقارير
| # | الصفحة | المسار | القائمة الجانبية | الحالة |
|---|--------|--------|-----------------|--------|
| 34 | DetailedReports | `/detailed-reports` | ✅ | ⚠️ |
| 35 | Reports | `/reports` | 🔗 بدون رابط | ⚠️ مكرر مع DetailedReports |

### الإشعارات
| # | الصفحة | المسار | القائمة الجانبية | الحالة |
|---|--------|--------|-----------------|--------|
| 36 | AdvancedNotificationManagement | `/advanced-notification-management` | ✅ | ⚠️ |
| 37 | CustomNotificationTemplates | `/custom-notification-templates` | ✅ | ⚠️ |
| 38 | Notifications | `/notifications` | 🔗 بدون رابط | ⚠️ مكرر |
| 39 | NotificationTemplates | `/notification-templates` | 🔗 بدون رابط | ⚠️ مكرر |

### الإعدادات والنظام
| # | الصفحة | المسار | القائمة الجانبية | الحالة |
|---|--------|--------|-----------------|--------|
| 40 | Settings | `/settings` | ✅ | ⚠️ |
| 41 | AdvancedPermissionsManagement | `/advanced-permissions-management` | ✅ | ⚠️ |
| 42 | AdvancedUserManagement | `/advanced-user-management` | ✅ | ⚠️ |
| 43 | ComprehensiveSecurityAudit | `/comprehensive-security-audit` | ✅ | ⚠️ |
| 44 | Integrations | `/integrations` | ✅ | ⚠️ |
| 45 | Dental3DModelsManagement | `/dental-3d-models-management` | ✅ | ⚠️ |
| 46 | Profile | `/profile` | 🔗 (TopNavbar) | ⚠️ |
| 47 | Permissions | `/permissions` | 🔗 بدون رابط | ⚠️ مكرر |
| 48 | Users | `/users` | 🔗 بدون رابط | ⚠️ مكرر |
| 49 | SecurityAudit | `/security-audit` | 🔗 بدون رابط | ⚠️ مكرر |

### إدارة النظام (Super Admin / Owner)
| # | الصفحة | المسار | القائمة الجانبية | الحالة |
|---|--------|--------|-----------------|--------|
| 50 | SuperAdmin | `/super-admin` | ✅ (super_admin) | ⚠️ |
| 51 | SubscriptionPlans | `/subscription-plans` | ✅ (super_admin) | ⚠️ |
| 52 | SubscriptionManagement | `/subscription` | ✅ (owner) | ⚠️ |

### صفحات النظام
| # | الصفحة | المسار | الحالة |
|---|--------|--------|--------|
| 53 | Auth | `/auth` | ⚠️ |
| 54 | NotFound | `*` | ✅ |

### صفحات محذوفة (2026-03-08)
| الصفحة | السبب |
|--------|-------|
| Advanced3DDental.tsx | بدون route — وظيفة مغطاة بـ Dental3DModelsManagement |
| Advanced3DDentalEditor.tsx | بدون route — ملف ميت |
| AdvancedToothEditor.tsx | بدون route — ملف ميت |
| DentalModelsManager.tsx (page) | بدون route — مغطى بـ Dental3DModelsManagement |

---

## 🔴 مشاكل معروفة (لم تُحل بعد)

1. **صفحات مكررة بدون رابط** (8 صفحات): `MedicalRecords`, `DentalTreatments`, `Invoices`, `Payments`, `Reports`, `Notifications`, `NotificationTemplates`, `Permissions`, `Users`, `SecurityAudit` — يجب توجيه مساراتها للنسخ المتقدمة أو حذفها.
2. **PublicBooking `/book`**: صفحة حجز عامة — تحتاج فحص هل تعمل بدون auth.
3. **ServicePrices `/service-prices`**: موجودة بدون رابط — تحتاج تقرير هل مطلوبة.
4. **كل الصفحات المصنفة ⚠️**: تحتاج فحص أزرار + اتصال DB + روابط تنقل.

---

## 🗂️ هيكل الملفات المهمة

```
src/
├── contexts/
│   ├── AuthContext.tsx          ← مركزي — اشتراك auth واحد
│   ├── AppProviders.tsx         ← يلف كل الـ providers
│   ├── LanguageContext.tsx
│   └── SidebarContext.tsx
├── hooks/
│   ├── useAuth.ts              ← re-export من AuthContext
│   ├── usePermissions.ts
│   └── useSettingsHook.ts
├── components/
│   ├── layout/
│   │   ├── AppSidebar.tsx      ← القائمة الجانبية الرئيسية
│   │   ├── MainLayout.tsx      ← الهيكل العام
│   │   └── TopNavbar.tsx
│   └── auth/
│       └── SimpleProtectedRoute.tsx
├── pages/                      ← 54 صفحة (بعد التنظيف)
└── App.tsx                     ← Router + lazy imports
```

---

## 📋 خطة الفحص القادمة

ترتيب الأولوية لفحص الصفحات:

1. ☐ لوحة التحكم (Index) — إحصائيات + أزرار سريعة
2. ☐ المواعيد (Appointments + NewAppointment) — حجز + عرض + تعديل
3. ☐ الأطباء (Doctors) — إضافة + تعديل + حذف
4. ☐ الإدارة المالية (Invoice + Payment + TreatmentPlans)
5. ☐ المخزون (Inventory + Medications + PurchaseOrders)
6. ☐ الوصفات (Prescriptions)
7. ☐ الإعدادات (Settings)
8. ☐ الإشعارات (AdvancedNotificationManagement)
9. ☐ التقارير (DetailedReports)
10. ☐ إدارة المستخدمين والصلاحيات
11. ☐ Super Admin + Subscriptions



# فحص شامل لملف المرضى - تقرير الجاهزية

## الملفات المفحوصة (22 ملف)

**الصفحات:** `Patients.tsx`, `PatientProfile.tsx`, `EditPatient.tsx`
**المكونات:** `AddPatientDrawer`, `PatientCardsView`, `PatientTableView`, `PatientStatsCards`, `PatientCardActions`, `AddTreatmentDialog`, `DeletePatientDialog`, `PatientsPagination`
**تبويبات الملف الشخصي:** `PatientAppointments`, `PatientTreatments`, `PatientFinancials`, `PatientImages`, `PatientPrescriptions`, `PatientRecords`, `PatientNotes`
**أخرى:** `PatientWorkflowTracker`, `AnatomicalDentalChart`, `PatientImageGallery`
**Hooks:** `usePatients`, `usePatientStats`, `useDeletePatient`

---

## التقييم: ما يعمل بشكل صحيح

| الوظيفة | الحالة |
|---------|--------|
| قائمة المرضى مع بحث وفلترة وصفحات | ✅ |
| إضافة مريض جديد (AddPatientDrawer) | ✅ |
| تعديل مريض (EditPatient) | ✅ |
| حذف مريض مع تأكيد | ✅ |
| عرض بطاقات + عرض جدول | ✅ |
| الملف الشخصي مع 9 تبويبات | ✅ |
| جميع التبويبات متصلة بـ Supabase | ✅ |
| إحصائيات سريعة في البطاقات | ✅ |
| إضافة علاج من القائمة | ✅ |
| المالية (فواتير + مدفوعات) | ✅ |
| المخطط السني التشريحي | ✅ |
| مسار سير العمل (Workflow) | ✅ |

---

## المشاكل المكتشفة (7 مشاكل)

### 🔴 مشكلة #1: إحصائيات صفحة المرضى غير دقيقة
**الملف:** `Patients.tsx` سطر 112-128
- `PatientStatsCards` يتلقى `inactivePatients: 0` و `archivedPatients: 0` دائماً (قيم ثابتة)
- `activePatients` يُمرر له `totalCount` الذي هو عدد نتائج الفلتر الحالي وليس عدد النشطين فعلاً
- يجب جلب إحصائيات حقيقية لكل حالة من DB

### 🔴 مشكلة #2: زر "ملاحظة جديدة" في PatientNotes لا يحفظ
**الملف:** `PatientNotes.tsx` سطر 58
- زر "حفظ" في نموذج الملاحظة الجديدة لا يفعل شيئاً - لا يوجد `onClick` أو `onSubmit`
- لا يوجد mutation لإدراج الملاحظة في `advanced_tooth_notes`

### 🟡 مشكلة #3: أزرار "جديد" في تبويبات الملف الشخصي لا تعمل
الأزرار التالية موجودة كـ UI فقط بدون وظيفة:
- "حجز موعد جديد" في `PatientAppointments.tsx`
- "إضافة علاج جديد" في `PatientTreatments.tsx`
- "فاتورة جديدة" و "تسجيل دفعة" في `PatientFinancials.tsx`
- "سجل جديد" في `PatientRecords.tsx`
- "إضافة صورة" في `PatientImages.tsx`
- "وصفة جديدة" في `PatientPrescriptions.tsx`

### 🟡 مشكلة #4: زر "تعديل" في بطاقة المريض لا يعمل
**الملف:** `PatientCardsView.tsx` سطر 170-173
- زر Edit لا يحتوي على `onClick` ولا `Link` - لا يفعل شيئاً
- يجب ربطه بـ `/patients/edit/${patient.id}`

### 🟡 مشكلة #5: زر "تعديل" في جدول المرضى لا يعمل
**الملف:** `PatientTableView.tsx` سطر 179-181
- نفس المشكلة: زر Edit بدون `onClick`

### 🟡 مشكلة #6: `PatientCardActions` يوجه لتبويبات خاطئة
**الملف:** `PatientCardActions.tsx` سطر 66-68
- يوجه لـ `?tab=dental` و `?tab=invoices` لكن `PatientProfile.tsx` لا يقرأ query params لتحديد التبويب النشط
- التبويبات تبدأ دائماً من "المسار" بغض النظر عن الـ query param

### 🟢 ملاحظة: مكونات غير مستخدمة
- `EditPatientDialog.tsx`, `PatientMedicalHistory.tsx`, `AddSamplePatientsButton.tsx`, `UpdatePatientsCreatorButton.tsx`, `PatientCreatorFallback.tsx` - ملفات موجودة لكن لا تُستخدم في أي مكان واضح

---

## خطة الإصلاح

### 1. إصلاح إحصائيات صفحة المرضى
- إضافة استعلامات منفصلة لعدد كل حالة (`active`, `inactive`, `archived`) من DB
- تمرير الأرقام الحقيقية لـ `PatientStatsCards`

### 2. تفعيل حفظ الملاحظات في PatientNotes
- إضافة mutation لإدراج ملاحظة جديدة في `advanced_tooth_notes`
- ربط زر "حفظ" بالـ mutation مع إعادة تحميل القائمة

### 3. ربط أزرار التعديل بالتنقل الصحيح
- ربط زر Edit في `PatientCardsView` بـ `Link` لـ `/patients/edit/${id}`
- ربط زر Edit في `PatientTableView` بـ `Link` لـ `/patients/edit/${id}`

### 4. تفعيل تبويبات الملف الشخصي من query params
- قراءة `?tab=` من URL في `PatientProfile.tsx` واستخدامها كـ `defaultValue` للـ Tabs

### 5. ربط أزرار "جديد" في تبويبات الملف الشخصي
- ربط "حجز موعد جديد" بالتنقل إلى `/appointments/new?patient=${patientId}`
- ربط "إضافة علاج جديد" بفتح `AddTreatmentDialog`
- ربط "فاتورة جديدة" بالتنقل إلى `/invoices?new=true&patient=${patientId}`
- باقي الأزرار: ربطها بصفحاتها أو بـ dialogs مناسبة

### 6. حذف المكونات غير المستخدمة
- حذف `EditPatientDialog.tsx`, `AddSamplePatientsButton.tsx`, `UpdatePatientsCreatorButton.tsx`, `PatientCreatorFallback.tsx` لتنظيف المشروع




# خطة اختبار وإصلاح تدفق حجز الموعد الجديد

## المشاكل المكتشفة بعد الفحص الشامل

### 1. `EditAppointmentDialog` لا يزال يستخدم قائمة علاج محلية قديمة
- **السطر 42-59**: يحتوي على `TREATMENT_TYPES` محلي (16 نوع بدون أيقونات) بدلاً من استيراد الملف الموحد `@/constants/treatmentTypes`
- النتيجة: عند تعديل موعد، تظهر قائمة علاج مختلفة عن قائمة الإنشاء

### 2. `EditAppointmentDialog` يسمح بـ "بدون طبيب محدد"
- **السطر 292**: لا يزال يعرض خيار `value="none"` 
- **السطر 174**: يرسل `doctor_id: null` إذا اختار المستخدم "none"
- يتناقض مع قاعدة "الربط الإلزامي لكل موعد بطبيب"

### 3. `EditAppointmentDialog` لا يفلتر كشف التعارض حسب الطبيب
- **السطر 113-144**: يبحث عن كل مواعيد العيادة بدون فلتر `doctor_id`
- نفس المشكلة التي تم إصلاحها في `NewAppointmentForm` و `AddAppointmentPopup`

### 4. `DoctorSelect` المكوّن المشترك لا يزال يعرض "بدون طبيب محدد"
- **السطر 24**: `<SelectItem value="none">بدون طبيب محدد</SelectItem>`
- يجب حذفه لتطبيق القاعدة على كل الأماكن التي تستخدمه

### 5. `AppointmentRequestsList` يسمح بالموافقة بدون طبيب
- **السطر 191**: `doctor_id: approvalData.doctorId !== 'none' ? approvalData.doctorId : null`

---

## التغييرات المطلوبة

### `EditAppointmentDialog.tsx`
1. حذف قائمة `TREATMENT_TYPES` المحلية واستيراد الموحدة من `@/constants/treatmentTypes`
2. حذف خيار "بدون طبيب محدد" وإلزام اختيار طبيب قبل الحفظ
3. إضافة فلتر `doctor_id` في `checkConflicts`
4. تحسين عرض أنواع العلاج ليشمل الأيقونات

### `DoctorSelect.tsx`
1. حذف `<SelectItem value="none">` 
2. إضافة prop `allowNone` اختياري (للحالات الخاصة فقط)

### `AppointmentRequestsList.tsx`
1. إلزام اختيار طبيب عند الموافقة على طلب موعد
2. منع الموافقة إذا لم يُحدد طبيب

---

## ملخص الملفات

| الملف | التعديل |
|-------|---------|
| `EditAppointmentDialog.tsx` | توحيد العلاج، إلزام طبيب، تعارض حسب الطبيب |
| `DoctorSelect.tsx` | حذف "بدون طبيب محدد" |
| `AppointmentRequestsList.tsx` | إلزام طبيب عند الموافقة |




# خطة تطوير المخطط السني ثنائي الأبعاد وسجل السن الاحترافي

## تحليل الوضع الحالي

### المشاكل الرئيسية:
1. **لا يوجد حفظ في قاعدة البيانات** - جميع البيانات تُخزن فقط في React state وتُفقد عند إعادة التحميل
2. **ترقيم أسنان غير قياسي داخلياً** - يستخدم أرقام مثل `888, 777` بدل FDI القياسي `18, 17`
3. **console.log مفرط** - عشرات الرسائل التشخيصية في كل تفاعل
4. **سجل السن (ToothRecordDialog) بسيط** - يفتقر لحقول مهمة مثل تاريخ العلاج، الطبيب المعالج، الأدوية
5. **لا يُحمّل البيانات الموجودة** - لا يقرأ من `dental_treatments` عند فتح صفحة المريض
6. **واجهة المخطط تحتاج تحسين** - حجم الأسنان صغير، لا إحصائيات سريعة

---

## الخطة التنفيذية

### 1. ربط المخطط بقاعدة البيانات (dental_treatments)
- إنشاء hook جديد `useDentalChart.ts` يقرأ ويكتب من/إلى جدول `dental_treatments`
- تحميل حالات الأسنان المحفوظة عند فتح المخطط بفلتر `patient_id` + `clinic_id`
- حفظ/تحديث سجل السن عند الضغط على "حفظ" في الحوار
- استخدام `get_current_user_profile` RPC للحصول على `clinic_id`

### 2. توحيد ترقيم الأسنان
- استخدام ترقيم FDI (11-48) كمعيار داخلي أساسي بدل الأرقام الحالية (888, 777...)
- الصف العلوي: `18,17,16,15,14,13,12,11 | 21,22,23,24,25,26,27,28`
- الصف السفلي: `48,47,46,45,44,43,42,41 | 31,32,33,34,35,36,37,38`
- دعم عرض Universal/Palmer كبديل مع الحفاظ على FDI في DB

### 3. تطوير سجل السن (ToothRecordDialog) ليكون احترافياً
- **تبويب التشخيص**: إضافة حقل "تاريخ التشخيص"، قائمة أكواد ICD-10 مُعدّة مسبقاً (K02.x للتسوس، K04.x للعصب، إلخ)، حقل التشخيص التفريقي
- **تبويب الأسطح**: تصميم SVG تفاعلي لأسطح السن الخمسة (بدل القوائم المنسدلة) - النقر على السطح يغير حالته مباشرة
- **تبويب القياسات**: إضافة labels واضحة لكل قياس (MB, B, DB, ML, L, DL)، مؤشر لوني للقياسات غير الطبيعية (>3mm أحمر)
- **تبويب الجذور**: إضافة حقول تاريخ علاج العصب، نوع المادة المستخدمة، حالة كل جذر بشكل مستقل
- **تبويب خطة العلاج**: فصل الملاحظات عن خطة العلاج، إضافة حقل تاريخ المتابعة، حقل التكلفة التقديرية
- **تبويب جديد - التاريخ**: عرض تاريخ جميع التعديلات على السن

### 4. تحسين واجهة المخطط الرئيسي
- تكبير حجم الأسنان وتحسين التباعد
- إضافة شريط إحصائيات سريع أعلى المخطط (عدد الأسنان المسجلة، التسوسات، المفقودة، الحالات العاجلة)
- تلوين السن بالكامل حسب حالته المحفوظة في DB
- إضافة tooltip عند التمرير يعرض ملخص حالة السن
- إزالة جميع `console.log` التشخيصية

### 5. إزالة الملفات المكررة
- حذف الملفات الاحتياطية: `AnatomicalDentalChart.tsx.new`, `AnatomicalDentalChart_fixed.tsx`, `Enhanced2DToothChart.tsx.bak`, `Enhanced2DToothChart.tsx.fixed`, `Enhanced2DToothChart.tsx.new`, `AnatomicalTooth.tsx.new`

---

## التفاصيل التقنية

### Hook: `useDentalChart.ts`
```text
- useQuery: fetch dental_treatments WHERE patient_id AND clinic_id
- useMutation: upsert dental_treatments (insert or update)
- Returns: { toothRecords, saveToothRecord, isLoading }
- Maps DB rows to Map<toothNumber, record> for O(1) lookup
```

### DB Mapping (dental_treatments → UI)
```text
tooth_number     → FDI number (string)
diagnosis        → primary condition
treatment_plan   → treatment plan text
status           → planned/in_progress/completed
tooth_surface    → affected surfaces (comma-separated)
notes            → clinical notes
treatment_date   → date of record
numbering_system → 'fdi' (default)
```

### SVG Surface Selector (تبويب الأسطح)
```text
Interactive 5-surface tooth diagram:
  ┌───────┐
  │  B    │  ← Buccal (top)
  ├─┬───┬─┤
  │M│ O │D│  ← Mesial, Occlusal, Distal
  ├─┴───┴─┤
  │  L    │  ← Lingual (bottom)
  └───────┘
Click surface → cycles through conditions with color feedback
```

### الملفات المتأثرة:
1. **جديد**: `src/hooks/useDentalChart.ts` - Hook للربط مع DB
2. **تعديل**: `src/components/dental/AnatomicalDentalChart.tsx` - المخطط الرئيسي
3. **إعادة بناء**: `src/components/dental/ToothRecordDialog.tsx` - سجل السن الاحترافي
4. **تعديل**: `src/components/dental/LinearToothComponent.tsx` - مكون السن
5. **حذف**: 6 ملفات مكررة/احتياطية
6. **تعديل**: `src/pages/PatientProfile.tsx` - تمرير clinic_id للمخطط


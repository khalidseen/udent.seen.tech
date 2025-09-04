// Default dental note templates for the advanced tooth notes system

export interface DentalTemplate {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  category: string;
  title_template: string;
  title_template_ar: string;
  content_template: string;
  content_template_ar: string;
  default_note_type: string;
  default_priority: string;
  default_status: string;
  default_severity: string;
  default_color: string;
  tags: string[];
  is_system_template: boolean;
}

export const defaultDentalTemplates: DentalTemplate[] = [
  {
    id: 'template_general_checkup',
    name: 'General Dental Checkup',
    name_ar: 'فحص دوري عام',
    description: 'Standard template for routine dental examinations',
    description_ar: 'قالب معياري للفحص الدوري للأسنان',
    category: 'general',
    title_template: 'Routine Checkup - Tooth {tooth_number}',
    title_template_ar: 'فحص دوري - السن {tooth_number}',
    content_template: `Clinical Examination:
- General condition: 
- Pain presence: 
- Sensitivity: 
- Bleeding: 
- Mobility: 

Findings:
- 

Treatment Plan:
- 

Next Appointment: `,
    content_template_ar: `الفحص الإكلينيكي:
- الحالة العامة: 
- وجود ألم: 
- الحساسية: 
- النزيف: 
- الحركة: 

الملاحظات:
- 

الخطة العلاجية:
- 

الموعد القادم: `,
    default_note_type: 'general',
    default_priority: 'medium',
    default_status: 'active',
    default_severity: 'mild',
    default_color: '#3b82f6',
    tags: ['فحص', 'دوري', 'عام'],
    is_system_template: true
  },

  {
    id: 'template_endodontic_treatment',
    name: 'Endodontic Treatment',
    name_ar: 'علاج عصب',
    description: 'Template for root canal treatment documentation',
    description_ar: 'قالب لتوثيق علاج عصب الأسنان',
    category: 'endodontic',
    title_template: 'Root Canal Treatment - Tooth {tooth_number}',
    title_template_ar: 'علاج عصب - السن {tooth_number}',
    content_template: `Diagnosis: 
Pulp Status: 
Number of Canals: 
Working Length: 

Treatment Sessions:
Session 1: 
Session 2: 
Final Session: 

Final Restoration: 
Prognosis: 

Post-treatment Instructions:
- `,
    content_template_ar: `التشخيص: 
حالة العصب: 
عدد القنوات: 
طول القنوات: 

الجلسات:
الجلسة الأولى: 
الجلسة الثانية: 
الجلسة الأخيرة: 

الحشو النهائي: 
التوقعات: 

تعليمات ما بعد العلاج:
- `,
    default_note_type: 'endodontic',
    default_priority: 'high',
    default_status: 'under_treatment',
    default_severity: 'moderate',
    default_color: '#dc2626',
    tags: ['علاج_عصب', 'قناة_جذر', 'حشو_عصب'],
    is_system_template: true
  },

  {
    id: 'template_extraction',
    name: 'Tooth Extraction',
    name_ar: 'خلع سن',
    description: 'Template for documenting tooth extraction procedures',
    description_ar: 'قالب لتوثيق عمليات خلع الأسنان',
    category: 'oral_surgery',
    title_template: 'Extraction - Tooth {tooth_number}',
    title_template_ar: 'خلع السن {tooth_number}',
    content_template: `Reason for Extraction: 
Type of Extraction: Simple / Surgical
Anesthesia Used: 

Pre-operative Assessment:
- Medical History: 
- Radiographs: 

During Procedure:
- Complications: 
- Time Duration: 
- Technique Used: 

Post-operative Instructions:
- Bleeding control
- Pain management
- Diet restrictions
- Follow-up schedule

Complications: None / `,
    content_template_ar: `سبب الخلع: 
نوع الخلع: بسيط / جراحي
التخدير المستخدم: 

التقييم قبل العملية:
- التاريخ المرضي: 
- الأشعة: 

أثناء العملية:
- المضاعفات: 
- الوقت المستغرق: 
- التقنية المستخدمة: 

تعليمات ما بعد الخلع:
- التحكم في النزيف
- تسكين الألم
- قيود الطعام
- مواعيد المتابعة

المضاعفات: لا يوجد / `,
    default_note_type: 'oral_surgery',
    default_priority: 'high',
    default_status: 'completed',
    default_severity: 'moderate',
    default_color: '#ea580c',
    tags: ['خلع', 'جراحة', 'إزالة'],
    is_system_template: true
  },

  {
    id: 'template_filling',
    name: 'Dental Filling',
    name_ar: 'حشو أسنان',
    description: 'Template for documenting dental restorations',
    description_ar: 'قالب لتوثيق ترميمات الأسنان',
    category: 'restorative',
    title_template: 'Restoration - Tooth {tooth_number}',
    title_template_ar: 'حشو السن {tooth_number}',
    content_template: `Type of Caries: 
Caries Depth: Surface / Moderate / Deep
Restoration Material: 
Shade/Color: 

Procedure Steps:
1. Caries removal
2. Cavity preparation  
3. Etching and bonding
4. Filling placement
5. Finishing and polishing

Patient Condition Post-treatment: 
Sensitivity: Present / Absent
Bite Adjustment: Required / Not Required

Follow-up: `,
    content_template_ar: `نوع التسوس: 
عمق التسوس: سطحي / متوسط / عميق
مادة الحشو: 
اللون/الدرجة: 

خطوات العمل:
1. إزالة التسوس
2. تحضير التجويف
3. النقش والربط
4. وضع الحشو
5. التشكيل والتلميع

حالة المريض بعد العلاج: 
الحساسية: موجودة / غير موجودة
تعديل الإطباق: مطلوب / غير مطلوب

المتابعة: `,
    default_note_type: 'restorative',
    default_priority: 'medium',
    default_status: 'completed',
    default_severity: 'mild',
    default_color: '#16a34a',
    tags: ['حشو', 'ترميم', 'تسوس'],
    is_system_template: true
  },

  {
    id: 'template_cleaning',
    name: 'Teeth Cleaning & Prophylaxis',
    name_ar: 'تنظيف أسنان ووقاية',
    description: 'Template for professional teeth cleaning sessions',
    description_ar: 'قالب لجلسات تنظيف الأسنان المهني',
    category: 'preventive',
    title_template: 'Professional Cleaning - Session {date}',
    title_template_ar: 'تنظيف أسنان - جلسة {date}',
    content_template: `Gingival Condition: 
Calculus Amount: Minimal / Moderate / Heavy
Bleeding: Present / Absent
Plaque Index: 

Procedures Performed:
- Supragingival scaling
- Subgingival scaling  
- Polishing
- Fluoride treatment

Oral Hygiene Instructions:
- Proper brushing technique
- Flossing demonstration
- Mouthwash recommendation

Next Cleaning Due: `,
    content_template_ar: `حالة اللثة: 
كمية الجير: قليل / متوسط / كثير
النزيف: موجود / غير موجود
مؤشر البلاك: 

الإجراءات المتبعة:
- إزالة الجير فوق اللثوي
- إزالة الجير تحت اللثوي
- تلميع الأسنان
- علاج بالفلورايد

تعليمات نظافة الفم:
- تقنية التنظيف الصحيحة
- استخدام الخيط
- غسول الفم الموصى به

موعد التنظيف القادم: `,
    default_note_type: 'preventive',
    default_priority: 'low',
    default_status: 'completed',
    default_severity: 'mild',
    default_color: '#059669',
    tags: ['تنظيف', 'وقاية', 'تلميع', 'فلورايد'],
    is_system_template: true
  },

  {
    id: 'template_periodontal',
    name: 'Periodontal Treatment',
    name_ar: 'علاج لثوي',
    description: 'Template for periodontal disease treatment',
    description_ar: 'قالب لعلاج أمراض اللثة والأنسجة المحيطة',
    category: 'periodontal',
    title_template: 'Periodontal Treatment - {tooth_number}',
    title_template_ar: 'علاج لثوي - {tooth_number}',
    content_template: `Periodontal Diagnosis: 
Pocket Depth: 
Bleeding on Probing: 
Mobility Grade: 
Furcation Involvement: 

Treatment Plan:
- Phase I: Non-surgical therapy
- Phase II: Surgical therapy (if needed)
- Phase III: Maintenance

Today's Treatment: 
Anesthesia: 
Procedures: 

Post-operative Care:
- 
Home Care Instructions:
- `,
    content_template_ar: `التشخيص اللثوي: 
عمق الجيوب: 
النزيف عند السبر: 
درجة الحركة: 
إصابة التشعب: 

خطة العلاج:
- المرحلة الأولى: العلاج غير الجراحي
- المرحلة الثانية: العلاج الجراحي (عند الحاجة)
- المرحلة الثالثة: المتابعة

علاج اليوم: 
التخدير: 
الإجراءات: 

الرعاية بعد العلاج:
- 
تعليمات الرعاية المنزلية:
- `,
    default_note_type: 'periodontal',
    default_priority: 'high',
    default_status: 'under_treatment',
    default_severity: 'moderate',
    default_color: '#dc2626',
    tags: ['لثة', 'جيوب', 'التهاب_لثوي'],
    is_system_template: true
  },

  {
    id: 'template_crown_preparation',
    name: 'Crown Preparation',
    name_ar: 'تحضير تاج',
    description: 'Template for documenting crown preparation procedures',
    description_ar: 'قالب لتوثيق عمليات تحضير التيجان',
    category: 'prosthodontic',
    title_template: 'Crown Preparation - Tooth {tooth_number}',
    title_template_ar: 'تحضير تاج - السن {tooth_number}',
    content_template: `Indication for Crown: 
Pre-operative Condition: 
Vitality Status: Vital / Non-vital

Preparation Details:
- Margin Design: 
- Reduction Amount: 
- Taper Angle: 
- Finish Line: 

Impression Material: 
Temporary Crown: 
Shade Selection: 

Laboratory Instructions:
- Crown Type: 
- Material: 
- Special Requirements: 

Next Appointment: Crown Try-in`,
    content_template_ar: `دواعي التاج: 
الحالة قبل العلاج: 
حالة الحيوية: حي / غير حي

تفاصيل التحضير:
- تصميم الحافة: 
- كمية التقليل: 
- زاوية التدرج: 
- خط النهاية: 

مادة الطبع: 
التاج المؤقت: 
اختيار اللون: 

تعليمات المختبر:
- نوع التاج: 
- المادة: 
- متطلبات خاصة: 

الموعد القادم: تجربة التاج`,
    default_note_type: 'prosthodontic',
    default_priority: 'medium',
    default_status: 'under_treatment',
    default_severity: 'mild',
    default_color: '#7c3aed',
    tags: ['تاج', 'تركيبة', 'تحضير'],
    is_system_template: true
  },

  {
    id: 'template_emergency',
    name: 'Emergency Treatment',
    name_ar: 'علاج طوارئ',
    description: 'Template for emergency dental procedures',
    description_ar: 'قالب لإجراءات طوارئ الأسنان',
    category: 'emergency',
    title_template: 'Emergency Treatment - {tooth_number}',
    title_template_ar: 'علاج طوارئ - {tooth_number}',
    content_template: `Chief Complaint: 
Pain Level (1-10): 
Duration: 
Precipitating Factors: 
Relieving Factors: 

Clinical Findings:
- Visual Examination: 
- Percussion Test: 
- Palpation: 
- Thermal Test: 
- Radiographic Findings: 

Emergency Treatment Provided:
- 

Pain Management:
- Medication Prescribed: 
- Dosage Instructions: 

Follow-up Plan:
- Definitive Treatment: 
- Next Appointment: 

Patient Instructions:
- `,
    content_template_ar: `الشكوى الرئيسية: 
مستوى الألم (1-10): 
المدة: 
العوامل المحفزة: 
العوامل المخففة: 

الفحوصات الإكلينيكية:
- الفحص البصري: 
- اختبار القرع: 
- الجس: 
- الاختبار الحراري: 
- نتائج الأشعة: 

العلاج الطارئ المقدم:
- 

تسكين الألم:
- الأدوية الموصوفة: 
- تعليمات الجرعة: 

خطة المتابعة:
- العلاج النهائي: 
- الموعد القادم: 

تعليمات المريض:
- `,
    default_note_type: 'emergency',
    default_priority: 'critical',
    default_status: 'active',
    default_severity: 'severe',
    default_color: '#dc2626',
    tags: ['طوارئ', 'ألم', 'عاجل'],
    is_system_template: true
  }
];

// Helper functions for template management
export const getTemplateByCategory = (category: string): DentalTemplate[] => {
  return defaultDentalTemplates.filter(template => template.category === category);
};

export const getTemplateById = (id: string): DentalTemplate | undefined => {
  return defaultDentalTemplates.find(template => template.id === id);
};

export const getTemplateCategories = (): string[] => {
  return [...new Set(defaultDentalTemplates.map(template => template.category))];
};

export const substituteTemplateVariables = (
  template: string,
  variables: { [key: string]: string }
): string => {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
};

// Common template variables
export const getCommonTemplateVariables = (
  toothNumber: string,
  patientName?: string,
  doctorName?: string,
  date?: string
) => ({
  tooth_number: toothNumber,
  patient_name: patientName || '',
  doctor_name: doctorName || '',
  date: date || new Date().toLocaleDateString('ar-SA'),
  today: new Date().toLocaleDateString('ar-SA'),
  time: new Date().toLocaleTimeString('ar-SA', { 
    hour12: true, 
    hour: '2-digit', 
    minute: '2-digit' 
  })
});
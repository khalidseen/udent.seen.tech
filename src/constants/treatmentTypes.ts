export const TREATMENT_TYPES = [
  { value: 'فحص عام ودوري', label: 'فحص عام ودوري', icon: '🔍', duration: 30 },
  { value: 'تنظيف الأسنان', label: 'تنظيف الأسنان', icon: '🪥', duration: 45 },
  { value: 'حشو الأسنان', label: 'حشو الأسنان', icon: '🦷', duration: 45 },
  { value: 'خلع الأسنان', label: 'خلع الأسنان', icon: '🔧', duration: 30 },
  { value: 'علاج عصب', label: 'علاج عصب', icon: '💉', duration: 60 },
  { value: 'تركيب تاج', label: 'تركيب تاج', icon: '👑', duration: 60 },
  { value: 'تركيب جسر', label: 'تركيب جسر', icon: '🌉', duration: 90 },
  { value: 'زراعة أسنان', label: 'زراعة أسنان', icon: '🔩', duration: 120 },
  { value: 'تقويم الأسنان', label: 'تقويم الأسنان', icon: '📐', duration: 45 },
  { value: 'تبييض الأسنان', label: 'تبييض الأسنان', icon: '✨', duration: 60 },
  { value: 'جراحة فموية', label: 'جراحة فموية', icon: '🏥', duration: 90 },
  { value: 'علاج اللثة', label: 'علاج اللثة', icon: '🩺', duration: 45 },
  { value: 'علاج أطفال', label: 'علاج أطفال', icon: '👶', duration: 30 },
  { value: 'طوارئ', label: 'طوارئ', icon: '🚨', duration: 30 },
  { value: 'متابعة', label: 'متابعة', icon: '🔄', duration: 15 },
  { value: 'استشارة', label: 'استشارة', icon: '💬', duration: 30 },
  { value: 'أخرى', label: 'أخرى', icon: '📋', duration: 30 },
] as const;

export type TreatmentType = typeof TREATMENT_TYPES[number];

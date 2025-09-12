// أنواع النظام التشريحي الطبيعي

// تعداد أنواع الأسنان
export enum ToothType {
  INCISOR = 'incisor',
  CANINE = 'canine', 
  PREMOLAR = 'premolar',
  MOLAR = 'molar'
}

export interface ToothTemplate {
  id: string;
  toothNumber: string;
  name: string;
  description: string;
  type: ToothType;
  imageUrl: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientToothImage {
  id: string;
  patientId: string;
  toothNumber: string;
  imageUrl: string; // صورة المريض الفعلية
  description?: string;
  createdAt: Date;
  clinicianId: string;
}

export interface AnatomicalPosition {
  x: number; // النسبة المئوية من اليسار
  y: number; // النسبة المئوية من الأعلى
  rotation: number; // درجة الدوران لتناسب الفك
}

export interface ToothAnatomicalData {
  toothNumber: string;
  position: AnatomicalPosition;
  size: number; // حجم السن نسبياً
  type: ToothType;
}

// مواقع الأسنان الطبيعية في الفك البشري (إحداثيات منحنية)
export const ANATOMICAL_POSITIONS: { [key: string]: ToothAnatomicalData } = {
  // الفك العلوي - الجانب الأيمن
  '18': { toothNumber: '18', position: { x: 15, y: 25, rotation: -15 }, size: 1.2, type: ToothType.MOLAR },
  '17': { toothNumber: '17', position: { x: 20, y: 22, rotation: -10 }, size: 1.1, type: ToothType.MOLAR },
  '16': { toothNumber: '16', position: { x: 25, y: 20, rotation: -5 }, size: 1.0, type: ToothType.MOLAR },
  '15': { toothNumber: '15', position: { x: 30, y: 18, rotation: 0 }, size: 0.9, type: ToothType.PREMOLAR },
  '14': { toothNumber: '14', position: { x: 35, y: 17, rotation: 5 }, size: 0.85, type: ToothType.PREMOLAR },
  '13': { toothNumber: '13', position: { x: 40, y: 16, rotation: 10 }, size: 0.8, type: ToothType.CANINE },
  '12': { toothNumber: '12', position: { x: 45, y: 15, rotation: 15 }, size: 0.7, type: ToothType.INCISOR },
  '11': { toothNumber: '11', position: { x: 50, y: 14, rotation: 20 }, size: 0.75, type: ToothType.INCISOR },
  
  // الفك العلوي - الجانب الأيسر
  '21': { toothNumber: '21', position: { x: 50, y: 14, rotation: -20 }, size: 0.75, type: ToothType.INCISOR },
  '22': { toothNumber: '22', position: { x: 55, y: 15, rotation: -15 }, size: 0.7, type: ToothType.INCISOR },
  '23': { toothNumber: '23', position: { x: 60, y: 16, rotation: -10 }, size: 0.8, type: ToothType.CANINE },
  '24': { toothNumber: '24', position: { x: 65, y: 17, rotation: -5 }, size: 0.85, type: ToothType.PREMOLAR },
  '25': { toothNumber: '25', position: { x: 70, y: 18, rotation: 0 }, size: 0.9, type: ToothType.PREMOLAR },
  '26': { toothNumber: '26', position: { x: 75, y: 20, rotation: 5 }, size: 1.0, type: ToothType.MOLAR },
  '27': { toothNumber: '27', position: { x: 80, y: 22, rotation: 10 }, size: 1.1, type: ToothType.MOLAR },
  '28': { toothNumber: '28', position: { x: 85, y: 25, rotation: 15 }, size: 1.2, type: ToothType.MOLAR },
  
  // الفك السفلي - الجانب الأيمن
  '48': { toothNumber: '48', position: { x: 15, y: 75, rotation: 15 }, size: 1.2, type: ToothType.MOLAR },
  '47': { toothNumber: '47', position: { x: 20, y: 78, rotation: 10 }, size: 1.1, type: ToothType.MOLAR },
  '46': { toothNumber: '46', position: { x: 25, y: 80, rotation: 5 }, size: 1.0, type: ToothType.MOLAR },
  '45': { toothNumber: '45', position: { x: 30, y: 82, rotation: 0 }, size: 0.9, type: ToothType.PREMOLAR },
  '44': { toothNumber: '44', position: { x: 35, y: 83, rotation: -5 }, size: 0.85, type: ToothType.PREMOLAR },
  '43': { toothNumber: '43', position: { x: 40, y: 84, rotation: -10 }, size: 0.8, type: ToothType.CANINE },
  '42': { toothNumber: '42', position: { x: 45, y: 85, rotation: -15 }, size: 0.7, type: ToothType.INCISOR },
  '41': { toothNumber: '41', position: { x: 50, y: 86, rotation: -20 }, size: 0.75, type: ToothType.INCISOR },
  
  // الفك السفلي - الجانب الأيسر
  '31': { toothNumber: '31', position: { x: 50, y: 86, rotation: 20 }, size: 0.75, type: ToothType.INCISOR },
  '32': { toothNumber: '32', position: { x: 55, y: 85, rotation: 15 }, size: 0.7, type: ToothType.INCISOR },
  '33': { toothNumber: '33', position: { x: 60, y: 84, rotation: 10 }, size: 0.8, type: ToothType.CANINE },
  '34': { toothNumber: '34', position: { x: 65, y: 83, rotation: 5 }, size: 0.85, type: ToothType.PREMOLAR },
  '35': { toothNumber: '35', position: { x: 70, y: 82, rotation: 0 }, size: 0.9, type: ToothType.PREMOLAR },
  '36': { toothNumber: '36', position: { x: 75, y: 80, rotation: -5 }, size: 1.0, type: ToothType.MOLAR },
  '37': { toothNumber: '37', position: { x: 80, y: 78, rotation: -10 }, size: 1.1, type: ToothType.MOLAR },
  '38': { toothNumber: '38', position: { x: 85, y: 75, rotation: -15 }, size: 1.2, type: ToothType.MOLAR }
};

export interface AnatomicalChartProps {
  patientId?: string;
  onToothSelect: (toothNumber: string) => void;
  onSaveRecord?: (record: unknown) => void;
}

export interface AdminTemplateUpload {
  toothNumber: string;
  file: File;
  toothType: 'incisor' | 'canine' | 'premolar' | 'molar';
}

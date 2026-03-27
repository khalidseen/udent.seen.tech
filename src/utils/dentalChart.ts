import {
  ChartStatistics,
  ConditionType,
  DentalTreatmentRecord,
  MobilityLevel,
  RootConditionValue,
  ToothClinicalData,
  ToothNumberingSystem,
  ToothSurfaceState,
  ToothRecordStatus,
} from '@/types/dental-enhanced';

export const FDI_PERMANENT_ROWS = {
  upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
  upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
  lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
  lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38'],
} as const;

export const FDI_DISPLAY_ORDER = [
  ...FDI_PERMANENT_ROWS.upperRight,
  ...FDI_PERMANENT_ROWS.upperLeft,
  ...FDI_PERMANENT_ROWS.lowerRight,
  ...FDI_PERMANENT_ROWS.lowerLeft,
];

export const FDI_TO_UNIVERSAL: Record<string, string> = {};

[
  ...FDI_PERMANENT_ROWS.upperRight.map((fdi, index) => [fdi, String(index + 1)]),
  ...FDI_PERMANENT_ROWS.upperLeft.map((fdi, index) => [fdi, String(index + 9)]),
  ...FDI_PERMANENT_ROWS.lowerLeft.map((fdi, index) => [fdi, String(24 - index)]),
  ...FDI_PERMANENT_ROWS.lowerRight.map((fdi, index) => [fdi, String(25 + index)]),
].forEach(([fdi, universal]) => {
  FDI_TO_UNIVERSAL[fdi] = universal;
});

export const CLINICAL_ROOT_CONDITION_OPTIONS: RootConditionValue[] = [
  'healthy',
  'infected',
  'treated',
  'fractured',
  'resorbed',
];

export const TOOTH_RECORD_STATUS_OPTIONS: ToothRecordStatus[] = [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
];

export const CHART_NOTE_TOOTH_NUMBER = 'chart_note';

export function isPermanentToothNumber(value?: string | null): value is string {
  return !!value && /^(1|2|3|4)[1-8]$/.test(value);
}

export function isChartNoteRecord(record?: Pick<DentalTreatmentRecord, 'tooth_number'> | null): boolean {
  return record?.tooth_number === CHART_NOTE_TOOTH_NUMBER;
}

export function isConditionType(value: string): value is ConditionType {
  return Object.values(ConditionType).includes(value as ConditionType);
}

export function toConditionType(value?: string | null): ConditionType {
  if (!value) return ConditionType.SOUND;

  const normalized = value.toLowerCase();
  if (isConditionType(normalized)) return normalized;

  if (normalized.includes('سليم') || normalized === 'healthy') return ConditionType.SOUND;
  if (normalized.includes('caries') || normalized.includes('decay') || normalized.includes('تسوس')) return ConditionType.CARIES;
  if (normalized.includes('filled') || normalized.includes('restoration') || normalized.includes('محشو')) return ConditionType.FILLED;
  if (normalized.includes('crown') || normalized.includes('تاج')) return ConditionType.CROWN;
  if (normalized.includes('root') || normalized.includes('عصب')) return ConditionType.ROOT_CANAL;
  if (normalized.includes('implant') || normalized.includes('زراعة')) return ConditionType.IMPLANT;
  if (normalized.includes('missing') || normalized.includes('مفقود')) return ConditionType.MISSING;
  if (normalized.includes('fractured') || normalized.includes('كسر') || normalized.includes('مكسور')) return ConditionType.FRACTURED;
  if (normalized.includes('periapical') || normalized.includes('ذرو')) return ConditionType.PERIAPICAL_LESION;
  if (normalized.includes('periodontal') || normalized.includes('لثوي')) return ConditionType.PERIODONTAL_DISEASE;

  return ConditionType.SOUND;
}

export function createDefaultSurfaces(): ToothSurfaceState {
  return {
    mesial: ConditionType.SOUND,
    distal: ConditionType.SOUND,
    buccal: ConditionType.SOUND,
    lingual: ConditionType.SOUND,
    occlusal: ConditionType.SOUND,
  };
}

export function createDefaultClinicalData(): ToothClinicalData {
  return {
    surfaces: createDefaultSurfaces(),
    icdCode: '',
    mobility: MobilityLevel.ZERO,
    probingDepths: [2, 2, 2, 2, 2, 2],
    bleeding: false,
    recession: [0, 0, 0, 0, 0, 0],
    plaqueIndex: 0,
    rootCount: 1,
    endoTreatment: false,
    endoDate: '',
    endoMaterial: '',
    rootConditions: ['healthy'],
    followUpDate: '',
    estimatedCost: '',
  };
}

export function parseToothClinicalData(raw?: string | null): ToothClinicalData {
  const fallback = createDefaultClinicalData();

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<ToothClinicalData>;
    const surfaces = parsed.surfaces || {};
    const rootConditions = Array.isArray(parsed.rootConditions)
      ? parsed.rootConditions.filter((value): value is RootConditionValue => CLINICAL_ROOT_CONDITION_OPTIONS.includes(value as RootConditionValue))
      : fallback.rootConditions;

    return {
      surfaces: {
        mesial: toConditionType(surfaces.mesial),
        distal: toConditionType(surfaces.distal),
        buccal: toConditionType(surfaces.buccal),
        lingual: toConditionType(surfaces.lingual),
        occlusal: toConditionType(surfaces.occlusal),
      },
      icdCode: parsed.icdCode || '',
      mobility: typeof parsed.mobility === 'number' ? parsed.mobility : fallback.mobility,
      probingDepths: Array.isArray(parsed.probingDepths) && parsed.probingDepths.length === 6
        ? parsed.probingDepths.map(value => Number(value) || 0)
        : fallback.probingDepths,
      bleeding: Boolean(parsed.bleeding),
      recession: Array.isArray(parsed.recession) && parsed.recession.length === 6
        ? parsed.recession.map(value => Number(value) || 0)
        : fallback.recession,
      plaqueIndex: typeof parsed.plaqueIndex === 'number' ? parsed.plaqueIndex : fallback.plaqueIndex,
      rootCount: typeof parsed.rootCount === 'number' ? parsed.rootCount : fallback.rootCount,
      endoTreatment: Boolean(parsed.endoTreatment),
      endoDate: parsed.endoDate || '',
      endoMaterial: parsed.endoMaterial || '',
      rootConditions: rootConditions.length > 0 ? rootConditions : fallback.rootConditions,
      followUpDate: parsed.followUpDate || '',
      estimatedCost: parsed.estimatedCost || '',
    };
  } catch {
    return fallback;
  }
}

export function serializeToothClinicalData(data: ToothClinicalData): string {
  return JSON.stringify(data);
}

const SURFACE_LABELS: Record<string, string> = {
  mesial: 'إنسي',
  distal: 'وحشي',
  buccal: 'شدقي',
  lingual: 'لساني',
  occlusal: 'إطباقي',
};

const CONDITION_LABELS: Record<string, string> = {
  caries: 'تسوس',
  filled: 'حشو',
  crown: 'تاج',
  root_canal: 'علاج عصب',
  missing: 'مفقود',
  fractured: 'مكسور',
  periapical_lesion: 'آفة ذروية',
  periodontal_disease: 'مرض لثوي',
};

/**
 * Converts a tooth_surface DB value (possibly serialized ToothClinicalData JSON)
 * to a compact human-readable Arabic label.
 * Returns null for empty/null input.
 */
export function formatToothSurface(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && 'surfaces' in parsed) {
      const surfaces = parsed.surfaces as Record<string, string>;
      const affected = Object.entries(surfaces)
        .filter(([, cond]) => cond && cond !== 'sound')
        .map(([key, cond]) =>
          `${SURFACE_LABELS[key] ?? key}: ${CONDITION_LABELS[cond] ?? cond}`
        );
      return affected.length > 0 ? affected.join(' | ') : 'سليم';
    }
  } catch {
    // Not JSON — display as-is
  }
  return value;
}

export function getDisplayNumber(fdi: string, system: ToothNumberingSystem): string {
  if (system === ToothNumberingSystem.UNIVERSAL) {
    return FDI_TO_UNIVERSAL[fdi] || fdi;
  }

  return fdi;
}

export function getToothKind(fdi: string): 'incisor' | 'canine' | 'premolar' | 'molar' {
  const lastDigit = Number(fdi.slice(-1));
  if (lastDigit === 1 || lastDigit === 2) return 'incisor';
  if (lastDigit === 3) return 'canine';
  if (lastDigit === 4 || lastDigit === 5) return 'premolar';
  return 'molar';
}

export function getQuadrant(fdi: string): 'UL' | 'UR' | 'LL' | 'LR' {
  const quadrant = fdi[0];
  if (quadrant === '1') return 'UR';
  if (quadrant === '2') return 'UL';
  if (quadrant === '3') return 'LL';
  return 'LR';
}

export function sortToothRecords(records: Iterable<DentalTreatmentRecord>): DentalTreatmentRecord[] {
  const sorted = Array.from(records).filter(record => isPermanentToothNumber(record.tooth_number));
  sorted.sort((left, right) => FDI_DISPLAY_ORDER.indexOf(left.tooth_number) - FDI_DISPLAY_ORDER.indexOf(right.tooth_number));
  return sorted;
}

export function buildToothRecordsMap(records: DentalTreatmentRecord[]): Map<string, DentalTreatmentRecord> {
  const map = new Map<string, DentalTreatmentRecord>();
  for (const record of records) {
    if (isChartNoteRecord(record) || !isPermanentToothNumber(record.tooth_number)) {
      continue;
    }
    if (!map.has(record.tooth_number)) {
      map.set(record.tooth_number, record);
    }
  }
  return map;
}

export function computeChartStatistics(records: DentalTreatmentRecord[]): ChartStatistics {
  const stats: ChartStatistics = {
    totalTeeth: 32,
    recordedTeeth: 0,
    healthyTeeth: 0,
    decayedTeeth: 0,
    filledTeeth: 0,
    missingTeeth: 0,
    urgentCases: 0,
    rootCanalTeeth: 0,
  };

  for (const record of buildToothRecordsMap(records).values()) {
    const condition = toConditionType(record.diagnosis);
    stats.recordedTeeth += 1;

    if (condition === ConditionType.SOUND) stats.healthyTeeth += 1;
    if (condition === ConditionType.CARIES) stats.decayedTeeth += 1;
    if (condition === ConditionType.FILLED) stats.filledTeeth += 1;
    if (condition === ConditionType.MISSING) stats.missingTeeth += 1;
    if (condition === ConditionType.ROOT_CANAL) stats.rootCanalTeeth += 1;
    if (record.status === 'planned' && (condition === ConditionType.CARIES || condition === ConditionType.PERIAPICAL_LESION)) {
      stats.urgentCases += 1;
    }
  }

  return stats;
}
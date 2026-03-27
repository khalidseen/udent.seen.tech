import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SurfaceConditions {
  mesial: string;
  distal: string;
  buccal: string;
  lingual: string;
  occlusal: string;
}

const SURFACE_COLORS: Record<string, { fill: string; label: string }> = {
  sound:      { fill: '#4CAF50', label: 'سليم' },
  caries:     { fill: '#FF5722', label: 'تسوس' },
  filled:     { fill: '#2196F3', label: 'محشو' },
  crown:      { fill: '#9C27B0', label: 'تاج' },
  root_canal: { fill: '#E91E63', label: 'علاج عصب' },
  fractured:  { fill: '#FF9800', label: 'مكسور' },
};

const SURFACE_COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  sound: { bg: 'bg-green-500', text: 'text-green-600' },
  caries: { bg: 'bg-red-500', text: 'text-red-600' },
  filled: { bg: 'bg-blue-500', text: 'text-blue-600' },
  crown: { bg: 'bg-purple-500', text: 'text-purple-600' },
  root_canal: { bg: 'bg-pink-500', text: 'text-pink-600' },
  fractured: { bg: 'bg-orange-500', text: 'text-orange-600' },
};

const CONDITIONS = Object.keys(SURFACE_COLORS);

type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar';
type ArchType = 'maxillary' | 'mandibular';

interface ToothIdentity {
  quadrant: number;
  position: number;
  arch: ArchType;
}

interface ToothAnatomyProfile {
  specificNameAr: string;
  specificNameEn: string;
  buccalLabel: string;
  lingualLabel: string;
}

interface RootInfo {
  count: number;
  noteAr: string;
}

type MorphologyVariant =
  | 'incisor_central'
  | 'incisor_lateral'
  | 'canine_maxillary'
  | 'canine_mandibular'
  | 'premolar_1_maxillary'
  | 'premolar_2_maxillary'
  | 'premolar_1_mandibular'
  | 'premolar_2_mandibular'
  | 'molar_1_maxillary'
  | 'molar_2_maxillary'
  | 'molar_3_maxillary'
  | 'molar_1_mandibular'
  | 'molar_2_mandibular'
  | 'molar_3_mandibular'
  | 'generic';

function getToothType(toothNumber?: string): ToothType {
  if (!toothNumber) return 'molar';
  const lastDigit = parseInt(toothNumber.slice(-1), 10);
  if (lastDigit === 1 || lastDigit === 2) return 'incisor';
  if (lastDigit === 3) return 'canine';
  if (lastDigit === 4 || lastDigit === 5) return 'premolar';
  return 'molar';
}

function getCenterSurfaceLabel(type: ToothType): { en: string; ar: string } {
  if (type === 'incisor' || type === 'canine') {
    return { en: 'I', ar: 'القاطع (I)' };
  }
  return { en: 'O', ar: 'الإطباقي (O)' };
}

function parseToothIdentity(toothNumber?: string): ToothIdentity | null {
  if (!toothNumber) return null;
  const digits = toothNumber.replace(/\D/g, '');
  if (digits.length < 2) return null;

  const quadrant = parseInt(digits[digits.length - 2], 10);
  const position = parseInt(digits[digits.length - 1], 10);
  if (!Number.isFinite(quadrant) || !Number.isFinite(position)) return null;
  if (quadrant < 1 || quadrant > 4 || position < 1 || position > 8) return null;

  return {
    quadrant,
    position,
    arch: quadrant === 1 || quadrant === 2 ? 'maxillary' : 'mandibular',
  };
}

function getToothAnatomyProfile(toothNumber?: string): ToothAnatomyProfile {
  const identity = parseToothIdentity(toothNumber);
  if (!identity) {
    return {
      specificNameAr: 'سن غير محدد',
      specificNameEn: 'Unspecified Tooth',
      buccalLabel: 'الشدقي (B)',
      lingualLabel: 'اللساني (L)',
    };
  }

  const namesByPosition: Record<number, { ar: string; en: string }> = {
    1: { ar: 'القاطع المركزي', en: 'Central Incisor' },
    2: { ar: 'القاطع الجانبي', en: 'Lateral Incisor' },
    3: { ar: 'الناب', en: 'Canine' },
    4: { ar: 'الضاحك الأول', en: 'First Premolar' },
    5: { ar: 'الضاحك الثاني', en: 'Second Premolar' },
    6: { ar: 'الطاحن الأول', en: 'First Molar' },
    7: { ar: 'الطاحن الثاني', en: 'Second Molar' },
    8: { ar: 'الطاحن الثالث', en: 'Third Molar' },
  };

  const archAr = identity.arch === 'maxillary' ? 'فك علوي' : 'فك سفلي';
  const archEn = identity.arch === 'maxillary' ? 'Maxillary' : 'Mandibular';
  const baseName = namesByPosition[identity.position] || { ar: 'سن', en: 'Tooth' };
  const isAnterior = identity.position <= 3;

  return {
    specificNameAr: `${baseName.ar} (${archAr})`,
    specificNameEn: `${archEn} ${baseName.en}`,
    buccalLabel: isAnterior ? 'الشفوي (La)' : 'الشدقي (B)',
    lingualLabel: identity.arch === 'maxillary' ? 'الحنكي (P)' : 'اللساني (L)',
  };
}

function getToothMorphologyVariant(toothNumber: string | undefined, toothType: ToothType): MorphologyVariant {
  const identity = parseToothIdentity(toothNumber);
  if (!identity) return 'generic';

  if (toothType === 'incisor') {
    return identity.position === 1 ? 'incisor_central' : 'incisor_lateral';
  }

  if (toothType === 'canine') {
    return identity.arch === 'maxillary' ? 'canine_maxillary' : 'canine_mandibular';
  }

  if (toothType === 'premolar') {
    if (identity.arch === 'maxillary') {
      return identity.position === 4 ? 'premolar_1_maxillary' : 'premolar_2_maxillary';
    }
    return identity.position === 4 ? 'premolar_1_mandibular' : 'premolar_2_mandibular';
  }

  if (identity.arch === 'maxillary') {
    if (identity.position === 6) return 'molar_1_maxillary';
    if (identity.position === 7) return 'molar_2_maxillary';
    return 'molar_3_maxillary';
  }

  if (identity.position === 6) return 'molar_1_mandibular';
  if (identity.position === 7) return 'molar_2_mandibular';
  return 'molar_3_mandibular';
}

function getTypicalRootInfo(toothNumber: string | undefined, toothType: ToothType): RootInfo {
  const identity = parseToothIdentity(toothNumber);
  if (!identity) {
    return { count: 2, noteAr: 'عدد جذور تقريبي لعدم توفر رقم سن صالح' };
  }

  if (toothType === 'incisor' || toothType === 'canine') {
    return { count: 1, noteAr: 'غالبا جذر واحد' };
  }

  if (toothType === 'premolar') {
    if (identity.arch === 'maxillary' && identity.position === 4) {
      return { count: 2, noteAr: 'غالبا جذران في الضاحك الأول العلوي' };
    }
    if (identity.arch === 'maxillary' && identity.position === 5) {
      return { count: 1, noteAr: 'غالبا جذر واحد (قد يظهر جذر ثان في بعض الحالات)' };
    }
    return { count: 1, noteAr: 'غالبا جذر واحد' };
  }

  if (identity.arch === 'maxillary') {
    if (identity.position === 8) {
      return { count: 3, noteAr: 'غالبا 3 جذور (قد تختلف في ضرس العقل)' };
    }
    return { count: 3, noteAr: 'غالبا 3 جذور' };
  }

  if (identity.position === 8) {
    return { count: 2, noteAr: 'غالبا جذران (قد تختلف في ضرس العقل)' };
  }
  return { count: 2, noteAr: 'غالبا جذران' };
}

function getRootDirectionLabels(arch: ArchType | undefined, count: number): string[] {
  if (!arch) {
    return Array.from({ length: count }, (_, idx) => `R${idx + 1}`);
  }

  if (arch === 'maxillary') {
    if (count >= 3) return ['MB', 'DB', 'P'];
    if (count === 2) return ['B', 'P'];
    return ['P'];
  }

  if (count >= 2) return ['M', 'D'];
  return ['M'];
}

function getRootDirectionArabic(label: string): string {
  switch (label) {
    case 'MB':
      return 'الأنسي الشدقي';
    case 'DB':
      return 'الوحشي الشدقي';
    case 'P':
      return 'الحنكي';
    case 'B':
      return 'الشدقي';
    case 'M':
      return 'الأنسي';
    case 'D':
      return 'الوحشي';
    default:
      return 'اتجاه جذري';
  }
}

interface ToothSurfaceSVGProps {
  surfaces: SurfaceConditions;
  onSurfaceClick: (surface: keyof SurfaceConditions) => void;
  toothNumber?: string;
  clinicalRootCount?: number;
}

export const ToothSurfaceSVG: React.FC<ToothSurfaceSVGProps> = ({ surfaces, onSurfaceClick, toothNumber, clinicalRootCount }) => {
  const getColor = (condition: string) => SURFACE_COLORS[condition]?.fill || SURFACE_COLORS.sound.fill;
  const getLabel = (condition: string) => SURFACE_COLORS[condition]?.label || 'سليم';
  const toothType = getToothType(toothNumber);
  const centerLabel = getCenterSurfaceLabel(toothType);
  const toothIdentity = parseToothIdentity(toothNumber);
  const anatomyProfile = getToothAnatomyProfile(toothNumber);
  const morphologyVariant = getToothMorphologyVariant(toothNumber, toothType);
  const rootInfo = getTypicalRootInfo(toothNumber, toothType);
  const isClinicalRootCountValid = Number.isFinite(clinicalRootCount) && (clinicalRootCount as number) >= 1 && (clinicalRootCount as number) <= 4;
  const displayedRootCount = isClinicalRootCountValid ? (clinicalRootCount as number) : rootInfo.count;
  const rootDirectionLabels = getRootDirectionLabels(toothIdentity?.arch, displayedRootCount);
  const rootCountNote = isClinicalRootCountValid && displayedRootCount !== rootInfo.count
    ? `مسجل سريرياً: ${displayedRootCount} (المتوقع غالبا ${rootInfo.count})`
    : rootInfo.noteAr;
  const [viewMode, setViewMode] = useState<'occlusal' | 'roots'>('occlusal');
  const [showRootOverlay, setShowRootOverlay] = useState(false);

  const surfaceNames = {
    buccal: anatomyProfile.buccalLabel,
    mesial: 'الإنسي (M)',
    distal: 'الوحشي (D)',
    lingual: anatomyProfile.lingualLabel,
    occlusal: centerLabel.ar,
  };

  const activeSurfaces = (Object.keys(surfaces) as (keyof SurfaceConditions)[]).filter(
    (surface) => surfaces[surface] !== 'sound'
  );

  const hasCritical = activeSurfaces.some((surface) =>
    ['caries', 'fractured', 'periapical_lesion'].includes(surfaces[surface])
  );

  const commonPathProps = (surface: keyof SurfaceConditions) => ({
    fill: getColor(surfaces[surface]),
    stroke: '#c4b896',
    strokeWidth: 1.5,
    filter: 'url(#innerShadow)',
    className: 'cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-2',
    onClick: () => onSurfaceClick(surface),
    opacity: 0.86,
  });

  const renderDefs = () => (
    <defs>
      <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
        <feOffset dx="1" dy="2" result="offsetBlur" />
        <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="inverse" />
        <feFlood floodColor="#000" floodOpacity="0.25" result="color" />
        <feComposite in="color" in2="inverse" operator="in" result="shadow" />
        <feComposite in="SourceGraphic" in2="shadow" operator="over" />
      </filter>
      <linearGradient id="toothBorder" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d4c5a9" />
        <stop offset="100%" stopColor="#b8a88a" />
      </linearGradient>
      <radialGradient id="enamelShine" cx="30%" cy="25%" r="80%">
        <stop offset="0%" stopColor="#fffdf8" stopOpacity="0.95" />
        <stop offset="55%" stopColor="#f3ecdf" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#e5d8c0" stopOpacity="0.7" />
      </radialGradient>
    </defs>
  );

  const labelStyle = { fontSize: 13, fill: 'white', fontWeight: 'bold' as const, pointerEvents: 'none' as const, stroke: '#00000040', strokeWidth: 0.5 };

  const renderIncisalMorphology = () => {
    if (morphologyVariant === 'incisor_central') {
      return (
        <>
          <path d="M 90 110 Q 150 95, 210 110" fill="none" stroke="#8f8168" strokeWidth="1.3" opacity="0.55" pointerEvents="none" />
          <path d="M 95 140 Q 150 152, 205 140" fill="none" stroke="#9b8d72" strokeWidth="1" opacity="0.4" pointerEvents="none" />
        </>
      );
    }

    return (
      <>
        <path d="M 98 112 Q 150 98, 202 112" fill="none" stroke="#8f8168" strokeWidth="1.2" opacity="0.52" pointerEvents="none" />
        <ellipse cx="150" cy="145" rx="45" ry="18" fill="none" stroke="#9b8d72" strokeWidth="1" opacity="0.35" pointerEvents="none" />
      </>
    );
  };

  const renderCanineMorphology = () => {
    if (morphologyVariant === 'canine_maxillary') {
      return (
        <>
          <path d="M 100 175 Q 150 122, 200 175" fill="none" stroke="#8f8168" strokeWidth="1.4" opacity="0.55" pointerEvents="none" />
          <path d="M 118 186 Q 150 164, 182 186" fill="none" stroke="#9b8d72" strokeWidth="1" opacity="0.38" pointerEvents="none" />
        </>
      );
    }

    return (
      <>
        <path d="M 108 176 Q 150 132, 192 176" fill="none" stroke="#8f8168" strokeWidth="1.2" opacity="0.5" pointerEvents="none" />
        <circle cx="150" cy="152" r="4" fill="#9b8d72" opacity="0.28" pointerEvents="none" />
      </>
    );
  };

  const renderPremolarMorphology = () => {
    switch (morphologyVariant) {
      case 'premolar_1_maxillary':
        return (
          <>
            <path d="M 80 140 Q 150 150, 220 140" fill="none" stroke="#8f8168" strokeWidth="1.6" opacity="0.58" pointerEvents="none" />
            <path d="M 120 92 Q 135 120, 122 152" fill="none" stroke="#9b8d72" strokeWidth="1.2" opacity="0.42" pointerEvents="none" />
            <path d="M 178 92 Q 165 120, 178 152" fill="none" stroke="#9b8d72" strokeWidth="1.2" opacity="0.42" pointerEvents="none" />
          </>
        );
      case 'premolar_2_maxillary':
        return (
          <>
            <path d="M 82 140 Q 150 145, 218 140" fill="none" stroke="#8f8168" strokeWidth="1.4" opacity="0.55" pointerEvents="none" />
            <path d="M 110 112 Q 150 128, 190 112" fill="none" stroke="#9b8d72" strokeWidth="1" opacity="0.38" pointerEvents="none" />
          </>
        );
      case 'premolar_1_mandibular':
        return (
          <>
            <path d="M 90 128 Q 150 118, 210 132" fill="none" stroke="#8f8168" strokeWidth="1.5" opacity="0.58" pointerEvents="none" />
            <path d="M 135 144 Q 150 154, 168 144" fill="none" stroke="#9b8d72" strokeWidth="1" opacity="0.4" pointerEvents="none" />
          </>
        );
      case 'premolar_2_mandibular':
        return (
          <>
            <path d="M 84 138 Q 150 152, 216 138" fill="none" stroke="#8f8168" strokeWidth="1.45" opacity="0.56" pointerEvents="none" />
            <path d="M 110 158 Q 150 136, 190 158" fill="none" stroke="#9b8d72" strokeWidth="1" opacity="0.4" pointerEvents="none" />
          </>
        );
      default:
        return (
          <path d="M 75 140 Q 150 145, 225 140" fill="none" stroke="#8f8168" strokeWidth="1.4" opacity="0.52" pointerEvents="none" />
        );
    }
  };

  const renderMolarMorphology = () => {
    switch (morphologyVariant) {
      case 'molar_1_maxillary':
        return (
          <>
            <path d="M 92 132 Q 130 150, 160 138 Q 188 126, 212 146" fill="none" stroke="#8f8168" strokeWidth="1.7" opacity="0.62" pointerEvents="none" />
            <path d="M 105 172 Q 150 156, 198 176" fill="none" stroke="#9b8d72" strokeWidth="1.2" opacity="0.5" pointerEvents="none" />
            <path d="M 150 110 Q 147 140, 150 190" fill="none" stroke="#9b8d72" strokeWidth="1" opacity="0.34" pointerEvents="none" />
          </>
        );
      case 'molar_2_maxillary':
        return (
          <>
            <path d="M 98 138 Q 150 154, 206 142" fill="none" stroke="#8f8168" strokeWidth="1.5" opacity="0.58" pointerEvents="none" />
            <path d="M 118 168 Q 150 152, 188 170" fill="none" stroke="#9b8d72" strokeWidth="1.1" opacity="0.45" pointerEvents="none" />
          </>
        );
      case 'molar_3_maxillary':
        return (
          <>
            <path d="M 102 148 Q 152 126, 200 152" fill="none" stroke="#8f8168" strokeWidth="1.4" opacity="0.52" pointerEvents="none" />
            <path d="M 108 174 Q 152 186, 194 168" fill="none" stroke="#9b8d72" strokeWidth="1" opacity="0.42" pointerEvents="none" />
          </>
        );
      case 'molar_1_mandibular':
        return (
          <>
            <path d="M 100 124 L 150 160 L 200 124" fill="none" stroke="#8f8168" strokeWidth="1.7" opacity="0.62" pointerEvents="none" />
            <path d="M 100 196 L 150 160 L 200 196" fill="none" stroke="#9b8d72" strokeWidth="1.45" opacity="0.56" pointerEvents="none" />
            <circle cx="150" cy="160" r="3.2" fill="#9b8d72" opacity="0.36" pointerEvents="none" />
          </>
        );
      case 'molar_2_mandibular':
        return (
          <>
            <path d="M 105 138 Q 150 158, 195 138" fill="none" stroke="#8f8168" strokeWidth="1.55" opacity="0.6" pointerEvents="none" />
            <path d="M 105 182 Q 150 162, 195 182" fill="none" stroke="#9b8d72" strokeWidth="1.25" opacity="0.5" pointerEvents="none" />
            <path d="M 150 120 Q 148 150, 150 198" fill="none" stroke="#9b8d72" strokeWidth="1.05" opacity="0.36" pointerEvents="none" />
          </>
        );
      case 'molar_3_mandibular':
        return (
          <>
            <path d="M 108 142 Q 150 128, 192 150" fill="none" stroke="#8f8168" strokeWidth="1.35" opacity="0.52" pointerEvents="none" />
            <path d="M 112 178 Q 150 194, 188 170" fill="none" stroke="#9b8d72" strokeWidth="1" opacity="0.42" pointerEvents="none" />
          </>
        );
      default:
        return (
          <>
            <path d="M 105 150 Q 130 165, 150 160 Q 170 165, 195 150" fill="none" stroke="#8f8168" strokeWidth="1.2" opacity="0.58" pointerEvents="none" />
            <path d="M 150 120 Q 148 140, 150 160 Q 152 180, 150 195" fill="none" stroke="#9b8d72" strokeWidth="1" opacity="0.4" pointerEvents="none" />
          </>
        );
    }
  };

  const renderIncisor = () => (
    <svg viewBox="0 0 300 260" width="280" height="250" className="drop-shadow-xl">
      {renderDefs()}
      {/* Outer tooth shape - elongated oval (incisor occlusal view) */}
      <ellipse cx="150" cy="130" rx="130" ry="100" fill="url(#enamelShine)" stroke="url(#toothBorder)" strokeWidth="3" />

      {/* BUCCAL (Top) - wide labial surface */}
      <path d="M 150 30 C 100 30, 45 55, 28 90 C 35 85, 70 78, 110 75 C 130 74, 170 74, 190 75 C 230 78, 265 85, 272 90 C 255 55, 200 30, 150 30 Z" {...commonPathProps('buccal')} />

      {/* MESIAL (Left) */}
      <path d="M 28 90 C 20 110, 20 145, 28 170 C 40 160, 55 140, 65 130 C 70 120, 70 100, 65 90 C 55 82, 35 85, 28 90 Z" {...commonPathProps('mesial')} />

      {/* DISTAL (Right) */}
      <path d="M 272 90 C 280 110, 280 145, 272 170 C 260 160, 245 140, 235 130 C 230 120, 230 100, 235 90 C 245 82, 265 85, 272 90 Z" {...commonPathProps('distal')} />

      {/* LINGUAL (Bottom) - with cingulum bump */}
      <path d="M 28 170 C 20 145, 20 145, 28 170 C 45 200, 80 225, 120 232 C 135 234, 150 238, 150 238 C 150 238, 165 234, 180 232 C 220 225, 255 200, 272 170 C 260 160, 245 140, 235 130 C 220 145, 195 165, 170 170 C 155 172, 145 172, 130 170 C 105 165, 80 145, 65 130 C 55 140, 40 160, 28 170 Z" {...commonPathProps('lingual')} />
      {/* Cingulum ridge */}
      <ellipse cx="150" cy="210" rx="30" ry="10" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

      {/* INCISAL (Center) - thin incisal edge */}
      <path d="M 65 90 C 70 100, 70 120, 65 130 C 80 145, 105 165, 130 170 C 145 172, 155 172, 170 170 C 195 165, 220 145, 235 130 C 230 120, 230 100, 235 90 C 230 78, 190 75, 150 74 C 110 75, 70 78, 65 90 Z"
        fill={getColor(surfaces.occlusal)} stroke="#b8a070" strokeWidth="2" filter="url(#innerShadow)"
        className="cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-2"
        onClick={() => onSurfaceClick('occlusal')} opacity="0.92" />
      {/* Incisal anatomy */}
      {renderIncisalMorphology()}

      {/* Labels */}
      <text x="150" y="55" textAnchor="middle" {...labelStyle}>B</text>
      <text x="35" y="135" textAnchor="middle" {...labelStyle}>M</text>
      <text x="265" y="135" textAnchor="middle" {...labelStyle}>D</text>
      <text x="150" y="220" textAnchor="middle" {...labelStyle}>L</text>
      <text x="150" y="125" textAnchor="middle" {...labelStyle} fontSize={12}>{centerLabel.en}</text>
    </svg>
  );

  const renderCanine = () => (
    <svg viewBox="0 0 300 300" width="280" height="280" className="drop-shadow-xl">
      {renderDefs()}
      {/* Outer tooth shape - diamond-like/pointed oval */}
      <path d="M 150 22 C 100 22, 50 60, 35 110 C 22 155, 30 200, 55 240 C 75 268, 110 285, 150 288 C 190 285, 225 268, 245 240 C 270 200, 278 155, 265 110 C 250 60, 200 22, 150 22 Z"
        fill="url(#enamelShine)" stroke="url(#toothBorder)" strokeWidth="3" />

      {/* BUCCAL (Top) */}
      <path d="M 150 22 C 100 22, 50 60, 35 110 C 50 105, 80 90, 115 82 C 135 78, 150 76, 150 76 C 150 76, 165 78, 185 82 C 220 90, 250 105, 265 110 C 250 60, 200 22, 150 22 Z" {...commonPathProps('buccal')} />

      {/* MESIAL (Left) */}
      <path d="M 35 110 C 22 155, 30 200, 55 240 C 65 225, 70 195, 72 170 C 74 145, 70 120, 65 105 C 55 95, 45 105, 35 110 Z" {...commonPathProps('mesial')} />

      {/* DISTAL (Right) */}
      <path d="M 265 110 C 278 155, 270 200, 245 240 C 235 225, 230 195, 228 170 C 226 145, 230 120, 235 105 C 245 95, 255 105, 265 110 Z" {...commonPathProps('distal')} />

      {/* LINGUAL (Bottom) */}
      <path d="M 55 240 C 75 268, 110 285, 150 288 C 190 285, 225 268, 245 240 C 235 225, 230 195, 228 170 C 215 185, 190 200, 165 205 C 150 208, 150 208, 135 205 C 110 200, 85 185, 72 170 C 70 195, 65 225, 55 240 Z" {...commonPathProps('lingual')} />
      {/* Cingulum */}
      <ellipse cx="150" cy="260" rx="25" ry="8" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

      {/* INCISAL (Center) - pointed cusp tip */}
      <path d="M 65 105 C 70 120, 74 145, 72 170 C 85 185, 110 200, 135 205 C 150 208, 150 208, 165 205 C 190 200, 215 185, 228 170 C 226 145, 230 120, 235 105 C 220 90, 185 82, 150 76 C 115 82, 80 90, 65 105 Z"
        fill={getColor(surfaces.occlusal)} stroke="#b8a070" strokeWidth="2" filter="url(#innerShadow)"
        className="cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-2"
        onClick={() => onSurfaceClick('occlusal')} opacity="0.92" />
      {/* Canine anatomy */}
      {renderCanineMorphology()}

      {/* Labels */}
      <text x="150" y="55" textAnchor="middle" {...labelStyle}>B</text>
      <text x="38" y="175" textAnchor="middle" {...labelStyle}>M</text>
      <text x="262" y="175" textAnchor="middle" {...labelStyle}>D</text>
      <text x="150" y="275" textAnchor="middle" {...labelStyle}>L</text>
      <text x="150" y="155" textAnchor="middle" {...labelStyle} fontSize={12}>{centerLabel.en}</text>
    </svg>
  );

  const renderPremolar = () => (
    <svg viewBox="0 0 300 300" width="280" height="280" className="drop-shadow-xl">
      {renderDefs()}
      {/* Outer tooth shape - smaller oval */}
      <path d="M 150 25 C 105 25, 60 50, 42 90 C 25 130, 25 170, 42 210 C 60 250, 105 275, 150 275 C 195 275, 240 250, 258 210 C 275 170, 275 130, 258 90 C 240 50, 195 25, 150 25 Z"
        fill="url(#enamelShine)" stroke="url(#toothBorder)" strokeWidth="3" />

      {/* BUCCAL (Top) */}
      <path d="M 150 25 C 105 25, 60 50, 42 90 C 55 88, 80 80, 110 75 C 130 72, 150 70, 150 70 C 150 70, 170 72, 190 75 C 220 80, 245 88, 258 90 C 240 50, 195 25, 150 25 Z" {...commonPathProps('buccal')} />
      {/* Buccal cusp ridge */}
      <path d="M 100 55 Q 150 45, 200 55" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

      {/* MESIAL (Left) */}
      <path d="M 42 90 C 25 130, 25 170, 42 210 C 55 195, 62 170, 65 150 C 68 130, 65 110, 60 95 C 55 88, 48 88, 42 90 Z" {...commonPathProps('mesial')} />

      {/* DISTAL (Right) */}
      <path d="M 258 90 C 275 130, 275 170, 258 210 C 245 195, 238 170, 235 150 C 232 130, 235 110, 240 95 C 245 88, 252 88, 258 90 Z" {...commonPathProps('distal')} />

      {/* LINGUAL (Bottom) */}
      <path d="M 42 210 C 60 250, 105 275, 150 275 C 195 275, 240 250, 258 210 C 245 195, 238 170, 235 150 C 215 165, 185 180, 155 185 C 145 185, 115 180, 95 170 C 80 162, 68 155, 65 150 C 62 170, 55 195, 42 210 Z" {...commonPathProps('lingual')} />
      {/* Lingual cusp ridge */}
      <path d="M 100 250 Q 150 240, 200 250" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

      {/* OCCLUSAL (Center) - two cusps with central groove */}
      <path d="M 60 95 C 65 110, 68 130, 65 150 C 80 162, 115 180, 145 185 C 155 185, 185 180, 215 165 C 238 150, 235 150, 235 150 C 232 130, 235 110, 240 95 C 220 80, 190 75, 150 70 C 110 75, 80 80, 60 95 Z"
        fill={getColor(surfaces.occlusal)} stroke="#b8a070" strokeWidth="2" filter="url(#innerShadow)"
        className="cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-2"
        onClick={() => onSurfaceClick('occlusal')} opacity="0.92" />
      {/* Premolar anatomy */}
      {renderPremolarMorphology()}

      {/* Labels */}
      <text x="150" y="50" textAnchor="middle" {...labelStyle}>B</text>
      <text x="38" y="155" textAnchor="middle" {...labelStyle}>M</text>
      <text x="262" y="155" textAnchor="middle" {...labelStyle}>D</text>
      <text x="150" y="262" textAnchor="middle" {...labelStyle}>L</text>
      <text x="150" y="145" textAnchor="middle" {...labelStyle} fontSize={12}>{centerLabel.en}</text>
    </svg>
  );

  const renderMolar = () => (
    <svg viewBox="0 0 300 300" width="280" height="280" className="drop-shadow-xl">
      {renderDefs()}
      {/* Outer tooth shape - large molar */}
      <path d="M 150 18 C 100 18, 55 40, 38 80 C 22 118, 20 150, 28 185 C 36 220, 60 258, 95 274 C 120 284, 140 286, 150 286 C 160 286, 180 284, 205 274 C 240 258, 264 220, 272 185 C 280 150, 278 118, 262 80 C 245 40, 200 18, 150 18 Z"
        fill="url(#enamelShine)" stroke="url(#toothBorder)" strokeWidth="3" />

      {/* BUCCAL (Top) */}
      <path d="M 150 18 C 100 18, 55 40, 38 80 C 22 118, 24 135, 60 120 C 85 112, 115 105, 150 102 C 185 105, 215 112, 240 120 C 276 135, 278 118, 262 80 C 245 40, 200 18, 150 18 Z" {...commonPathProps('buccal')} />
      <path d="M 90 55 Q 120 70, 150 65 Q 180 70, 210 55" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

      {/* MESIAL (Left) */}
      <path d="M 38 80 C 22 118, 20 150, 28 185 C 36 210, 50 230, 65 240 C 75 230, 80 200, 75 170 C 72 145, 68 130, 60 120 C 24 135, 22 118, 38 80 Z" {...commonPathProps('mesial')} />
      <path d="M 50 130 Q 60 160, 55 190" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

      {/* DISTAL (Right) */}
      <path d="M 262 80 C 278 118, 280 150, 272 185 C 264 210, 250 230, 235 240 C 225 230, 220 200, 225 170 C 228 145, 232 130, 240 120 C 276 135, 278 118, 262 80 Z" {...commonPathProps('distal')} />
      <path d="M 250 130 Q 240 160, 245 190" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

      {/* LINGUAL (Bottom) */}
      <path d="M 65 240 C 50 230, 36 220, 28 185 C 20 150, 28 185, 28 185 C 36 220, 60 258, 95 274 C 120 284, 140 286, 150 286 C 160 286, 180 284, 205 274 C 240 258, 264 220, 272 185 C 272 185, 280 150, 272 185 C 264 210, 250 230, 235 240 C 225 245, 210 220, 200 200 C 185 195, 165 198, 150 200 C 135 198, 115 195, 100 200 C 90 220, 75 245, 65 240 Z" {...commonPathProps('lingual')} />
      <path d="M 100 255 Q 130 245, 150 248 Q 170 245, 200 255" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

      {/* OCCLUSAL (Center) */}
      <path d="M 60 120 C 68 130, 72 145, 75 170 C 80 200, 75 230, 65 240 C 75 245, 90 220, 100 200 C 115 195, 135 198, 150 200 C 165 198, 185 195, 200 200 C 210 220, 225 245, 235 240 C 225 230, 220 200, 225 170 C 228 145, 232 130, 240 120 C 215 112, 185 105, 150 102 C 115 105, 85 112, 60 120 Z"
        fill={getColor(surfaces.occlusal)} stroke="#b8a070" strokeWidth="2" filter="url(#innerShadow)"
        className="cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-2"
        onClick={() => onSurfaceClick('occlusal')} opacity="0.92" />
      {renderMolarMorphology()}

      {/* Labels */}
      <text x="150" y="55" textAnchor="middle" {...labelStyle}>B</text>
      <text x="42" y="160" textAnchor="middle" {...labelStyle}>M</text>
      <text x="258" y="160" textAnchor="middle" {...labelStyle}>D</text>
      <text x="150" y="265" textAnchor="middle" {...labelStyle}>L</text>
      <text x="150" y="165" textAnchor="middle" {...labelStyle} fontSize={12}>{centerLabel.en}</text>
    </svg>
  );

  const renderRootSideView = () => {
    const rootTone = surfaces.occlusal === 'root_canal' ? '#f1d2df' : '#ead8bf';
    const rootXs = displayedRootCount === 1 ? [150] : displayedRootCount === 2 ? [128, 172] : displayedRootCount === 3 ? [108, 150, 192] : [92, 134, 166, 208];

    return (
      <svg viewBox="0 0 300 300" width="280" height="280" className="drop-shadow-xl">
        {renderDefs()}

        {/* Crown shell */}
        <path
          d="M 70 55 C 95 35, 125 26, 150 26 C 175 26, 205 35, 230 55 C 245 70, 252 95, 248 122 C 242 154, 222 175, 198 186 C 180 194, 166 196, 150 196 C 134 196, 120 194, 102 186 C 78 175, 58 154, 52 122 C 48 95, 55 70, 70 55 Z"
          fill="url(#enamelShine)"
          stroke="url(#toothBorder)"
          strokeWidth="3"
        />

        {/* Surface zones in side view */}
        <path
          d="M 82 62 C 108 44, 132 38, 150 38 C 168 38, 192 44, 218 62 C 224 74, 224 88, 218 99 C 198 90, 176 84, 150 82 C 124 84, 102 90, 82 99 C 76 88, 76 74, 82 62 Z"
          {...commonPathProps('occlusal')}
        />
        <path
          d="M 82 99 C 102 90, 124 84, 150 82 C 176 84, 198 90, 218 99 C 224 112, 226 128, 220 142 C 200 156, 178 162, 150 164 C 122 162, 100 156, 80 142 C 74 128, 76 112, 82 99 Z"
          {...commonPathProps('buccal')}
        />
        <path
          d="M 80 142 C 100 156, 122 162, 150 164 C 178 162, 200 156, 220 142 C 210 166, 188 182, 150 188 C 112 182, 90 166, 80 142 Z"
          {...commonPathProps('lingual')}
        />
        <path d="M 70 60 C 60 78, 54 96, 56 118 C 60 140, 72 160, 94 174 C 82 150, 79 124, 82 99 C 76 88, 76 74, 82 62 C 78 62, 74 61, 70 60 Z" {...commonPathProps('mesial')} />
        <path d="M 230 60 C 240 78, 246 96, 244 118 C 240 140, 228 160, 206 174 C 218 150, 221 124, 218 99 C 224 88, 224 74, 218 62 C 222 62, 226 61, 230 60 Z" {...commonPathProps('distal')} />

        {/* CEJ line */}
        <path d="M 90 170 Q 150 184, 210 170" fill="none" stroke="#a99676" strokeWidth="1.2" opacity="0.65" pointerEvents="none" />

        {/* Roots */}
        {rootXs.map((x, idx) => (
          <path
            key={idx}
            d={`M ${x} 174 C ${x - 16} 206, ${x - 14} 238, ${x - 7} 266 C ${x} 274, ${x + 7} 274, ${x + 12} 266 C ${x + 19} 238, ${x + 17} 206, ${x} 174 Z`}
            fill={rootTone}
            stroke="#c5b392"
            strokeWidth="2"
          />
        ))}

        {/* Academic root direction overlay */}
        {showRootOverlay && rootXs.map((x, idx) => (
          <g key={`label-${idx}`}>
            <path d={`M ${x} 226 Q ${x} 210, ${x} 198`} fill="none" stroke="#6b7280" strokeWidth="0.9" strokeDasharray="2 2" opacity="0.75" pointerEvents="none" />
            <rect x={x - 13} y={228} width="26" height="14" rx="4" fill="#ffffffd9" stroke="#9ca3af" strokeWidth="0.8" />
            <title>{getRootDirectionArabic(rootDirectionLabels[idx] || `R${idx + 1}`)}</title>
            <text x={x} y={238} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#374151">{rootDirectionLabels[idx] || `R${idx + 1}`}</text>
          </g>
        ))}

        {/* Root canal hint line */}
        {surfaces.occlusal === 'root_canal' && (
          <path d="M 150 90 Q 148 140, 150 190 Q 152 225, 150 262" fill="none" stroke="#c43b7d" strokeWidth="1.4" opacity="0.7" pointerEvents="none" />
        )}

        <text x="150" y="54" textAnchor="middle" {...labelStyle}>O</text>
        <text x="72" y="132" textAnchor="middle" {...labelStyle}>M</text>
        <text x="228" y="132" textAnchor="middle" {...labelStyle}>D</text>
        <text x="150" y="130" textAnchor="middle" {...labelStyle}>B/L</text>

        {showRootOverlay && (
          <text x="150" y="254" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="600" pointerEvents="none">
            اتجاهات الجذور: {rootDirectionLabels.join(' • ')}
          </text>
        )}
      </svg>
    );
  };

  const renderToothSVG = () => {
    if (viewMode === 'roots') {
      return renderRootSideView();
    }

    switch (toothType) {
      case 'incisor': return renderIncisor();
      case 'canine': return renderCanine();
      case 'premolar': return renderPremolar();
      case 'molar': return renderMolar();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {toothNumber ? `سن ${toothNumber} — ${anatomyProfile.specificNameAr}` : 'عرض إطباقي'}
        </p>
        <p className="text-xs text-muted-foreground">{anatomyProfile.specificNameEn} • انقر على السطح لتغيير حالته</p>
      </div>

      <div className="w-full rounded-xl border bg-white/80 p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border bg-background p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('occlusal')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${viewMode === 'occlusal' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              المنظر الإطباقي
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('roots');
                setShowRootOverlay(true);
              }}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${viewMode === 'roots' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              المنظر الجانبي الجذري
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowRootOverlay(prev => !prev)}
            disabled={viewMode !== 'roots'}
            className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${showRootOverlay ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-border text-muted-foreground'} ${viewMode !== 'roots' ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted'}`}
          >
            Overlay الاتجاهات
          </button>

          <div className="text-[11px] text-muted-foreground">
            الجذور المعروضة: <span className="font-semibold text-foreground">{displayedRootCount}</span> • {rootCountNote}
          </div>
        </div>

        {viewMode === 'roots' && showRootOverlay && (
          <TooltipProvider delayDuration={120}>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
              {rootDirectionLabels.map((dir, idx) => (
                <Tooltip key={`${dir}-${idx}`}>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help items-center rounded-md border bg-background px-2 py-0.5 font-semibold text-slate-700">
                      {dir}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {getRootDirectionArabic(dir)}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}
      </div>

      <div className={`w-full rounded-xl border px-3 py-2 text-xs ${hasCritical ? 'border-red-300 bg-red-50/60' : 'border-emerald-300 bg-emerald-50/60'}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-foreground">ملخص تشريحي فوري</span>
          <span className={`font-bold ${hasCritical ? 'text-red-700' : 'text-emerald-700'}`}>
            {activeSurfaces.length === 0 ? 'سليم بالكامل' : `${activeSurfaces.length} سطح متأثر`}
          </span>
        </div>
        {activeSurfaces.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {activeSurfaces.map((surface) => (
              <span key={surface} className="inline-flex items-center gap-1 rounded-full border bg-background/80 px-2 py-0.5 text-[10px]">
                <span className={`h-2 w-2 rounded-full ${SURFACE_COLOR_CLASSES[surfaces[surface]]?.bg || 'bg-muted-foreground'}`} />
                {surfaceNames[surface]}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative rounded-2xl bg-gradient-to-b from-background to-muted/30 p-2 shadow-inner">
        {renderToothSVG()}
      </div>

      {/* Surface status cards */}
      <div className="grid grid-cols-5 gap-2 w-full">
        {(['buccal', 'mesial', 'occlusal', 'distal', 'lingual'] as const).map(surface => (
          <button
            key={surface}
            onClick={() => onSurfaceClick(surface)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors
              ${surfaces[surface] !== 'sound' ? 'ring-1 ring-offset-1 ring-primary/30 border-primary/50' : ''}`}
          >
            <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${SURFACE_COLOR_CLASSES[surfaces[surface]]?.bg || 'bg-muted-foreground'}`} />
            <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">{surfaceNames[surface]}</span>
            <span className={`text-[9px] font-bold ${SURFACE_COLOR_CLASSES[surfaces[surface]]?.text || 'text-muted-foreground'}`}>{getLabel(surfaces[surface])}</span>
          </button>
        ))}
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap gap-3 justify-center pt-2 border-t w-full">
        {CONDITIONS.map(c => (
          <div key={c} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full shadow-sm ${SURFACE_COLOR_CLASSES[c]?.bg || 'bg-muted-foreground'}`} />
            <span className="text-xs text-muted-foreground">{SURFACE_COLORS[c].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SURFACE_CONDITION_CYCLE = CONDITIONS;

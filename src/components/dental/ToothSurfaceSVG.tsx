import React from 'react';

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

const CONDITIONS = Object.keys(SURFACE_COLORS);

type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar';

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

const SURFACE_NAMES_BASE: Record<string, string> = {
  buccal: 'الشدقي (B)',
  mesial: 'الإنسي (M)',
  distal: 'الوحشي (D)',
  lingual: 'اللساني (L)',
};

interface ToothSurfaceSVGProps {
  surfaces: SurfaceConditions;
  onSurfaceClick: (surface: keyof SurfaceConditions) => void;
  toothNumber?: string;
}

export const ToothSurfaceSVG: React.FC<ToothSurfaceSVGProps> = ({ surfaces, onSurfaceClick, toothNumber }) => {
  const getColor = (condition: string) => SURFACE_COLORS[condition]?.fill || SURFACE_COLORS.sound.fill;
  const getLabel = (condition: string) => SURFACE_COLORS[condition]?.label || 'سليم';
  const toothType = getToothType(toothNumber);
  const centerLabel = getCenterSurfaceLabel(toothType);

  const surfaceNames = {
    ...SURFACE_NAMES_BASE,
    occlusal: centerLabel.ar,
  };

  const commonPathProps = (surface: keyof SurfaceConditions) => ({
    fill: getColor(surfaces[surface]),
    stroke: '#c4b896',
    strokeWidth: 1.5,
    filter: 'url(#innerShadow)',
    className: 'cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-2',
    onClick: () => onSurfaceClick(surface),
    opacity: 0.9,
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
    </defs>
  );

  const labelStyle = { fontSize: 13, fill: 'white', fontWeight: 'bold' as const, pointerEvents: 'none' as const, stroke: '#00000040', strokeWidth: 0.5 };

  const renderIncisor = () => (
    <svg viewBox="0 0 300 260" width="280" height="250" className="drop-shadow-xl">
      {renderDefs()}
      {/* Outer tooth shape - elongated oval (incisor occlusal view) */}
      <ellipse cx="150" cy="130" rx="130" ry="100" fill="#f5f0e8" stroke="url(#toothBorder)" strokeWidth="3" />

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
      {/* Incisal edge line */}
      <path d="M 80 95 Q 150 85, 220 95" fill="none" stroke="#a09070" strokeWidth="1.2" opacity="0.5" pointerEvents="none" />

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
        fill="#f5f0e8" stroke="url(#toothBorder)" strokeWidth="3" />

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
      {/* Single cusp point */}
      <circle cx="150" cy="140" r="5" fill="#a09070" opacity="0.4" pointerEvents="none" />
      <path d="M 100 170 Q 150 120, 200 170" fill="none" stroke="#a09070" strokeWidth="1.2" opacity="0.5" pointerEvents="none" />

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
        fill="#f5f0e8" stroke="url(#toothBorder)" strokeWidth="3" />

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
      {/* Central groove separating buccal and lingual cusps */}
      <path d="M 75 140 Q 110 145, 150 140 Q 190 145, 225 140" fill="none" stroke="#a09070" strokeWidth="1.5" opacity="0.6" pointerEvents="none" />
      {/* Two cusp dots */}
      <circle cx="150" cy="115" r="3" fill="#a09070" opacity="0.4" pointerEvents="none" />
      <circle cx="150" cy="165" r="3" fill="#a09070" opacity="0.4" pointerEvents="none" />

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
        fill="#f5f0e8" stroke="url(#toothBorder)" strokeWidth="3" />

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
      <path d="M 105 150 Q 130 165, 150 160 Q 170 165, 195 150" fill="none" stroke="#a09070" strokeWidth="1.2" opacity="0.6" pointerEvents="none" />
      <path d="M 150 120 Q 148 140, 150 160 Q 152 180, 150 195" fill="none" stroke="#a09070" strokeWidth="1" opacity="0.4" pointerEvents="none" />
      <circle cx="150" cy="160" r="3" fill="#a09070" opacity="0.4" pointerEvents="none" />

      {/* Labels */}
      <text x="150" y="55" textAnchor="middle" {...labelStyle}>B</text>
      <text x="42" y="160" textAnchor="middle" {...labelStyle}>M</text>
      <text x="258" y="160" textAnchor="middle" {...labelStyle}>D</text>
      <text x="150" y="265" textAnchor="middle" {...labelStyle}>L</text>
      <text x="150" y="165" textAnchor="middle" {...labelStyle} fontSize={12}>{centerLabel.en}</text>
    </svg>
  );

  const TOOTH_TYPE_LABELS: Record<ToothType, string> = {
    incisor: 'قاطع — Incisor',
    canine: 'ناب — Canine',
    premolar: 'ضاحك — Premolar',
    molar: 'طاحن — Molar',
  };

  const renderToothSVG = () => {
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
          {toothNumber ? `سن ${toothNumber} — ${TOOTH_TYPE_LABELS[toothType]}` : 'عرض إطباقي'}
        </p>
        <p className="text-xs text-muted-foreground">انقر على السطح لتغيير حالته</p>
      </div>

      <div className="relative">{renderToothSVG()}</div>

      {/* Surface status cards */}
      <div className="grid grid-cols-5 gap-2 w-full">
        {(['buccal', 'mesial', 'occlusal', 'distal', 'lingual'] as const).map(surface => (
          <button
            key={surface}
            onClick={() => onSurfaceClick(surface)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: getColor(surfaces[surface]) }} />
            <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">{surfaceNames[surface]}</span>
            <span className="text-[9px] font-bold" style={{ color: getColor(surfaces[surface]) }}>{getLabel(surfaces[surface])}</span>
          </button>
        ))}
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap gap-3 justify-center pt-2 border-t w-full">
        {CONDITIONS.map(c => (
          <div key={c} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: SURFACE_COLORS[c].fill }} />
            <span className="text-xs text-muted-foreground">{SURFACE_COLORS[c].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SURFACE_CONDITION_CYCLE = CONDITIONS;

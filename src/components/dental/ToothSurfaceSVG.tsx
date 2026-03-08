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

const SURFACE_NAMES: Record<string, string> = {
  buccal: 'الشدقي (B)',
  mesial: 'الإنسي (M)',
  occlusal: 'الإطباقي (O)',
  distal: 'الوحشي (D)',
  lingual: 'اللساني (L)',
};

interface ToothSurfaceSVGProps {
  surfaces: SurfaceConditions;
  onSurfaceClick: (surface: keyof SurfaceConditions) => void;
}

export const ToothSurfaceSVG: React.FC<ToothSurfaceSVGProps> = ({ surfaces, onSurfaceClick }) => {
  const getColor = (condition: string) => SURFACE_COLORS[condition]?.fill || SURFACE_COLORS.sound.fill;
  const getLabel = (condition: string) => SURFACE_COLORS[condition]?.label || 'سليم';

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Tooth title */}
      <p className="text-sm font-semibold text-foreground">عرض إطباقي — انقر على السطح لتغيير حالته</p>

      <div className="relative">
        <svg viewBox="0 0 300 300" width="280" height="280" className="drop-shadow-xl">
          <defs>
            {/* Realistic shadow filters */}
            <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
              <feOffset dx="1" dy="2" result="offsetBlur" />
              <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="inverse" />
              <feFlood floodColor="#000" floodOpacity="0.25" result="color" />
              <feComposite in="color" in2="inverse" operator="in" result="shadow" />
              <feComposite in="SourceGraphic" in2="shadow" operator="over" />
            </filter>
            <filter id="outerGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Gradient for tooth border */}
            <linearGradient id="toothBorder" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4c5a9" />
              <stop offset="100%" stopColor="#b8a88a" />
            </linearGradient>
          </defs>

          {/* Outer tooth shape - realistic molar occlusal outline */}
          <path
            d="M 150 18
               C 100 18, 55 40, 38 80
               C 22 118, 20 150, 28 185
               C 36 220, 60 258, 95 274
               C 120 284, 140 286, 150 286
               C 160 286, 180 284, 205 274
               C 240 258, 264 220, 272 185
               C 280 150, 278 118, 262 80
               C 245 40, 200 18, 150 18 Z"
            fill="#f5f0e8"
            stroke="url(#toothBorder)"
            strokeWidth="3"
          />

          {/* ===== BUCCAL (Top) ===== */}
          <path
            d="M 150 18
               C 100 18, 55 40, 38 80
               C 22 118, 24 135, 60 120
               C 85 112, 115 105, 150 102
               C 185 105, 215 112, 240 120
               C 276 135, 278 118, 262 80
               C 245 40, 200 18, 150 18 Z"
            fill={getColor(surfaces.buccal)}
            stroke="#c4b896"
            strokeWidth="1.5"
            filter="url(#innerShadow)"
            className="cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-2"
            onClick={() => onSurfaceClick('buccal')}
            opacity="0.9"
          />
          {/* Buccal cusp ridges */}
          <path d="M 90 55 Q 120 70, 150 65 Q 180 70, 210 55" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

          {/* ===== MESIAL (Left) ===== */}
          <path
            d="M 38 80
               C 22 118, 20 150, 28 185
               C 36 210, 50 230, 65 240
               C 75 230, 80 200, 75 170
               C 72 145, 68 130, 60 120
               C 24 135, 22 118, 38 80 Z"
            fill={getColor(surfaces.mesial)}
            stroke="#c4b896"
            strokeWidth="1.5"
            filter="url(#innerShadow)"
            className="cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-2"
            onClick={() => onSurfaceClick('mesial')}
            opacity="0.9"
          />
          {/* Mesial marginal ridge */}
          <path d="M 50 130 Q 60 160, 55 190" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

          {/* ===== DISTAL (Right) ===== */}
          <path
            d="M 262 80
               C 278 118, 280 150, 272 185
               C 264 210, 250 230, 235 240
               C 225 230, 220 200, 225 170
               C 228 145, 232 130, 240 120
               C 276 135, 278 118, 262 80 Z"
            fill={getColor(surfaces.distal)}
            stroke="#c4b896"
            strokeWidth="1.5"
            filter="url(#innerShadow)"
            className="cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-2"
            onClick={() => onSurfaceClick('distal')}
            opacity="0.9"
          />
          {/* Distal marginal ridge */}
          <path d="M 250 130 Q 240 160, 245 190" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

          {/* ===== LINGUAL (Bottom) ===== */}
          <path
            d="M 65 240
               C 50 230, 36 220, 28 185
               C 20 150, 28 185, 28 185
               C 36 220, 60 258, 95 274
               C 120 284, 140 286, 150 286
               C 160 286, 180 284, 205 274
               C 240 258, 264 220, 272 185
               C 272 185, 280 150, 272 185
               C 264 210, 250 230, 235 240
               C 225 245, 210 220, 200 200
               C 185 195, 165 198, 150 200
               C 135 198, 115 195, 100 200
               C 90 220, 75 245, 65 240 Z"
            fill={getColor(surfaces.lingual)}
            stroke="#c4b896"
            strokeWidth="1.5"
            filter="url(#innerShadow)"
            className="cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-2"
            onClick={() => onSurfaceClick('lingual')}
            opacity="0.9"
          />
          {/* Lingual cusp ridge */}
          <path d="M 100 255 Q 130 245, 150 248 Q 170 245, 200 255" fill="none" stroke="#c4b896" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />

          {/* ===== OCCLUSAL (Center) ===== */}
          <path
            d="M 60 120
               C 68 130, 72 145, 75 170
               C 80 200, 75 230, 65 240
               C 75 245, 90 220, 100 200
               C 115 195, 135 198, 150 200
               C 165 198, 185 195, 200 200
               C 210 220, 225 245, 235 240
               C 225 230, 220 200, 225 170
               C 228 145, 232 130, 240 120
               C 215 112, 185 105, 150 102
               C 115 105, 85 112, 60 120 Z"
            fill={getColor(surfaces.occlusal)}
            stroke="#b8a070"
            strokeWidth="2"
            filter="url(#innerShadow)"
            className="cursor-pointer transition-all duration-200 hover:brightness-110 hover:stroke-2"
            onClick={() => onSurfaceClick('occlusal')}
            opacity="0.92"
          />
          {/* Central fossa and grooves */}
          <path d="M 105 150 Q 130 165, 150 160 Q 170 165, 195 150" fill="none" stroke="#a09070" strokeWidth="1.2" opacity="0.6" pointerEvents="none" />
          <path d="M 150 120 Q 148 140, 150 160 Q 152 180, 150 195" fill="none" stroke="#a09070" strokeWidth="1" opacity="0.4" pointerEvents="none" />
          {/* Fossa dot */}
          <circle cx="150" cy="160" r="3" fill="#a09070" opacity="0.4" pointerEvents="none" />

          {/* ===== Labels ===== */}
          <text x="150" y="55" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold" pointerEvents="none"
            stroke="#00000040" strokeWidth="0.5">B</text>
          <text x="42" y="160" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold" pointerEvents="none"
            stroke="#00000040" strokeWidth="0.5">M</text>
          <text x="258" y="160" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold" pointerEvents="none"
            stroke="#00000040" strokeWidth="0.5">D</text>
          <text x="150" y="265" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold" pointerEvents="none"
            stroke="#00000040" strokeWidth="0.5">L</text>
          <text x="150" y="165" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold" pointerEvents="none"
            stroke="#00000040" strokeWidth="0.5">O</text>
        </svg>
      </div>

      {/* Surface status cards */}
      <div className="grid grid-cols-5 gap-2 w-full">
        {(['buccal', 'mesial', 'occlusal', 'distal', 'lingual'] as const).map(surface => (
          <button
            key={surface}
            onClick={() => onSurfaceClick(surface)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: getColor(surfaces[surface]) }} />
            <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">{SURFACE_NAMES[surface]}</span>
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

import React from 'react';
import { INTERNATIONAL_COLOR_SYSTEM } from '@/types/dental-enhanced';

interface SurfaceConditions {
  mesial: string;
  distal: string;
  buccal: string;
  lingual: string;
  occlusal: string;
}

const SURFACE_COLORS: Record<string, string> = {
  sound: INTERNATIONAL_COLOR_SYSTEM.sound,
  caries: INTERNATIONAL_COLOR_SYSTEM.caries,
  filled: INTERNATIONAL_COLOR_SYSTEM.filled,
  crown: INTERNATIONAL_COLOR_SYSTEM.crown,
  root_canal: INTERNATIONAL_COLOR_SYSTEM.root_canal,
  fractured: INTERNATIONAL_COLOR_SYSTEM.fractured,
  missing: INTERNATIONAL_COLOR_SYSTEM.missing,
};

const SURFACE_LABELS: Record<string, string> = {
  sound: 'سليم',
  caries: 'تسوس',
  filled: 'محشو',
  crown: 'تاج',
  root_canal: 'علاج عصب',
  fractured: 'مكسور',
  missing: 'مفقود',
};

const CONDITIONS = ['sound', 'caries', 'filled', 'crown', 'root_canal', 'fractured'];

interface ToothSurfaceSVGProps {
  surfaces: SurfaceConditions;
  onSurfaceClick: (surface: keyof SurfaceConditions) => void;
}

export const ToothSurfaceSVG: React.FC<ToothSurfaceSVGProps> = ({ surfaces, onSurfaceClick }) => {
  const getColor = (condition: string) => SURFACE_COLORS[condition] || SURFACE_COLORS.sound;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" width="220" height="220" className="drop-shadow-lg">
        {/* Buccal - top */}
        <path
          d="M 40 10 L 160 10 L 140 50 L 60 50 Z"
          fill={getColor(surfaces.buccal)}
          stroke="hsl(var(--border))"
          strokeWidth="2"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onSurfaceClick('buccal')}
        />
        <text x="100" y="35" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold" pointerEvents="none">B</text>

        {/* Mesial - left */}
        <path
          d="M 10 40 L 50 60 L 50 140 L 10 160 Z"
          fill={getColor(surfaces.mesial)}
          stroke="hsl(var(--border))"
          strokeWidth="2"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onSurfaceClick('mesial')}
        />
        <text x="30" y="105" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold" pointerEvents="none">M</text>

        {/* Occlusal - center */}
        <rect
          x="55" y="55" width="90" height="90" rx="8"
          fill={getColor(surfaces.occlusal)}
          stroke="hsl(var(--border))"
          strokeWidth="2"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onSurfaceClick('occlusal')}
        />
        <text x="100" y="105" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold" pointerEvents="none">O</text>

        {/* Distal - right */}
        <path
          d="M 150 60 L 190 40 L 190 160 L 150 140 Z"
          fill={getColor(surfaces.distal)}
          stroke="hsl(var(--border))"
          strokeWidth="2"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onSurfaceClick('distal')}
        />
        <text x="170" y="105" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold" pointerEvents="none">D</text>

        {/* Lingual - bottom */}
        <path
          d="M 60 150 L 140 150 L 160 190 L 40 190 Z"
          fill={getColor(surfaces.lingual)}
          stroke="hsl(var(--border))"
          strokeWidth="2"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onSurfaceClick('lingual')}
        />
        <text x="100" y="175" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold" pointerEvents="none">L</text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {CONDITIONS.map(c => (
          <div key={c} className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SURFACE_COLORS[c] }} />
            <span className="text-muted-foreground">{SURFACE_LABELS[c]}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        انقر على أي سطح لتغيير حالته
      </p>
    </div>
  );
};

export const SURFACE_CONDITION_CYCLE = CONDITIONS;

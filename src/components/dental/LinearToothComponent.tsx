import React from 'react';
import { ConditionType, INTERNATIONAL_COLOR_SYSTEM } from "@/types/dental-enhanced";

interface LinearToothComponentProps {
  toothNumber: string;
  displayNumber?: string;
  quadrant: 'UL' | 'UR' | 'LL' | 'LR';
  condition: ConditionType;
  patientId?: string;
  onClick: () => void;
}

const getToothImagePath = (toothNumber: string, quadrant: 'UL' | 'UR' | 'LL' | 'LR'): string | null => {
  let folderPath = '';
  switch (quadrant) {
    case 'UL': folderPath = '/teeth/U%20L/'; break;
    case 'UR': folderPath = '/teeth/U%20R/'; break;
    case 'LL': folderPath = '/teeth/L%20L/'; break;
    case 'LR': folderPath = '/teeth/L%20R/'; break;
  }
  return `${folderPath}${toothNumber}.png`;
};

const getToothType = (toothNumber: string) => {
  const lastDigit = toothNumber.slice(-1);
  switch (lastDigit) {
    case '1': case '2': return 'قاطع';
    case '3': return 'ناب';
    case '4': case '5': return 'ضاحك';
    case '6': case '7': case '8': return 'طاحن';
    default: return 'سن';
  }
};

export const LinearToothComponent: React.FC<LinearToothComponentProps> = ({
  toothNumber,
  displayNumber,
  quadrant,
  condition,
  onClick,
}) => {
  const getConditionColor = (cond: ConditionType) => {
    return INTERNATIONAL_COLOR_SYSTEM[cond] || INTERNATIONAL_COLOR_SYSTEM.sound;
  };

  const isLower = quadrant === 'LL' || quadrant === 'LR';
  const imagePath = getToothImagePath(toothNumber, quadrant);

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10 flex-shrink-0 -mr-1 ${isLower ? 'flex flex-col-reverse' : 'flex flex-col'}`}
      onClick={onClick}
      style={{ margin: 0, padding: 0 }}
    >
      <div className={`text-xs font-bold text-muted-foreground text-center ${isLower ? 'mt-0.5' : 'mb-0.5'}`}>
        {displayNumber || toothNumber}
      </div>

      <div className="relative w-14 h-[68px]" style={{ border: 'none', margin: 0, padding: 0 }}>
        {imagePath ? (
          <img
            src={imagePath}
            alt={`السن ${toothNumber}`}
            className={`w-full h-full object-contain block ${isLower ? 'rotate-180' : ''}`}
            style={{ margin: 0, padding: 0, border: 'none' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <svg viewBox="0 0 24 24" className={`w-full h-full ${isLower ? 'rotate-180' : ''}`} fill={getConditionColor(condition)}>
            <path d="M12 2C12 2 8 4 8 8V16C8 20 12 22 12 22C12 22 16 20 16 16V8C16 4 12 2 12 2Z" />
          </svg>
        )}

        {condition !== ConditionType.SOUND && (
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: getConditionColor(condition) }} />
        )}
      </div>

      <div className={`text-[10px] text-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ${isLower ? 'mb-0.5' : 'mt-0.5'}`}>
        {getToothType(toothNumber)}
      </div>
    </div>
  );
};

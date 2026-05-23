import React, { useMemo } from 'react';
import { useWobblyRadius } from './wobbly';

interface HandDrawnCardProps {
  id: string; // strict HTML ID GUIDELINES
  children: React.ReactNode;
  rotation?: 'left' | 'right' | 'none' | 'subtle-left' | 'subtle-right';
  decoration?: 'tape' | 'tack' | 'none';
  background?: 'white' | 'postit' | 'paper' | 'ruled';
  className?: string;
  onClick?: () => void;
  customWobblyFactor?: 'card' | 'button' | 'postit' | 'badge1' | 'badge2' | 'badge3' | 'formula' | 'progress' | 'choice1' | 'choice2' | 'choice3' | 'choice4';
}

export const HandDrawnCard: React.FC<HandDrawnCardProps> = ({
  id,
  children,
  rotation = 'none',
  decoration = 'none',
  background = 'white',
  className = '',
  onClick,
  customWobblyFactor
}) => {
  const wobble = useWobblyRadius(customWobblyFactor || 'card');
  const postitWobble = useWobblyRadius('postit');

  // Determine the rotation angle
  const rotationClass = useMemo(() => {
    switch (rotation) {
      case 'left':
        return '-rotate-2';
      case 'right':
        return 'rotate-2';
      case 'subtle-left':
        return '-rotate-[0.8deg]';
      case 'subtle-right':
        return 'rotate-[0.8deg]';
      default:
        return 'rotate-0';
    }
  }, [rotation]);

  // Choose correct background color matching palette
  const bgClass = useMemo(() => {
    switch (background) {
      case 'postit':
        return 'bg-postit text-pencil';
      case 'paper':
        return 'bg-paper text-pencil';
      case 'ruled':
        return 'bg-white notebook-ruled text-pencil';
      case 'white':
      default:
        return 'bg-white text-pencil';
    }
  }, [background]);

  return (
    <div
      id={`${id}-container`}
      className={`relative duration-200 transition-all ${rotationClass} ${className}`}
      onClick={onClick}
    >
      {/* Decorative Thumbtack Pins / Solid Tapes */}
      {decoration === 'tack' && (
        <div id={`${id}-tack`} className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
          {/* Thumbtack Head (metallic/glossy red) */}
          <div className="w-5 h-5 bg-marker rounded-full border-2 border-pencil shadow-[2px_2px_0px_0px_rgba(45,45,45,0.8)] relative">
            {/* Highlight bubble */}
            <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-70"></div>
          </div>
          {/* Needle shadow */}
          <div className="w-0.5 h-3 bg-pencil/40 -mt-0.5"></div>
        </div>
      )}

      {decoration === 'tape' && (
        <div
          id={`${id}-tape`}
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 w-20 h-5 md:w-24 md:h-6 bg-[#eae4d3]/70 border-x border-[#c8be9d] -rotate-3 text-center"
          style={{
            clipPath: 'polygon(0% 15%, 8% 0%, 93% 8%, 100% 0%, 95% 85%, 100% 100%, 8% 90%, 0% 100%)',
            boxShadow: 'inset 0 0 4px rgba(0,0,0,0.05)'
          }}
        ></div>
      )}

      {/* Main card box */}
      <div
        id={id}
        style={{ borderRadius: customWobblyFactor ? wobble : (background === 'postit' ? postitWobble : wobble) }}
        className={`
          p-3.5 sm:p-6 md:p-8
          border-[3px] border-pencil
          shadow-[6px_6px_0px_0px_rgba(45,45,45,1)]
          transition-transform duration-100
          ${onClick ? 'hover:scale-[1.01] hover:shadow-[8px_8px_0px_0px_rgba(45,45,45,1)] cursor-pointer' : ''}
          ${bgClass}
        `}
      >
        {children}
      </div>
    </div>
  );
};

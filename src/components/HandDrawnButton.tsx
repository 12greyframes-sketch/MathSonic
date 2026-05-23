import React from 'react';
import { useWobblyRadius } from './wobbly';
import { soundEngine } from '../utils/soundEngine';

interface HandDrawnButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'muted';
  children: React.ReactNode;
  id: string; // strict HTML ID GUIDELINES
  className?: string;
}

export const HandDrawnButton: React.FC<HandDrawnButtonProps> = ({
  variant = 'primary',
  children,
  id,
  className = '',
  onClick,
  ...props
}) => {
  const wobble = useWobblyRadius('button');

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary': // White background -> turns correction red on hover
        return 'bg-white text-pencil hover:bg-marker hover:text-white border-pencil';
      case 'secondary': // Muted parchment -> turns ballpoint blue on hover
        return 'bg-shading/50 text-pencil hover:bg-ballpoint hover:text-white border-pencil';
      case 'accent': // Solid red background -> turns pencil dark on hover
        return 'bg-marker text-white hover:bg-pencil border-pencil';
      case 'muted': // Simple sketch style dashed border -> fills light red On hover
        return 'bg-transparent text-pencil border-dashed border-pencil hover:bg-marker/10 hover:text-marker';
      default:
        return 'bg-white text-pencil border-pencil';
    }
  };

  const handleInteraction = (e: React.MouseEvent<HTMLButtonElement>) => {
    soundEngine.playPenClick();
    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseEnter = () => {
    soundEngine.playScribble();
  };

  return (
    <button
      id={id}
      style={{ borderRadius: wobble }}
      className={`
        relative
        font-sans font-semibold text-lg md:text-xl
        px-6 py-2.5 md:px-8 md:py-3.5
        border-[3px]
        duration-100 ease-out transition-all
        shadow-[4px_4px_0px_0px_rgba(45,45,45,1)]
        hover:shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]
        hover:translate-x-[2px] hover:translate-y-[2px]
        active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
        cursor-pointer
        select-none
        touch-manipulation
        inline-flex items-center justify-center gap-2
        ${getVariantStyles()}
        ${className}
      `}
      onClick={handleInteraction}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </button>
  );
};

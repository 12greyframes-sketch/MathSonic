import React from 'react';

/**
 * A hand-drawn squiggly divider line
 */
export const ScribbleLine: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full overflow-hidden leading-none ${className}`}>
      <svg
        viewBox="0 0 400 20"
        className="w-full h-4 text-pencil"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      >
        <path d="M 5 10 Q 50 2, 100 12 T 200 8 T 300 11 T 395 7 px" />
      </svg>
    </div>
  );
};

/**
 * A hand-drawn circle outline, ideal for highlighting a status, badge, or level
 */
export const HandDrawnCircle: React.FC<{
  children: React.ReactNode;
  className?: string;
  color?: 'pencil' | 'marker' | 'ballpoint';
}> = ({ children, className = '', color = 'pencil' }) => {
  const strokeColor = {
    pencil: 'text-pencil',
    marker: 'text-marker',
    ballpoint: 'text-ballpoint',
  }[color];

  return (
    <div className={`relative p-2 inline-flex items-center justify-center ${className}`}>
      {/* Hand-drawn double overlapping circle */}
      <svg
        className={`absolute inset-0 w-full h-full ${strokeColor}`}
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M 60 10 C 95 12, 110 40, 108 80 C 105 110, 70 112, 40 108 C 12 105, 10 75, 12 40 C 14 15, 45 8, 80 12 C 100 14, 112 35, 108 70" />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * A lovely sketched star icon
 */
export const HandDrawnStar: React.FC<{ className?: string; filled?: boolean }> = ({
  className = '',
  filled = false,
}) => {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`w-8 h-8 md:w-10 md:h-10 ${className}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 32 6 L 40 22 C 41 24, 43 25, 45 25 L 62 26 L 48 37 C 46 38, 46 40, 47 42 L 52 58 L 34 48 C 32 47, 30 47, 28 48 L 10 58 L 15 42 C 16 40, 15 38, 14 37 L 0 26 L 17 25 C 19 25, 21 24, 22 22 Z" />
    </svg>
  );
};

/**
 * Hand drawn arrow pointing to CTA triggers
 */
export const HandDrawnArrow: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 80 50"
      className={`w-16 h-10 text-marker ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Wobbly curve from top left, swooping down and right */}
      <path d="M 5,10 C 25,5 55,25 70,30" />
      {/* Arrowhead scratches */}
      <path d="M 55,22 L 72,31 L 62,43" />
    </svg>
  );
};

/**
 * Multi-use tape strips
 */
export const TapeMark: React.FC<{ className?: string; rotation?: string }> = ({
  className = '',
  rotation = 'rotate-3',
}) => {
  return (
    <div
      className={`w-16 h-4 md:w-20 md:h-5 bg-[#eae4d3]/70 border-x border-[#c8be9d]/50 ${rotation} ${className}`}
      style={{
        clipPath: 'polygon(0% 10%, 6% 0%, 94% 8%, 100% 0%, 96% 90%, 100% 100%, 8% 92%, 0% 100%)',
      }}
    />
  );
};

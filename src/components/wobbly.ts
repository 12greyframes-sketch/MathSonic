import { useMemo } from 'react';

/**
 * Returns a static but irregular border radius string imitating a hand-drawn sketch.
 * Highly stable to avoid HMR flickering.
 */
export function getWobblyRadius(seed: number = 0): string {
  // Let's create a deterministic wobble based on seeds to prevent visual jitter on re-render.
  const points = [
    // format [tl_x, tr_x, br_x, bl_x, tl_y, tr_y, br_y, bl_y]
    [225, 15, 235, 12, 14, 255, 16, 220],
    [195, 25, 205, 18, 22, 195, 14, 205],
    [250, 10, 240, 15, 12, 230, 18, 240],
    [180, 20, 190, 22, 15, 185, 25, 190],
    [235, 18, 220, 18, 18, 245, 12, 225]
  ];
  
  const set = points[seed % points.length];
  return `${set[0]}px ${set[1]}px ${set[2]}px ${set[3]}px / ${set[4]}px ${set[5]}px ${set[6]}px ${set[7]}px`;
}

/**
 * Hook to memoize a custom organic wobbly border-radius for an individual component.
 */
export function useWobblyRadius(factor: 'card' | 'button' | 'postit' | 'badge1' | 'badge2' | 'badge3' | 'formula' | 'progress' | 'choice1' | 'choice2' | 'choice3' | 'choice4' = 'card'): string {
  return useMemo(() => {
    if (factor === 'badge1') {
      return '255px 15px 225px 15px / 15px 225px 15px 255px';
    }
    if (factor === 'badge2') {
      return '15px 225px 15px 255px / 255px 15px 225px 15px';
    }
    if (factor === 'badge3') {
      return '225px 15px 255px 15px / 15px 255px 15px 225px';
    }
    if (factor === 'formula') {
      return '30px 100px 20px 80px / 80px 20px 100px 30px';
    }
    if (factor === 'progress') {
      return '50px 10px 40px 15px / 15px 40px 10px 50px';
    }
    if (factor === 'choice1') {
      return '200px 25px 250px 20px / 20px 250px 25px 200px';
    }
    if (factor === 'choice2') {
      return '20px 200px 30px 250px / 250px 30px 200px 20px';
    }
    if (factor === 'choice3') {
      return '250px 20px 200px 25px / 25px 200px 20px 250px';
    }
    if (factor === 'choice4') {
      return '25px 250px 20px 200px / 200px 20px 250px 25px';
    }

    const rx = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);
    
    if (factor === 'button') {
      // Shorter side curvature
      return `${rx(180, 260)}px ${rx(15, 35)}px ${rx(180, 250)}px ${rx(15, 30)}px / ${rx(15, 35)}px ${rx(180, 260)}px ${rx(15, 35)}px ${rx(180, 250)}px`;
    } else if (factor === 'postit') {
      // Extreme wobbly square
      return `${rx(140, 220)}px ${rx(100, 180)}px ${rx(160, 220)}px ${rx(100, 160)}px / ${rx(100, 160)}px ${rx(150, 220)}px ${rx(120, 180)}px ${rx(150, 240)}px`;
    } else {
      // Large standard card wobble
      return `${rx(240, 280)}px ${rx(20, 45)}px ${rx(240, 290)}px ${rx(20, 40)}px / ${rx(20, 45)}px ${rx(240, 290)}px ${rx(20, 45)}px ${rx(240, 280)}px`;
    }
  }, [factor]);
}

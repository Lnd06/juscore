import React from 'react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// CONFIGURATION — ajuste o tamanho da logo aqui
// SIZE controla o container que envolve a logo quando usada com bg.
// A imagem sempre preenche 100% do container pai (controlado por className).
// BG_STYLE: 'dark' | 'light' | 'none'  → fundo de contraste para a logo
// ─────────────────────────────────────────────
const BG_STYLE = 'dark'; // 'dark' | 'light' | 'none'

const bgStyles = {
  dark:  'bg-gray-900 rounded-md p-2',
  light: 'bg-white rounded-md p-2',
  gray: 'bg-gray-200 rounded-md p-2',
  none:  '',
};

export const Logo = ({ className, src, bg = BG_STYLE }) => {
  const bgClass = bgStyles[bg] ?? '';

  const imgSrc = src || '/juscore.svg';

  return (
    <div className={cn('relative flex items-center justify-center group', bgClass)}>
      {/* 
        Para alterar o tamanho interno da logo (dar "zoom"), 
        mude o valor de scale-[1.3] abaixo. 
        Ex: scale-[1.2], scale-[1.8], scale-[2.0]
      */}
      {/* Soft circular glow effect behind the logo on hover */}
      <div className="absolute inset-0 bg-white/40 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none scale-75" />
      
      <img
        src={imgSrc}
        alt="JusCore AI Logo"
        className={cn(
          'w-full h-full object-contain transform scale-[1.3] relative z-10',
          'transition-all duration-300',
          className
        )}
      />
    </div>
  );
};

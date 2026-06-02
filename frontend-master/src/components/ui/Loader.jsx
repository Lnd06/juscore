import React from 'react';
import { Aperture, Sparkles, Cpu } from 'lucide-react';

export const Loader = ({ text = "Iniciando o Núcleo de Processamento..." }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0D17] text-white relative overflow-hidden">
      
      {/* Luz Neon Radial do Core */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/10 rounded-full blur-[100px] animate-pulse"></div>
      
      <div className="relative flex items-center justify-center w-32 h-32 mb-8">
        {/* Anéis de Processamento (Core Rings) */}
        <div className="absolute inset-0 border-[1px] border-dashed border-accent/40 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
        <div className="absolute inset-2 border-t-2 border-l-2 border-accent border-opacity-90 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
        <div className="absolute inset-6 border-b-2 border-r-2 border-[#4A90E2] border-opacity-70 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2.5s' }}></div>
        
        {/* O Núcleo (The Core) */}
        <div className="relative flex items-center justify-center w-12 h-12 bg-gray-900 rounded-full shadow-[0_0_30px_rgba(200,162,110,0.4)]">
          <Aperture className="w-6 h-6 text-accent animate-pulse" />
          <Sparkles className="w-3 h-3 text-[#4A90E2] absolute -top-1 -right-2 animate-ping" />
        </div>
      </div>
      
      {/* Texto Minimalista Futurista */}
      <h2 className="text-3xl font-black tracking-[0.3em] text-white mb-4 flex items-center gap-2">
        JUS<span className="text-accent bg-clip-text">CORE</span>
      </h2>
      
      {/* Barra de Progresso Abstrata */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-3 text-xs text-gray-400 font-mono tracking-widest uppercase">
          <Cpu className="w-3 h-3 text-accent" />
          {text}
        </div>
        <div className="mt-3 w-48 h-[2px] bg-gray-800 rounded-full overflow-hidden relative">
           <div className="absolute top-0 left-0 h-full bg-accent animate-in slide-in-from-left duration-1000 w-full opacity-70"></div>
           <div className="absolute top-0 left-0 h-full w-1/3 bg-white/40 blur-[2px] animate-[slide_1.5s_ease-in-out_infinite_alternate]"></div>
        </div>
      </div>

    </div>
  );
};

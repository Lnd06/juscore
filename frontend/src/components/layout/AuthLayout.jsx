import React, { useState } from 'react';
import { Logo } from '../ui/Logo';

const AuthLayout = ({ children, title, subtitle }) => {


  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Side - Branding */}
      <div 
        onMouseMove={handleMouseMove}
        className="hidden lg:flex w-1/2 p-12 bg-[#0B0F19] relative overflow-hidden items-center justify-center"
      >
        <div 
          className="pointer-events-none absolute -inset-px transition duration-300 opacity-100 z-20"
          style={{
            background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.05), transparent 40%)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19] via-[#0B0F19] to-accent/5 opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5 z-0"></div>
        
        <div className="relative z-10 text-white max-w-lg flex flex-col items-center text-center">
          {/* ════ LOGO OFICIAL ════ */}
          <div className="w-24 h-24 mb-6 flex justify-center items-center">
            <Logo bg="none" className="w-full h-full" />
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tight">JusCore AI</h1>
          <p className="text-base text-gray-400 leading-relaxed max-w-md">
            Sua central de inteligência jurídica. Potencialize suas análises com tecnologia de ponta e deixe a burocracia para nós.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6 w-full text-left">
            <div className="p-4 bg-[#131B2E] rounded-xl border border-white/5 hover:border-accent/30 transition-all duration-300 cursor-default">
              <h3 className="font-bold text-base mb-1 text-gray-200">Análise de Contratos</h3>
              <p className="text-xs text-gray-400">Revise documentos em segundos com precisão.</p>
            </div>
            <div className="p-4 bg-[#131B2E] rounded-xl border border-white/5 hover:border-accent/30 transition-all duration-300 cursor-default">
              <h3 className="font-bold text-base mb-1 text-gray-200">Pesquisa Jurídica</h3>
              <p className="text-xs text-gray-400">Acesse jurisprudência e leis atualizadas.</p>
            </div>
          </div>
        </div>
      </div>
 
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-white dark:bg-[#0B0F19] relative">

 
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

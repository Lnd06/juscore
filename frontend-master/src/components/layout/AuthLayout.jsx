import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { Logo } from '../ui/Logo';

const AuthLayout = ({ children, title, subtitle }) => {
  const { theme, toggleTheme } = useTheme();

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
        className="hidden lg:flex w-1/2 p-12 bg-gray-900 relative overflow-hidden items-center justify-center"
      >
        <div 
          className="pointer-events-none absolute -inset-px transition duration-300 opacity-100 z-20"
          style={{
            background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.1), transparent 40%)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-accent/10 opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10 z-0"></div>
        
        <div className="relative z-10 text-white max-w-lg flex flex-col items-center text-center">
          {/* ════ LOGO OFICIAL ════ */}
          <div className="w-24 h-24 mb-6 drop-shadow-2xl flex justify-center items-center">
            <Logo bg="none" className="w-full h-full" />
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight">JusCore AI</h1>
          <p className="text-lg text-gray-300 leading-relaxed max-w-md">
            Sua central de inteligência jurídica. Potencialize suas análises com tecnologia de ponta e deixe a burocracia para nós.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6 w-full text-left">
            <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:border-accent hover:bg-accent/10 transition-all duration-300 hover:scale-105 group cursor-default shadow-lg hover:shadow-accent/20">
              <h3 className="font-bold text-lg mb-1 group-hover:text-accent transition-colors">Análise de Contratos</h3>
              <p className="text-sm text-gray-400">Revise documentos em segundos com precisão.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:border-accent hover:bg-accent/10 transition-all duration-300 hover:scale-105 group cursor-default shadow-lg hover:shadow-accent/20">
              <h3 className="font-bold text-lg mb-1 group-hover:text-accent transition-colors">Pesquisa Jurídica</h3>
              <p className="text-sm text-gray-400">Acesse jurisprudência e leis atualizadas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-gray-50 dark:bg-gray-900 relative">
        <button 
          onClick={toggleTheme}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6 text-primary-600" />}
        </button>

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
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

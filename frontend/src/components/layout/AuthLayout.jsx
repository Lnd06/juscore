import React, { useState } from 'react';
import { Logo } from '../ui/Logo';
import { motion } from 'framer-motion';

const AuthLayout = ({ children, title, subtitle }) => {


  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="min-h-screen flex w-full bg-[#0B0F19]">
      {/* Left Side - Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.15 }}
        onMouseMove={handleMouseMove}
        className="hidden lg:flex w-1/2 p-12 bg-[#080B15] relative overflow-hidden items-center justify-center border-r border-white/5"
      >
        {/* Background elegant grid pattern */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        <div 
          className="pointer-events-none absolute -inset-px transition duration-300 opacity-100 z-20"
          style={{
            background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 175, 55, 0.08), transparent 40%)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#080B15] via-[#080B15] to-accent/5 opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-[0.02] z-0"></div>
        
        <div className="relative z-10 text-white max-w-lg flex flex-col items-center text-center">
          {/* ════ LOGO OFICIAL ════ */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 80 }}
            className="w-24 h-24 mb-6 flex justify-center items-center"
          >
            <Logo bg="none" className="w-full h-full" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-5xl font-black mb-4 tracking-tight"
          >
            JusCore AI
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="text-base text-gray-400 leading-relaxed max-w-md"
          >
            Sua central de inteligência jurídica. Potencialize suas análises com tecnologia de ponta e deixe a burocracia para nós.
          </motion.p>
          
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="mt-12 grid grid-cols-2 gap-6 w-full text-left"
          >
            <div className="p-4 bg-[#131B2E]/55 rounded-xl border border-white/5 hover:border-accent/30 transition-all duration-300 cursor-default">
              <h3 className="font-bold text-base mb-1 text-gray-200">Análise de Contratos</h3>
              <p className="text-xs text-gray-400 font-medium">Revise documentos em segundos com precisão.</p>
            </div>
            <div className="p-4 bg-[#131B2E]/55 rounded-xl border border-white/5 hover:border-accent/30 transition-all duration-300 cursor-default">
              <h3 className="font-bold text-base mb-1 text-gray-200">Pesquisa Jurídica</h3>
              <p className="text-xs text-gray-400 font-medium">Acesse jurisprudência e leis atualizadas.</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
 
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-[#0B0F19] relative">
        {/* Background grid pattern for form side */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, x: 40 },
            visible: { 
              opacity: 1, 
              x: 0,
              transition: {
                type: "spring",
                bounce: 0.1,
                duration: 0.6,
                staggerChildren: 0.15,
                delayChildren: 0.1
              }
            }
          }}
          className="w-full max-w-md space-y-8 relative z-10"
        >
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { type: "spring" } }
            }}
            className="text-center lg:text-left"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm text-gray-455 font-medium">
              {subtitle}
            </p>
          </motion.div>
 
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { type: "spring" } }
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;

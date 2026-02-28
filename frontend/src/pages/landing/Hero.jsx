import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui';
import { ArrowRight, Sparkles, MessageSquare, Shield, Zap, Scale, Gavel, FileText, User } from 'lucide-react';
import { ScrollReveal, TypewriterText } from './Animations';

const HeroMockup = () => (
  <div className="relative w-full aspect-video bg-gray-950 rounded-[24px] overflow-hidden shadow-2xl border border-white/10 group transition-all duration-500 hover:shadow-accent/20">
    {/* Browser Header */}
    <div className="h-10 bg-black/40 border-b border-white/5 flex items-center px-4 gap-4">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
        <div className="w-3 h-3 rounded-full bg-green-500/50" />
      </div>
      <div className="flex-1 max-w-xl mx-auto bg-white/5 h-6 rounded-lg border border-white/5 flex items-center justify-center text-[10px] text-gray-500 font-mono">
        juscore.ai/dashboard/chat
      </div>
    </div>

    <div className="flex h-full">
      {/* Sidebar Mockup (Exact Replica) */}
      <div className="w-16 md:w-64 border-r border-gray-800 bg-gray-900 flex-col py-6 hidden sm:flex">
        {/* Logo Area */}
        <div className="px-6 mb-8 flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center text-white shrink-0">
              <div className="w-4 h-4 bg-white rounded-sm transform rotate-45" />
           </div>
           <span className="font-bold text-white text-lg hidden md:block">JusCore AI</span>
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-3 space-y-1">
           {/* Inactive Item */}
           <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 border-l-4 border-transparent">
              <div className="w-5 h-5 rounded border border-gray-600" />
              <div className="h-2 w-20 bg-gray-800 rounded hidden md:block" />
           </div>
           
           {/* Active Item (Chat) */}
           <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-accent/20 to-transparent border-l-4 border-accent text-white font-bold">
              <MessageSquare className="w-5 h-5 text-accent" />
              <span className="hidden md:block">Chat I.A.</span>
           </div>

           {/* Inactive Items */}
           {[1, 2, 3].map(i => (
             <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 border-l-4 border-transparent opacity-50">
                <div className="w-5 h-5 rounded border border-gray-700" />
                <div className="h-2 w-16 bg-gray-800 rounded hidden md:block" />
             </div>
           ))}
        </div>
      </div>

      {/* Main Area Mockup */}
      <div className="flex-1 bg-gray-950 flex flex-col relative overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden relative">
           {/* User Message */}
           <div className="flex flex-row-reverse gap-4">
              <div className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center shrink-0 shadow-sm">
                 <User className="w-5 h-5" />
              </div>
              <div className="bg-accent text-white shadow-xl shadow-accent/20 p-5 rounded-[28px] rounded-tr-none text-sm leading-relaxed max-w-[85%] relative group">
                Gere uma petição inicial para ação de cobrança indevida com dano moral.
              </div>
           </div>

           {/* AI Message */}
           <div className="flex gap-4 max-w-[90%] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="w-10 h-10 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 shadow-sm">
                 <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div className="flex flex-col space-y-2">
                 <div className="bg-gray-800 border border-gray-700 text-gray-200 p-5 rounded-[28px] rounded-tl-none shadow-sm text-sm leading-relaxed">
                    <p className="mb-4">Claro. Analisando a jurisprudência atual e os fatos narrados, preparei a minuta da inicial. O fundamento principal será o <span className="text-accent font-bold">art. 42 do CDC</span> (repetição de indébito) acumulado com dano moral in re ipsa.</p>
                    
                    <div className="p-3 bg-black/20 border border-white/5 rounded-xl flex items-center gap-3 mb-2 hover:bg-black/40 transition-colors cursor-pointer group/file">
                       <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover/file:bg-accent group-hover/file:text-white transition-colors">
                          <FileText className="w-4 h-4 text-accent group-hover/file:text-white" />
                       </div>
                       <div className="flex-1">
                          <div className="text-xs font-bold text-gray-200">Minuta_Inicial_Cobranca.docx</div>
                          <div className="text-[10px] text-gray-500">24KB • Pronto para download</div>
                       </div>
                       <div className="p-1.5 rounded-lg text-gray-400 group-hover/file:text-white transition-colors">
                          <ArrowRight className="w-4 h-4" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Floating Input Area (Exact replica) */}
        <div className="p-4 pt-0">
           {/* Background Gradient for Input */}
           <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-[2rem] p-2 shadow-2xl shadow-black/50 flex items-end gap-2 relative z-20">
              {/* Attach Button */}
              <div className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                  <div className="w-5 h-5 border-2 border-gray-500 rounded-sm rotate-45" /> 
              </div>

              {/* Input Placeholder */}
              <div className="flex-1 py-2.5 px-2 text-sm text-gray-500 font-medium select-none">
                 Digite sua mensagem...
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-1 pb-0.5">
                  {/* Model Selector Pill */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 border border-white/5 text-[10px] font-medium text-gray-400">
                     <Zap className="w-3 h-3 text-accent" />
                     <span className="hidden sm:inline">GPT-4o</span>
                  </div>
                  
                  {/* Send Button */}
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-gray-900 shadow-lg shadow-accent/10 hover:scale-105 transition-transform cursor-pointer">
                     <ArrowRight className="w-5 h-5 ml-0.5" />
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  </div>
);

const Hero = ({ onCtaClick }) => {
  const typewriterTexts = React.useMemo(() => [
    'Para Advogados e Estudantes',
    'Sem Burocracia', 
    'Focada na sua OAB',
    'De Alta Performance', 
    'Para o seu TCC', 
    'Ágil e Decisiva'
  ], []);

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <ScrollReveal direction="down" delay={200}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold mb-8 backdrop-blur-md">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>A Revolução da I.A. na Advocacia e nos Estudos Jurídicos</span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <h1 className="text-4xl sm:text-5xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tighter leading-[1.1] mb-8 drop-shadow-2xl">
            A Inteligência Jurídica <br className="hidden md:block" />
            <TypewriterText 
              texts={typewriterTexts} 
              className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-yellow-200 to-accent animate-gradient-x block mt-2 md:mt-0 whitespace-nowrap"
            />
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={600}>
          <p className="max-w-2xl mx-auto text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed px-4 font-medium">
            Automatize petições, domine jurisprudência e impulsione seus estudos 10x mais rápido. 
            <span className="text-accent font-bold"> Essencial para o seu escritório, indispensável para a sua OAB.</span>
          </p>
        </ScrollReveal>

        <ScrollReveal delay={800} direction="up">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4">
            <Button 
              onClick={onCtaClick}
              className="w-full sm:w-auto px-12 h-16 bg-gradient-to-r from-accent to-yellow-600 hover:from-accent-dark hover:to-yellow-700 text-white rounded-full text-lg font-bold shadow-[0_20px_50px_-12px_rgba(212,175,55,0.5)] flex items-center justify-center gap-3 hover:scale-105 transition-all duration-300"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline"
              className="w-full sm:w-auto px-12 h-16 border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-gray-900 dark:text-white rounded-full text-lg font-bold transition-all duration-300"
            >
              Ver em Ação
            </Button>
          </div>
        </ScrollReveal>

        {/* Hero Mockup Area */}
        <ScrollReveal delay={1000} direction="up" className="mt-20 px-4">
          <div className="relative max-w-5xl mx-auto group">
            <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-1000 -z-10" />
            <div className="bg-white/5 dark:bg-gray-950 rounded-[32px] border border-white/10 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] overflow-hidden p-2 backdrop-blur-xl">
               <HeroMockup />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Hero;

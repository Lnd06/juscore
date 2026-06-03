/* eslint-disable no-unused-vars */
import React from 'react';
import { Button } from '../../components/ui';
import { 
  ArrowRight, Sparkles, MessageSquare, Shield, Zap, Scale, Gavel, 
  FileText, User, Download, Clock, Folder, Calendar, DollarSign, 
  CheckSquare, LineChart, ShieldCheck, ChevronRight, FileCheck, HelpCircle, Layout, GraduationCap
} from 'lucide-react';
import { ScrollReveal, TypewriterText } from './Animations';

const HeroMockup = () => (
  <div className="relative w-full aspect-[16/9] bg-[#070A13] rounded-2xl overflow-hidden border border-white/10 group transition-all duration-500 shadow-2xl">
    {/* Browser Header */}
    <div className="h-11 bg-[#090E1C] border-b border-white/5 flex items-center px-4 gap-4 select-none">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/40" />
        <div className="w-3 h-3 rounded-full bg-amber-500/40" />
        <div className="w-3 h-3 rounded-full bg-green-500/40" />
      </div>
      <div className="flex-1 max-w-xl mx-auto bg-white/5 h-6 rounded-lg border border-white/5 flex items-center justify-center text-[10px] text-gray-500 font-mono">
        juscore.net/dashboard/estudos
      </div>
    </div>

    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Sidebar Mockup */}
      <div className="w-16 md:w-48 border-r border-white/5 bg-[#080B15] flex flex-col py-6 shrink-0 select-none">
        {/* Logo Area */}
        <div className="px-4 mb-8 flex items-center gap-2">
           <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-gray-950 shrink-0 font-extrabold text-sm">
              J
           </div>
           <span className="font-extrabold text-white text-xs tracking-wider uppercase hidden md:block">JusCore</span>
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-2 space-y-1">
           {/* Active Item: Estudos */}
           <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 text-accent font-bold border-l-2 border-accent">
              <GraduationCap className="w-4 h-4 text-accent" />
              <span className="text-[10px] hidden md:block uppercase tracking-wider">Estudos / OAB</span>
           </div>

           {/* Inactive Items */}
           {[
             { label: 'Simulador OAB', icon: FileCheck },
             { label: 'Gerador de Peças', icon: Folder },
             { label: 'Assistente de TCC', icon: User },
             { label: 'Banco de Petições', icon: Clock },
             { label: 'Copiloto IA', icon: Sparkles }
           ].map((item, i) => {
             const Icon = item.icon;
             return (
               <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] hidden md:block font-semibold uppercase tracking-wider">{item.label}</span>
               </div>
             );
           })}
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 bg-[#060810] overflow-y-auto flex flex-col p-4 md:p-6 gap-6 min-h-0 text-left">
        
        {/* Top bar header inside dashboard */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h4 className="text-xs md:text-sm font-bold text-white tracking-wide">Área de Controle Acadêmico</h4>
            <p className="text-[9px] md:text-[10px] text-gray-500">Acompanhamento de estudos, simulados e peças profissionais</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-block text-[9px] font-bold bg-accent/10 text-accent px-2 py-1 rounded border border-accent/20">Estudante VIP</span>
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 text-accent font-bold text-[10px]">
              E
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { title: "Peças Geradas", val: "42", sub: "Treinos OAB ativos", color: "border-blue-500/20 text-blue-400 bg-blue-500/5" },
            { title: "Dias para OAB", val: "18", sub: "Cronograma de estudos", color: "border-amber-500/20 text-amber-400 bg-amber-500/5" },
            { title: "Resumos Criados", val: "15", sub: "Matéria revisada", color: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" },
            { title: "Consultas à IA", val: "184", sub: "Dúvidas solucionadas", color: "border-purple-500/20 text-purple-400 bg-purple-500/5" }
          ].map((card, i) => (
            <div key={i} className={`p-3 md:p-4 rounded-2xl border bg-white/5 backdrop-blur-md flex flex-col gap-1 transition-all ${card.color}`}>
              <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-gray-500 font-extrabold">{card.title}</span>
              <span className="text-lg md:text-2xl font-black">{card.val}</span>
              <span className="text-[7px] md:text-[8px] text-gray-400">{card.sub}</span>
            </div>
          ))}
        </div>

        {/* Columns: ERP Monitor & Copilot Quick Access */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
          
          {/* Left Column: ERP Process Tracking (8/12 width) */}
          <div className="lg:col-span-7 bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 min-h-[220px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Histórico de Simulados e Peças Praticadas</span>
              <span className="text-[8px] text-accent font-bold hover:underline cursor-pointer">Ver histórico</span>
            </div>

            {/* List of mock process items */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {[
                { client: "Petição Inicial - Direito do Trabalho", action: "Peça prática profissional", status: "Nota 9.5", tagColor: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", progress: "Estrutura correta, fundamentação completa com base na CLT", date: "Há 2 horas" },
                { client: "Apelação Cível - Direito do Consumidor", action: "Recurso cível simulado", status: "Corrigida", tagColor: "bg-blue-500/10 text-blue-400 border border-blue-500/20", progress: "Identificado erro na tempestividade, revisar prazos recursais", date: "Ontem" },
                { client: "TCC - Capítulo 2 (Fundamentação)", action: "Monografia acadêmica", status: "Em Revisão", tagColor: "bg-amber-500/10 text-amber-400 border border-amber-500/20", progress: "Geradas referências em formato ABNT e estrutura lógica", date: "Há 1 dia" }
              ].map((row, idx) => (
                <div key={idx} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between gap-3 text-[9px] hover:bg-white/[0.05] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white truncate">{row.client}</span>
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${row.tagColor}`}>{row.status}</span>
                    </div>
                    <div className="text-gray-400 text-[8px] truncate mt-0.5">{row.action}</div>
                    <div className="text-gray-500 text-[8px] mt-1 italic">{row.progress}</div>
                  </div>
                  <div className="text-[8px] text-gray-550 text-right whitespace-nowrap shrink-0">{row.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: AI Senior Copilot Integration (5/12 width) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#0F1424] to-[#0A0E1A] border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-3 min-h-[220px]">
            <div className="flex items-center justify-between border-b border-[#ffffff0a] pb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent">Professor IA & Corretor</span>
              </div>
              <span className="text-[7px] text-gray-500">Modelo: JusCore Acadêmico Pro</span>
            </div>

            {/* Quick chat bubbles mockup */}
            <div className="flex-1 space-y-3 mt-2 overflow-y-auto">
              {/* User Bubble */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[7px] font-black text-gray-500 uppercase tracking-wider">Você</span>
                <div className="bg-accent text-gray-950 p-2.5 rounded-2xl rounded-tr-none text-[8.5px] font-medium leading-relaxed max-w-[90%]">
                  Corrija minha peça de Embargos de Declaração e explique os requisitos.
                </div>
              </div>

              {/* Copilot Bubble */}
              <div className="flex flex-col items-start gap-1">
                <span className="text-[7px] font-black text-accent uppercase tracking-wider">JusCore AI</span>
                <div className="bg-white/5 border border-white/5 text-gray-300 p-2.5 rounded-2xl rounded-tl-none text-[8.5px] leading-relaxed max-w-[95%]">
                  Sua peça atende ao Art. 1.022 do CPC. Indiquei a correção do prazo e elaborei a fundamentação de omissão.
                  
                  <div className="mt-2 flex gap-1.5">
                    <button className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[7px] font-bold text-accent transition-all">
                      <FileText className="w-2.5 h-2.5" /> Revisar Estrutura
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[7px] font-bold text-accent transition-all">
                      <GraduationCap className="w-2.5 h-2.5" /> Aula Didática
                    </button>
                  </div>
                </div>
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
    'Passe na 2ª Fase OAB',
    'Explicação Didática de Peças',
    'TCC Estruturado em Minutos',
    'Estudos Jurídicos 10x Mais Rápidos',
    'Prática e Treino de Peças',
    'Sem Bloqueios de Escrita'
  ], []);

  return (
    <section className="relative pt-36 pb-24 px-6 overflow-hidden bg-white dark:bg-gray-950">
      {/* Background elegant gradient blooms */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-20 dark:opacity-10 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-accent/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        
        {/* Fine, prestigious top badge */}
        <ScrollReveal direction="down" delay={200}>
          <div className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold mb-8 backdrop-blur-md tracking-wide">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>O Copiloto Inteligente Focado na sua Aprovação e Estudos Jurídicos</span>
          </div>
        </ScrollReveal>

        {/* Striking Modern Heading with Typewriter */}
        <ScrollReveal delay={400}>
          <h1 className="text-[7.5vw] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-950 dark:text-white tracking-tight leading-[1.12] mb-8 select-none flex flex-col items-center">
            <span>Passe na OAB com IA</span>
            <span className="text-[5.8vw] sm:text-4xl md:text-5xl lg:text-7xl block mt-1 sm:mt-2 whitespace-normal sm:whitespace-nowrap">
              <TypewriterText 
                texts={typewriterTexts}
                className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-[#F2D272] to-accent font-black tracking-wide"
              />
            </span>
          </h1>
        </ScrollReveal>

        {/* Clean, high-conversion Paragraph */}
        <ScrollReveal delay={600}>
          <p className="max-w-3xl mx-auto text-base md:text-lg text-gray-650 dark:text-gray-400 mb-12 leading-relaxed px-4 font-normal">
            Gere peças profissionais completas para a 2ª fase, entenda a estrutura jurídica ideal e pratique sem travar.
            <span className="text-accent font-medium"> Didática descomplicada para o seu estudo e indispensável para a sua aprovação.</span>
          </p>
        </ScrollReveal>

        {/* CTAs */}
        <ScrollReveal delay={800} direction="up">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 px-4 mb-20">
            <Button 
              onClick={onCtaClick}
              className="w-full sm:w-auto px-12 h-16 bg-gradient-to-r from-accent to-yellow-600 hover:from-accent-dark hover:to-yellow-700 text-white rounded-full text-lg font-bold shadow-[0_20px_50px_-12px_rgba(212,175,55,0.4)] flex items-center justify-center gap-3 hover:scale-[1.03] transition-all duration-300"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Button>
            <a 
              href="#features"
              className="w-full sm:w-auto px-12 h-16 border border-gray-200 dark:border-white/10 bg-gray-50/50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-full text-lg font-bold flex items-center justify-center transition-all duration-300 hover:scale-[1.03]"
            >
              Conhecer Recursos
            </a>
          </div>
        </ScrollReveal>

        {/* Interactive Dashboard Hero Mockup Container */}
        <ScrollReveal delay={1000} direction="up" className="px-4">
          <div className="relative max-w-5xl mx-auto group">
            {/* Elegant backdrop glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent blur-[100px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000 -z-10" />
            
            <div className="bg-white/5 dark:bg-gray-950 rounded-[32px] border border-gray-200 dark:border-white/10 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] overflow-hidden p-2.5 backdrop-blur-xl">
               <HeroMockup />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Hero;

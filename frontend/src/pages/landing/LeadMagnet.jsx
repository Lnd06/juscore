/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Card, Button } from '../../components/ui';
import { ScrollReveal } from './Animations';
import { Calculator as CalcIcon, Calendar, ArrowRight, Sparkles, Gavel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Calculator from '../dashboard/Calculator';

const LeadMagnet = () => {
  const navigate = useNavigate();

  return (
    <section id="calculator" className="py-32 px-6 relative overflow-hidden bg-[#060911] border-y border-white/[0.05]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <ScrollReveal direction="left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-widest mb-6">
              <CalcIcon className="w-3.5 h-3.5" />
              <span>Simulador Jurídico</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight leading-tight">
              Apoio Prático para <br /> 
              <span className="font-serif italic font-normal text-accent text-3xl md:text-4xl">Advogados e Acadêmicos</span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              Nossas ferramentas estão disponíveis para avaliação imediata. Na versão completa, advogados realizam cálculos de liquidação e atualização monetária, enquanto estudantes contam com suporte estruturado para pesquisas e peças.
            </p>

            <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center text-accent shrink-0">
                <CalcIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-accent uppercase tracking-widest">Degustação Gratuita</div>
                <div className="text-xs text-gray-400 mt-0.5">Até 3 cálculos diários liberados para visitantes sem cadastro.</div>
              </div>
            </div>
            
            <div className="space-y-3.5 mb-10">
              {[
                'Rescisão Trabalhista Simples e por Justa Causa',
                'Atualização Monetária com Juros Judiciais e Honorários',
                'Geração instantânea de rascunhos de petição e resumos',
                'Exportação de relatórios técnicos em padrão ABNT'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-accent/10 border border-accent/25 text-accent rounded-md flex items-center justify-center text-[11px] font-bold shrink-0">
                    ✓
                  </div>
                  <span className="text-sm font-medium text-gray-300">{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Calculadoras Especializadas:
              </div>
              <div className="flex flex-wrap gap-2 max-w-xl">
                {[
                  { name: 'Rescisão Trabalhista', path: '/calculadoras/rescisao' },
                  { name: 'Atualização Monetária', path: '/calculadoras/atualizacao' },
                  { name: 'Honorários OAB', path: '/calculadoras/honorarios' },
                  { name: 'Juros Moratórios', path: '/calculadoras/juros' },
                  { name: 'Prazos Processuais', path: '/calculadoras/prazos' },
                  { name: 'Pensão Alimentícia', path: '/calculadoras/pensao' },
                  { name: 'Cálculo Financeiro', path: '/calculadoras/financeira' }
                ].map((item, index) => (
                  <button 
                    key={index}
                    onClick={() => navigate(item.path)}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium bg-white/[0.02] hover:bg-accent/10 hover:text-accent border border-white/[0.06] text-gray-300 hover:border-accent/30 transition-all duration-200"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={400}>
            <div className="relative group">
              <Card className="relative p-0 rounded-2xl border border-white/[0.08] bg-[#0B0F19] shadow-2xl overflow-hidden min-h-[600px] flex flex-col justify-center">
                 <div className="public-calculator-container p-6 md:p-8 w-full">
                    <Calculator mode="public" />
                 </div>
              </Card>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default LeadMagnet;

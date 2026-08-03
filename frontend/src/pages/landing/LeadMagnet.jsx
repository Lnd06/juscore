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
    <section id="calculator" className="py-32 px-6 relative overflow-hidden bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <ScrollReveal direction="left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Experimente agora</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-tight">
              Apoio Prático para <br /> 
              <span className="text-accent italic text-3xl md:text-4xl">Advogados e Acadêmicos</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-6 max-w-xl">
              Nossas ferramentas estão disponíveis para teste. Na versão completa, advogados têm acesso a cálculos de liquidação, enquanto estudantes encontram todo o apoio necessário para projetos e pesquisas.
            </p>

            <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl mb-10 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                <CalcIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-black text-amber-500 uppercase tracking-widest">Acesso Limitado</div>
                <div className="text-xs font-bold text-gray-500">Até 3 cálculos gratuitos por dia para visitantes.</div>
              </div>
            </div>
            
            <div className="space-y-6 mb-10">
              {[
                'Rescisão Trabalhista Simples e por Justa Causa',
                'Atualização Monetária com Juros Judiciais e Honorários',
                'Geração instantânea de rascunhos de petição e resumos',
                'Exportação de documentos detalhados para atuação e pesquisa'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center text-xs">
                    ✓
                  </div>
                  <span className="font-bold text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Acesse as Páginas Dedicadas (SEO & Detalhes):
              </div>
              <div className="flex flex-wrap gap-2.5 max-w-xl">
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
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-50 hover:bg-accent hover:text-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-accent dark:hover:border-accent/30 transition-all duration-200"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={400}>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-accent to-blue-600 rounded-[40px] opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" />
              <Card className="relative p-0 rounded-[40px] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col justify-center">
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

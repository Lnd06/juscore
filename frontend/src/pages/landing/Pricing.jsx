import React from 'react';
import { plans } from './Data';
import { ScrollReveal } from './Animations';
import { Button } from '../../components/ui';
import { CheckCircle } from 'lucide-react';
import usePricing from '../../hooks/usePricing';

// Mapeia o nome do plano para o ID usado na API de preços
const PLAN_NAME_TO_ID = {
  "Estudante Basic": "student_basic",
  "Estudante Pro": "student_pro",
  "Estudante Pesquisador": "student_master",
  "Advogado Starter": "lawyer_starter",
  "Advogado Growth": "lawyer_growth",
  "Escritório Master": "office_master",
};

const Pricing = ({ onCtaClick }) => {
  const { prices, planTexts } = usePricing();

  const getDynamicPrice = (plan) => {
    const id = PLAN_NAME_TO_ID[plan.name];
    if (!id) return plan.price; // Grátis e Enterprise sem mudança
    const raw = prices[id];
    if (!raw) return plan.price;
    const num = parseFloat(raw);
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getDynamicPlan = (plan) => {
    const id = PLAN_NAME_TO_ID[plan.name];
    if (!id || !planTexts[id] || Object.keys(planTexts[id]).length === 0) return plan;
    const custom = planTexts[id];
    return {
      ...plan,
      name: custom.name || plan.name,
      description: custom.description || plan.description,
      features: custom.features ? custom.features.split('\n').filter(Boolean) : plan.features,
      notIncluded: custom.notIncluded ? custom.notIncluded.split('\n').filter(Boolean) : plan.notIncluded,
    };
  };

  return (
    <section id="pricing" className="py-32 px-6 relative bg-gray-50/50 dark:bg-gray-900/10">
      <div className="max-w-7xl mx-auto text-center">
        <ScrollReveal direction="down" className="mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
            O investimento que <br />
            <span className="text-accent italic">se paga no primeiro dia</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Escolha o plano ideal para a sua advocacia ou jornada acadêmica.</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((basePlan, i) => {
            const plan = getDynamicPlan(basePlan);
            const Icon = basePlan.icon;
            const displayPrice = getDynamicPrice(basePlan);
            return (
              <ScrollReveal key={i} delay={i * 100} direction="up" scale={true} className="h-full">
                <div className={`p-6 md:p-8 rounded-[40px] h-full flex flex-col relative transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-accent/10 group backdrop-blur-md ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-gray-900 to-black dark:from-gray-800 dark:to-gray-950 text-white lg:scale-105 shadow-2xl z-10 border border-accent/50 box-border ring-1 ring-accent/20' 
                    : 'bg-white/80 dark:bg-gray-900/40 text-gray-900 dark:text-white border border-gray-100 dark:border-white/10'
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap z-20 group-hover:scale-110 transition-transform">
                      Mais Popular
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-8">
                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${plan.popular ? 'bg-accent/20 text-accent' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className={`text-sm font-black uppercase tracking-tighter truncate ${plan.popular ? 'text-accent' : 'text-gray-400'}`}>{plan.name}</div>
                      <div className="text-[10px] uppercase font-bold opacity-60 leading-tight">{plan.description}</div>
                    </div>
                  </div>

                  <div className="mb-8 text-left">
                    <div className={`inline-flex items-baseline gap-1 px-4 py-2 rounded-2xl ${
                      plan.popular 
                        ? 'bg-white/10 border border-white/20 text-white' 
                        : 'bg-accent/10 border border-accent/20 text-accent'
                    }`}>
                      {/^\d/.test(String(displayPrice)) && <span className="text-xs font-bold opacity-60 uppercase">R$</span>}
                      <span className={`font-black tracking-tighter ${/^\d/.test(String(displayPrice)) ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}>{displayPrice}</span>
                      <span className="text-[10px] font-bold opacity-60 uppercase">{plan.period}</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-10 flex-1">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle className={`w-5 h-5 mt-0.5 shrink-0 text-accent`} />
                        <span className="text-sm text-left font-medium opacity-90 leading-snug">{f}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((f, j) => (
                      <div key={j} className="flex items-start gap-3 opacity-30 grayscale">
                        <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                        <span className="text-sm text-left font-medium line-through leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={onCtaClick}
                    className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                      plan.popular 
                        ? 'bg-accent hover:bg-white hover:text-accent text-white shadow-xl shadow-accent/20 border-none' 
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-accent hover:text-white border-none text-gray-900 dark:text-white'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

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
  const { prices, planTexts, visiblePlans } = usePricing();

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

  const activePlans = plans.filter((basePlan) => {
    let id = PLAN_NAME_TO_ID[basePlan.name];
    if (basePlan.name === "Grátis") id = "free";
    if (basePlan.name === "Enterprise") id = "enterprise";
    if (visiblePlans && id && !visiblePlans.includes(id)) {
      return false;
    }
    return true;
  });

  const getGridClasses = (count) => {
    if (count === 1) return "grid grid-cols-1 gap-8 max-w-md mx-auto";
    if (count === 2) return "grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto";
    if (count === 3) return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto";
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto";
  };

  return (
    <section id="pricing" className="py-32 px-6 relative bg-[#080B15]/40">
      <div className="max-w-7xl mx-auto text-center">
        <ScrollReveal direction="down" className="mb-20">
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6 tracking-tight">
            O investimento que <br />
            <span className="font-serif italic font-normal text-accent">se paga no primeiro dia</span>
          </h2>
          <p className="text-gray-400 font-normal">Escolha o plano ideal para a sua advocacia ou jornada acadêmica.</p>
        </ScrollReveal>

        <div className={getGridClasses(activePlans.length)}>
          {activePlans.map((basePlan, i) => {
            const plan = getDynamicPlan(basePlan);
            const Icon = basePlan.icon;
            const displayPrice = getDynamicPrice(basePlan);
            return (
              <ScrollReveal key={i} delay={i * 100} direction="up" scale={true} className="h-full">
                <div className={`p-6 md:p-8 rounded-2xl h-full flex flex-col relative transition-all duration-300 hover:-translate-y-1 group ${
                  plan.popular 
                    ? 'bg-[#0D1322] text-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)] z-10 border border-accent/45' 
                    : 'bg-[#0B0F19] text-white border border-white/[0.06] hover:border-white/[0.12]'
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-slate-950 text-[10px] font-display font-bold px-3.5 py-1 rounded-md uppercase tracking-widest shadow-md whitespace-nowrap z-20">
                      Mais Popular
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${plan.popular ? 'bg-accent/15 text-accent border border-accent/25' : 'bg-white/[0.03] text-gray-400 border border-white/[0.06]'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className={`text-sm font-display font-bold uppercase tracking-tight truncate ${plan.popular ? 'text-accent' : 'text-gray-200'}`}>{plan.name}</div>
                      <div className="text-[11px] font-medium text-gray-400 leading-tight mt-0.5">{plan.description}</div>
                    </div>
                  </div>

                  <div className="mb-6 pb-6 border-b border-white/[0.06] text-left">
                    <div className="flex items-baseline gap-1">
                      {/^\d/.test(String(displayPrice)) && <span className="text-xs font-semibold text-gray-400 uppercase font-display">R$</span>}
                      <span className={`font-display font-bold tracking-tight text-white ${/^\d/.test(String(displayPrice)) ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}>{displayPrice}</span>
                      <span className="text-xs font-medium text-gray-500">{plan.period}</span>
                    </div>
                  </div>

                  <div className="space-y-3.5 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                        <span className="text-sm text-left font-normal text-gray-300 leading-snug">{f}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((f, j) => (
                      <div key={j} className="flex items-start gap-3 opacity-35">
                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-gray-600" />
                        <span className="text-sm text-left font-normal text-gray-500 line-through leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={onCtaClick}
                    className={`w-full h-12 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                      plan.popular 
                        ? 'bg-accent hover:bg-accent-dark text-slate-950 shadow-md shadow-accent/15 border-none' 
                        : 'bg-white/[0.04] hover:bg-accent hover:text-slate-950 border border-white/[0.08] hover:border-accent text-white'
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

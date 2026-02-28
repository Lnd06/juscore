import React from 'react';
import { AnimatedCounter, ScrollReveal } from './Animations';

const Stats = () => {
  return (
    <section className="py-20 px-6 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Usuários Ativos', value: 12500, suffix: '+', prefix: '' },
            { label: 'Petições Geradas', value: 350, suffix: 'k', prefix: '' },
            { label: 'Cálculos Realizados', value: 850, suffix: 'k', prefix: '' },
            { label: 'Precisão Jurídica', value: 99.9, suffix: '%', prefix: '' },
          ].map((stat, i) => (
            <ScrollReveal key={i} delay={i * 100} direction="up" className="text-center group">
              <div className="flex flex-col items-center">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] w-full py-8 mb-6 group-hover:bg-accent/20 group-hover:border-accent/40 transition-all duration-500 shadow-2xl shadow-black/20">
                  <div className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white group-hover:scale-110 transition-transform tracking-tighter drop-shadow-lg">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                  </div>
                </div>
                <div className="text-[10px] md:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] group-hover:text-accent transition-colors">
                  {stat.label}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;

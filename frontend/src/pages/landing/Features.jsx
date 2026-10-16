import React from 'react';
import { featureCards, colorMap } from './Data';
import { ScrollReveal } from './Animations';

const Features = () => {
  // Double the cards for seamless looping
  const doubledCards = [...featureCards, ...featureCards];

  return (
    <section id="features" className="py-32 relative bg-[#080B15] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-20 text-center">
        <ScrollReveal direction="down">
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6 tracking-tight">
            Tudo o que você precisa <br />
            <span className="font-serif italic font-normal text-accent">em um só ecossistema</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed font-normal">
            Desenvolvemos ferramentas específicas para advogados e estudantes de direito no Brasil, garantindo aprendizado, conformidade e agilidade.
          </p>
        </ScrollReveal>
      </div>

      {/* Marquee Container */}
      <div className="relative flex overflow-hidden">
        <div className="flex animate-marquee gap-6 py-4 px-4">
          {doubledCards.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div 
                key={i} 
                className="w-[360px] shrink-0 p-7 rounded-2xl bg-[#0B0F19] border border-white/[0.06] hover:border-accent/30 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="w-11 h-11 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-6 border border-accent/20 relative z-10 group-hover:bg-accent/15 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-3 relative z-10 group-hover:text-accent transition-colors tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed relative z-10 text-sm">
                  {feature.desc}
                </p>
              </div>
            );

          })}
        </div>

        {/* Gradient overlays for smooth fading edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#080B15] to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#080B15] to-transparent z-20 pointer-events-none" />
      </div>
    </section>
  );
};

export default Features;

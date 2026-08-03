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
        <div className="flex animate-marquee gap-8 py-4 px-4">
          {doubledCards.map((feature, i) => {
            const Icon = feature.icon;
            const colors = colorMap[feature.color];
            return (
              <div 
                key={i} 
                className="w-[380px] shrink-0 p-8 rounded-[32px] bg-juri-900/40 border border-white/[0.06] hover:border-accent/40 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/5 group relative overflow-hidden backdrop-blur-md"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className={`w-14 h-14 ${colors.bg} ${colors.text} rounded-2xl flex items-center justify-center mb-6 border ${colors.border} relative z-10 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-4 relative z-10 group-hover:text-accent transition-colors tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed relative z-10 font-medium text-sm">
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

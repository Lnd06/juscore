import React from 'react';
import { testimonials } from './Data';
import { ScrollReveal } from './Animations';
import { Star } from 'lucide-react';

const Testimonials = () => {
  return (
    <section className="py-32 px-6 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal direction="down" className="text-center mb-20">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Quem usa, <span className="text-accent italic">recomenda</span>
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <ScrollReveal key={i} delay={i * 200} direction="up" className="relative">
              <div className="p-8 rounded-[32px] bg-white/50 dark:bg-gray-900/40 border border-gray-100 dark:border-white/5 backdrop-blur-sm hover:border-accent/30 transition-colors shadow-lg shadow-black/5">
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className="w-4 h-4 fill-accent text-accent drop-shadow-md" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic mb-8 relative z-10 text-lg font-medium leading-relaxed">
                  "{t.text}"
                </p>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-lg">{t.name}</div>
                  <div className="text-sm text-accent font-bold uppercase tracking-wider">{t.role}</div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

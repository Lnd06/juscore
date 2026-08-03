import React, { useState } from 'react';
import { ScrollReveal } from './Animations';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqData = [
  {
    question: "Como funciona o Simulador de Peças da OAB?",
    answer: "Nosso simulador utiliza inteligência artificial treinada com os critérios de correção oficiais da FGV. Você elabora sua peça e recebe na hora uma nota detalhada de 0 a 10, com feedback ponto a ponto sobre o que acertou, o que errou e como fundamentar melhor as teses jurídicas."
  },
  {
    question: "O Assistente de TCC realmente ajuda na formatação ABNT?",
    answer: "Sim! Ele ajuda na estruturação lógica do seu trabalho (capítulos, introdução e conclusão), sugere referências doutrinárias e auxilia na formatação de citações diretas, indiretas e na lista final de referências de acordo com as normas NBR 14724 e NBR 6023."
  },
  {
    question: "Os resultados das calculadoras são juridicamente oficiais?",
    answer: "As calculadoras do JusCore realizam simulações matemáticas precisas baseadas na CLT, Código Civil e índices monetários correntes. Elas servem como um excelente apoio estratégico inicial para dar andamento ou fundamentar petições. Recomendamos sempre a validação final por um advogado habilitado."
  },
  {
    question: "Posso utilizar as calculadoras gratuitamente?",
    answer: "Sim! Qualquer visitante pode realizar até 3 cálculos gratuitos por dia na nossa página inicial para testar as ferramentas. Caso precise de cálculos ilimitados, salvamento em histórico e geração de petições via IA, oferecemos planos acessíveis para estudantes e profissionais."
  },
  {
    question: "Como funciona o cancelamento dos planos?",
    answer: "Todos os nossos planos funcionam em modelo de assinatura recorrente mensal ou anual, sem fidelidade ou carência. Você pode cancelar sua assinatura com apenas um clique diretamente no painel do seu perfil, sem burocracia ou taxas de cancelamento."
  }
];

const FAQ = ({ onSupportClick }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-32 px-6 relative bg-[#080B15] overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <ScrollReveal direction="down" className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold mb-6">
            <HelpCircle className="w-4 h-4" />
            <span>FAQ Geral</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6 tracking-tight">
            Perguntas <span className="font-serif italic font-normal text-accent">Frequentes</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto font-normal">
            Tudo o que você precisa saber sobre o funcionamento das nossas ferramentas, planos e termos.
          </p>
        </ScrollReveal>

        <div className="space-y-4">
          {faqData.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <ScrollReveal key={index} delay={index * 100} direction="up">
                <div 
                  className={`rounded-[24px] border transition-all duration-300 overflow-hidden ${
                    isOpen 
                      ? 'border-accent/40 bg-accent/5 shadow-lg shadow-accent/5 dark:bg-gray-900/60' 
                      : 'border-white/[0.06] bg-juri-900/20 hover:border-white/15'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display font-bold text-base md:text-lg text-white tracking-tight pr-4">
                      {faq.question}
                    </span>
                    <div className={`w-8 h-8 rounded-full border border-white/[0.06] flex items-center justify-center transition-transform duration-300 ${
                      isOpen ? 'rotate-180 border-accent/40 text-accent bg-accent/10' : 'text-gray-450'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden border-t border-white/[0.06]"
                      >
                        <p className="p-6 md:p-8 text-sm md:text-base text-gray-400 leading-relaxed font-normal">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* CTA Suporte */}
        <ScrollReveal delay={500} direction="up" className="mt-16 text-center">
          <p className="text-sm text-gray-400 font-medium">
            Não encontrou a resposta que procurava?
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSupportClick?.();
            }}
            className="inline-flex items-center gap-2 text-accent font-bold mt-2 hover:text-accent-dark transition-colors group font-display text-sm uppercase tracking-wider"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Fale com o nosso suporte em tempo real</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FAQ;

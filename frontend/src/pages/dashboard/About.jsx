import React from 'react';
import { Sparkles, Shield, Compass, BookOpen, Scale, Award, Heart } from 'lucide-react';
import { Card } from '../../components/ui';

const About = ({ showCopyright = true }) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-accent/5 via-yellow-500/5 to-transparent border border-gray-100 dark:border-white/5 p-8 md:p-12">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold mb-6 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sobre o JusCore AI</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-4">
            Tecnologia que Simplifica e Transforma o Direito
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Nascemos com o propósito de democratizar o acesso ao conhecimento jurídico e potencializar a produtividade de acadêmicos, estudantes da OAB e profissionais de todo o Brasil através da inteligência artificial.
          </p>
        </div>
        
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      </div>

      {/* Main Mission & Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nossa Missão</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Facilitar a jornada acadêmica e profissional no Direito brasileiro, reduzindo tarefas repetitivas e permitindo foco no que realmente importa: a estratégia jurídica.
          </p>
        </Card>

        <Card className="p-6 space-y-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">IA Sob Medida</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Modelos de IA treinados de forma específica com a legislação nacional (CLT, CC, CPC) e as diretrizes oficiais de correção da FGV para a OAB.
          </p>
        </Card>

        <Card className="p-6 space-y-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tecnologia & Ética</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Compromisso com a segurança da informação, privacidade de dados e conformidade estrita com os limites de uso ético de tecnologias generativas no meio jurídico.
          </p>
        </Card>
      </div>

      {/* Detail Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-4">
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Pilares do JusCore AI
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Desenvolvemos uma plataforma que integra diversas ferramentas de ponta para acompanhar o ciclo de vida do estudante e do profissional de Direito.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 min-w-[2rem] rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Estudantes da OAB & Faculdade</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                  Simuladores interativos de peças práticas de 2ª fase com critérios FGV e gerador/corretor de TCC seguindo a normatização ABNT de ponta a ponta.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 min-w-[2rem] rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Cálculos e Ferramentas Práticas</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                  Calculadoras trabalhistas completas, atualizadores monetários e geradores de documentos prontos para otimizar a rotina de advogados.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 min-w-[2rem] rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Foco na Experiência do Usuário</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                  Desenvolvimento focado em usabilidade, velocidade e interfaces modernas de alta usabilidade (light e dark mode).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Showcase Card */}
        <div className="bg-gradient-to-tr from-accent/5 to-[#0E1321] dark:from-[#0B0F19] dark:to-[#0B0F19] border border-gray-100 dark:border-white/5 p-8 rounded-[32px] space-y-6">
          <div className="space-y-2">
            <div className="text-accent font-black text-4xl">100%</div>
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Brasileiro e Adaptado
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              O JusCore AI foi pensado desde o primeiro dia de acordo com a terminologia, costumes e leis brasileiras. Diferente de IAs gerais, nós entendemos o linguajar e a prática jurídica local.
            </p>
          </div>

          <div className="border-t border-gray-100 dark:border-white/5 pt-6 space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-white">Junte-se a nós</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Descubra como podemos acelerar seu aprendizado na faculdade de Direito, garantir sua aprovação na OAB ou automatizar a petição do seu escritório.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => window.location.href = '/dashboard/chat'}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-accent to-yellow-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-accent/15 hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0 text-center"
              >
                Começar a Usar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      {showCopyright && (
        <div className="mt-12 text-center border-t border-gray-100 dark:border-white/5 pt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; 2026 JusCore AI. Todos os direitos reservados.
          </p>
        </div>
      )}
    </div>
  );
};

export default About;

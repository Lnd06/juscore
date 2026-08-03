import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../landing/Navbar';
import Footer from '../landing/Footer';
import Calculator from '../dashboard/Calculator';
import { ScrollReveal } from '../landing/Animations';
import { Button, Card } from '../../components/ui';
import { 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  Baby, 
  Calculator as CalcIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';

const calculatorConfig = {
  rescisao: {
    tab: 'labor',
    icon: Briefcase,
    title: 'Calculadora de Rescisão Trabalhista Grátis (CLT)',
    subtitle: 'Simule saldo de salário, 13º proporcional, férias vencidas/proporcionais, FGTS e multa rescisória de forma simples e rápida.',
    seoTitle: 'Calculadora de Rescisão Trabalhista CLT Online e Grátis | JusCore AI',
    seoDescription: 'Calcule o valor da rescisão trabalhista online de forma gratuita. Simule demissão sem justa causa, com justa causa e pedido de demissão com FGTS e aviso prévio.',
    guideline: {
      intro: 'O cálculo de rescisão contratual é regulamentado pela Consolidação das Leis do Trabalho (CLT). O valor exato varia conforme a modalidade de dispensa e o tempo de serviço do colaborador.',
      rules: [
        'Sem Justa Causa: O empregado tem direito ao saldo de salário, aviso prévio, 13º proporcional, férias vencidas e proporcionais + 1/3, saque do FGTS e multa de 40% do FGTS.',
        'Pedido de Demissão: O trabalhador recebe saldo de salário, 13º proporcional, férias vencidas e proporcionais + 1/3. Perde o direito ao aviso prévio (se não trabalhado), saque do FGTS e multa de 40%.',
        'Justa Causa: O trabalhador perde a maioria dos direitos rescisórios, mantendo apenas o saldo de salário e férias vencidas (se houver) acrescidas de 1/3 constitucional.'
      ],
      faqs: [
        { q: 'O que é o aviso prévio indenizado?', a: 'Ocorre quando o empregador desobriga o trabalhador do cumprimento de suas atividades no período de 30 dias após a dispensa, pagando o valor correspondente a este salário na rescisão.' },
        { q: 'Como é calculada a multa do FGTS?', a: 'Nas demissões sem justa causa, o empregador deve depositar uma multa de 40% sobre o saldo total acumulado de FGTS daquele contrato de trabalho.' }
      ]
    }
  },
  atualizacao: {
    tab: 'correction',
    icon: BarChart3,
    title: 'Calculadora de Atualização Monetária Online',
    subtitle: 'Corrija valores judiciais ou contratuais com base nos principais índices de inflação oficiais do Brasil.',
    seoTitle: 'Calculadora de Atualização Monetária Judicial Grátis | JusCore AI',
    seoDescription: 'Atualize débitos judiciais e contratos com os índices IPCA-E, INPC, IGP-M e taxa SELIC de maneira ágil, precisa e 100% online.',
    guideline: {
      intro: 'A atualização monetária recompõe o poder de compra da moeda corroído pela inflação ao longo do tempo. É aplicada rotineiramente em execuções de sentenças judiciais e revisões de contratos.',
      rules: [
        'INPC/IBGE: Focado no custo de vida de famílias de menor renda, muito utilizado para atualizar verbas trabalhistas e previdenciárias.',
        'IPCA/IBGE: O índice oficial de inflação do país. O IPCA-E era amplamente utilizado para precatórios e débitos judiciais federais.',
        'IGP-M/FGV: Bastante aplicado em reajustes de aluguel e contratos comerciais e imobiliários.'
      ],
      faqs: [
        { q: 'A taxa SELIC serve como correção e juros?', a: 'Sim, sob a legislação recente brasileira (como a EC 113 e decisões do STF), em diversas situações a SELIC acumula tanto a correção monetária quanto os juros de mora em uma única taxa.' },
        { q: 'Qual índice usar para atualizar aluguel?', a: 'O IGP-M é o índice mais tradicional para reajuste de contratos de aluguel, embora nos últimos anos o IPCA também venha sendo amplamente adotado em negociações.' }
      ]
    }
  },
  honorarios: {
    tab: 'fees',
    icon: DollarSign,
    title: 'Calculadora de Honorários Advocatícios',
    subtitle: 'Calcule e planeje honorários contratuais, sucumbenciais e quota-litis para precificar seus serviços jurídicos com precisão.',
    seoTitle: 'Calculadora de Honorários Advocatícios e Sucumbência | JusCore AI',
    seoDescription: 'Simule seus honorários de forma estratégica com a tabela da OAB, contratos quota-litis e sucumbência fixada em juízo.',
    guideline: {
      intro: 'A correta precificação dos honorários é fundamental para a saúde financeira do escritório. A remuneração do advogado é dividida entre contratual, sucumbencial e assistencial.',
      rules: [
        'Honorários Contratuais: Estabelecidos livremente entre advogado e cliente no início da demanda, geralmente baseados na tabela de honorários mínimos recomendada pela OAB regional.',
        'Quota-Litis (Ad Exitum): O advogado recebe um percentual sobre o ganho financeiro obtido pelo cliente ao final do processo, limitado geralmente a 30% a 50% em casos complexos.',
        'Honorários Sucumbenciais: Fixados pelo juiz na sentença, pagos pela parte perdedora ao advogado da parte vencedora (entre 10% e 20% sobre o valor da condenação no CPC/2015).'
      ],
      faqs: [
        { q: 'O que é a sucumbência recursal?', a: 'O tribunal, ao julgar recurso, majorará os honorários fixados anteriormente levando em conta o trabalho adicional realizado em grau recursal.' },
        { q: 'Qual a diferença entre honorários contratuais e sucumbenciais?', a: 'Os contratuais são acordados e pagos pelo próprio cliente. Os sucumbenciais são arbitrados pelo juiz e pagos pela parte vencida ao advogado vencedor.' }
      ]
    }
  },
  juros: {
    tab: 'interest',
    icon: TrendingUp,
    title: 'Calculadora de Juros de Mora e Juros Legais',
    subtitle: 'Simule a incidência de juros simples ou compostos sobre dívidas, condenações cíveis ou fiscais.',
    seoTitle: 'Calculadora de Juros Moratórios e Legais Cíveis | JusCore AI',
    seoDescription: 'Calcule juros de mora legais (1% ao mês ou Selic) sobre títulos de crédito ou passivos judiciais de acordo com o Código Civil.',
    guideline: {
      intro: 'Os juros de mora punem o atraso no cumprimento de uma obrigação pecuniária. Podem ser convencionados no contrato ou aplicados conforme as disposições legais vigentes.',
      rules: [
        'Juros de 1% ao mês: A regra geral do Código Civil (art. 406) estabelece o limite de 1% ao mês, a não ser que outra taxa seja definida por lei específica.',
        'Juros Simples: Aplicam-se apenas sobre o valor do capital principal da dívida, sem capitalização de juros sobre juros.',
        'Juros Compostos: Capitalizam a cada período, incidindo sobre o capital acrescido dos juros acumulados anteriormente.'
      ],
      faqs: [
        { q: 'A partir de quando correm os juros de mora?', a: 'Em obrigações com vencimento certo, correm a partir do vencimento. Em responsabilidade extracontratual, a partir do evento danoso. Nas contratuais cíveis sem vencimento, a partir da citação jurídica.' },
        { q: 'O que é a taxa SELIC acumulada?', a: 'É a taxa básica de juros da economia brasileira que engloba correção monetária e juros moratórios. Quando aplicada, proíbe-se a cumulação com qualquer outro índice de juros.' }
      ]
    }
  },
  prazos: {
    tab: 'deadline',
    icon: Calendar,
    title: 'Calculadora de Prazos Processuais (CPC/2015)',
    subtitle: 'Projete datas de início e vencimento de recursos e petições cíveis de forma automatizada.',
    seoTitle: 'Calculadora de Prazos Processuais em Dias Úteis CPC | JusCore AI',
    seoDescription: 'Calcule prazos processuais em dias úteis de acordo com o CPC/2015 de forma ágil, considerando suspensões e feriados oficiais.',
    guideline: {
      intro: 'A contagem de prazos sob a regência do Código de Processo Civil de 2015 revolucionou o cotidiano dos profissionais do direito ao estabelecer a contagem exclusivamente em dias úteis.',
      rules: [
        'Dias Úteis: Sábados, domingos e feriados nacionais, estaduais ou locais não são computados na contagem processual civil.',
        'Regra de Exclusão e Inclusão: Exclui-se o dia do começo (publicação no Diário) e inclui-se o dia do vencimento.',
        'Férias do Advogado: Os prazos ficam suspensos entre os dias 20 de dezembro e 20 de janeiro de cada ano.'
      ],
      faqs: [
        { q: 'Como funciona a contagem em processos eletrônicos?', a: 'Considera-se publicado o ato no primeiro dia útil subsequente ao da disponibilização da informação no Diário da Justiça Eletrônico (DJE).' },
        { q: 'O que acontece em caso de indisponibilidade do sistema?', a: 'Se o sistema eletrônico do tribunal estiver indisponível no dia do vencimento do prazo, este será prorrogado para o primeiro dia útil seguinte.' }
      ]
    }
  },
  pensao: {
    tab: 'alimony',
    icon: Baby,
    title: 'Calculadora de Pensão Alimentícia Estimada',
    subtitle: 'Simule o valor estimado para pensão civil com base no binômio de necessidade do alimentado e capacidade do pagador.',
    seoTitle: 'Calculadora de Pensão Alimentícia Online e Grátis | JusCore AI',
    seoDescription: 'Simule o valor ideal de pensão alimentícia de forma rápida e compreenda o percentual com base em salários mínimos.',
    guideline: {
      intro: 'O dever de prestar alimentos baseia-se na solidariedade familiar e visa garantir a subsistência do alimentando, compreendendo moradia, saúde, vestuário, educação e lazer.',
      rules: [
        'Binômio Necessidade-Possibilidade: O juiz fixará a pensão ponderando as necessidades reais de quem pede e os recursos financeiros de quem paga.',
        'Proporcionalidade: Havendo mais de um filho ou múltiplos alimentantes, os gastos devem ser repartidos de forma justa e proporcional.',
        'Percentuais Usuais: Embora não haja lei fixando um valor fixo, o percentual de 30% dos rendimentos líquidos do pagador é frequentemente usado como referência na jurisprudência.'
      ],
      faqs: [
        { q: 'A pensão incide sobre o 13º e férias?', a: 'Sim, a pensão incide habitualmente sobre o décimo terceiro salário e sobre o terço constitucional de férias recebido pelo alimentante.' },
        { q: 'O valor da pensão pode ser alterado?', a: 'Sim. Caso haja mudança na situação financeira de quem paga ou nas necessidades de quem recebe, é possível requerer a revisão (ação revisional) ou exoneração da pensão.' }
      ]
    }
  },
  financeira: {
    tab: 'simple',
    icon: CalcIcon,
    title: 'Calculadora Financeira Jurídica',
    subtitle: 'Simulações rápidas de parcelas, taxas efetivas de juros e amortização contratual.',
    seoTitle: 'Calculadora Financeira Geral Online | JusCore AI',
    seoDescription: 'Calcule juros, taxas anuais equivalentes e simule parcelamentos de contratos bancários ou dívidas comerciais.',
    guideline: {
      intro: 'Ferramenta financeira para calcular a evolução de um capital sob taxas de juros acordadas, auxiliando na verificação de juros abusivos em contratos de empréstimo ou financiamento.',
      rules: [
        'Tabela Price: Sistema de amortização francês no qual as prestações são fixas e os juros decrescentes.',
        'SAC (Sistema de Amortização Constante): As prestações são decrescentes, pois a cota de amortização do principal é constante em todas as parcelas.',
        'Juros Abusivos: Ocorre quando as instituições financeiras praticam taxas significativamente acima da taxa média de mercado divulgada pelo Banco Central.'
      ],
      faqs: [
        { q: 'O que é a taxa de juros efetiva anual?', a: 'É a taxa de juros real acumulada que incide sobre o contrato no período de um ano, levando em conta a capitalização mensal dos juros.' },
        { q: 'Como identificar juros sobre juros?', a: 'Ocorre através do anatocismo (capitalização de juros), onde a taxa nominal é capitalizada mensalmente, fazendo com que a taxa efetiva anual seja maior do que a simples multiplicação por 12.' }
      ]
    }
  }
};

const PublicCalculatorPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  // Redirect to home if type is invalid
  const config = calculatorConfig[type];

  useEffect(() => {
    if (!config) {
      navigate('/calculadoras');
    }
  }, [type, config, navigate]);

  useEffect(() => {
    if (config) {
      document.title = config.seoTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', config.seoDescription);
      }
    }
  }, [config]);

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-sans overflow-x-hidden relative pt-20">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-accent/5 to-transparent blur-3xl pointer-events-none" />

      <Navbar />

      {/* Main Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-8">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <span>/</span>
          <Link to="/calculadoras" className="hover:text-accent transition-colors">Calculadoras</Link>
          <span>/</span>
          <span className="text-accent">{type}</span>
        </div>

        {/* Title and Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          <div className="lg:col-span-7 space-y-6">
            <ScrollReveal direction="left">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold mb-4">
                <Icon className="w-4 h-4 animate-pulse" />
                <span className="uppercase tracking-widest">Ferramenta Pública Gratuita</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-4">
                {config.title}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-2xl">
                {config.subtitle}
              </p>
            </ScrollReveal>

            {/* Guideline Article for SEO */}
            <ScrollReveal direction="left" delay={200} className="border-t border-gray-100 dark:border-white/5 pt-8 space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
                  Como funciona este cálculo?
                </h2>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                  {config.guideline.intro}
                </p>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-3 uppercase tracking-wider text-[11px] text-accent">
                  Regras e Diretrizes Importantes:
                </h3>
                <ul className="space-y-3.5">
                  {config.guideline.rules.map((rule, idx) => (
                    <li key={idx} className="flex gap-3 text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                      <span className="text-accent font-bold mt-0.5">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>

          {/* Interactive Calculator Container */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-accent to-blue-600 rounded-[40px] opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" />
            <Card className="relative p-6 md:p-8 rounded-[40px] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[500px]">
              <div className="public-calculator-container w-full">
                <Calculator mode="public" defaultTab={config.tab} />
              </div>
            </Card>
          </div>
        </div>

        {/* Detailed FAQ */}
        <section className="border-t border-gray-100 dark:border-white/5 pt-16 mb-20">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
            Perguntas Frequentes sobre o Cálculo de {config.title.replace('Calculadora de ', '')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {config.guideline.faqs.map((faq, i) => (
              <div key={i} className="p-6 rounded-[24px] bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base md:text-lg">
                  {faq.q}
                </h3>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Conversion CTA banner */}
        <ScrollReveal direction="up" className="relative overflow-hidden rounded-[32px] p-8 md:p-12 bg-gradient-to-b from-gray-900 to-black dark:from-gray-800 dark:to-gray-950 text-white border border-accent/30 shadow-2xl mb-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-widest">
              <Sparkles className="w-4.5 h-4.5" />
              <span>Gere Petições Instantâneas</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Gostou da simulação? Transforme esse cálculo em uma petição completa com nossa IA.
            </h2>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed font-medium">
              Ao cadastrar-se no JusCore AI, advogados e estudantes de direito contam com cálculos ilimitados, histórico na nuvem e podem exportar esboços estruturados de petições diretamente para o editor de documentos em menos de 1 minuto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => navigate('/register')}
                className="bg-accent text-white font-black hover:bg-accent-dark h-14 px-8 rounded-full shadow-lg shadow-accent/20 group text-xs uppercase tracking-widest border-none"
              >
                Criar Minha Conta Grátis
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="border-white/20 text-white hover:bg-white/5 hover:border-white/40 h-14 px-8 rounded-full text-xs font-black uppercase tracking-widest"
              >
                Entrar na Plataforma
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Trust disclaimer */}
        <div className="flex items-center gap-3 justify-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pt-4">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span>Conexão Segura SSL de Alta Criptografia</span>
        </div>

      </main>

      <Footer onCtaClick={() => navigate('/register')} />
    </div>
  );
};

export default PublicCalculatorPage;

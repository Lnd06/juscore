import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, BookOpen, AlertTriangle, Loader2, RotateCcw, Star,
  Clock, Play, Pause, Award, ClipboardList, PenTool, Sparkles, HelpCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { SearchableDropdown } from '../../components/ui';
import { cn } from '@/lib/utils';

const CubeIcon = ({ className }) => (
  <svg 
    viewBox="0 0 108 125" 
    fill="none" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M2.51465 32.7531L53.5146 64.2531M105.015 32.7531L105.515 90.2531L53.5146 122.253L1.51465 90.7531L2.51465 32.7531L54.0146 1.75305L105.015 32.7531ZM53.5146 64.2531V122.253M53.5146 64.2531L105.015 32.7531" 
      stroke="currentColor" 
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TIPOS_PECA = [
  'Petição Inicial Cível',
  'Petição Inicial Trabalhista',
  'Contestação',
  'Recurso de Apelação',
  'Recurso Ordinário (Trabalhista)',
  'Recurso Especial',
  'Mandado de Segurança',
  'Habeas Corpus',
  'Agravo de Instrumento',
  'Embargos de Declaração',
  'Apelação Criminal',
  'Ação Popular',
  'Ação Civil Pública',
];

const AREAS = [
  'Direito Civil',
  'Direito Penal',
  'Direito do Trabalho',
  'Direito Administrativo',
  'Direito Constitucional',
  'Direito Tributário',
  'Direito Empresarial',
  'Direito do Consumidor',
  'Direito Previdenciário',
];

const CRITERIOS_OAB = [
  { item: 'Peça Cabível & Competência', desc: 'Identificação correta da peça processual e direcionamento ao juízo competente.', peso: '0,50' },
  { item: 'Fatos & Fundamentação Fática', desc: 'Exposição lógica e completa da situação jurídica do cliente e das teses preliminares.', peso: '1,50' },
  { item: 'Teses Jurídicas de Mérito', desc: 'Demonstração dos fundamentos legais, constitucionais e jurisprudenciais aplicáveis.', peso: '5,00' },
  { item: 'Pedidos & Fechamento', desc: 'Clareza nos requerimentos de mérito, tutela de urgência, custas e honorários.', peso: '1,50' },
  { item: 'Estrutura & Linguagem Jurídica', desc: 'Coesão do texto processual, respeito às regras gramaticais e jargão formal.', peso: '1,50' },
];

const LOADING_STEPS = [
  'Analisando estrutura formal da petição...',
  'Avaliando competência, legitimidade e adequação da peça...',
  'Verificando artigos legais, jurisprudências e fundamentos fáticos...',
  'Computando pontuações parciais e formulando nota de aprovação...'
];

const STEPS = [
  { id: 'caso', label: 'Caso', icon: ClipboardList },
  { id: 'resposta', label: 'Redação', icon: PenTool },
  { id: 'resultado', label: 'Resultado', icon: Award },
];

export default function OabSimulator() {
  const { token } = useAuth();
  const [tipoPeca, setTipoPeca] = useState('');
  const [areaDireito, setAreaDireito] = useState('');
  const [enunciado, setEnunciado] = useState('');
  const [textoPeca, setTextoPeca] = useState('');
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('caso');
  const [tempo, setTempo] = useState(18000);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [animateResultado, setAnimateResultado] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerAtivo && tempo > 0) {
      interval = setInterval(() => setTempo(prev => prev - 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerAtivo, tempo]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 4000);
      return () => clearInterval(interval);
    } else {
      setLoadingStep(0);
    }
  }, [loading]);

  const toggleTimer = () => setTimerAtivo(!timerAtivo);
  const resetTimer = () => { setTimerAtivo(false); setTempo(18000); };

  const formatarTempo = (segundos) => {
    const hrs = Math.floor(segundos / 3600);
    const mins = Math.floor((segundos % 3600) / 60);
    const secs = segundos % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalCaracteres = textoPeca.length;
  const totalPalavras = textoPeca.trim() === '' ? 0 : textoPeca.trim().split(/\s+/).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tipoPeca || !enunciado.trim() || !textoPeca.trim()) {
      setError('Preencha o tipo de peça, o enunciado e o texto da sua peça.');
      if (!tipoPeca || !enunciado.trim()) setStep('caso');
      return;
    }
    setError('');
    setResultado('');
    setLoading(true);
    setTimerAtivo(false);
    setStep('resultado');
    try {
      const res = await axios.post('/api/chat/oab-simulator', {
        tipoPeca, areaDireito, enunciado, textoPeca,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResultado(res.data.resultado);
      setAnimateResultado(true);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('🔒 Este recurso é exclusivo do plano Estudante Pro.');
      } else {
        setError('Erro ao processar sua peça. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTipoPeca(''); setAreaDireito(''); setEnunciado(''); setTextoPeca('');
    setResultado(''); setError(''); setStep('caso'); resetTimer();
  };

  const goToRedacao = () => {
    if (enunciado.trim() === '' || tipoPeca === '') {
      setError('Preencha o tipo de peça e o enunciado antes de prosseguir.');
      return;
    }
    setError('');
    setStep('resposta');
    setTimerAtivo(true);
  };

  const renderMarkdown = (text) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-xs font-bold text-accent mt-4 mb-2 uppercase tracking-wider flex items-center gap-1.5"><span class="w-1.5 h-1.5 bg-accent rounded-full inline-block"></span>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold text-gray-200 mt-6 mb-3 border-b border-juri-800/60 pb-1">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-base font-extrabold text-white mt-5 mb-4 uppercase tracking-widest border-b-2 border-accent/20 pb-2 flex items-center gap-2"><span class="text-accent">★</span> $1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-300 text-xs py-1 leading-relaxed">$1</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  const TypewriterMessage = ({ content, speed = 8, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const onCompleteRef = useRef(onComplete);
    
    useEffect(() => {
      onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
      if (!content) return;
      
      let index = 0;
      const step = 8;
      
      const interval = setInterval(() => {
        index += step;
        if (index >= content.length) {
          setDisplayedText(content);
          clearInterval(interval);
          if (onCompleteRef.current) onCompleteRef.current();
        } else {
          setDisplayedText(content.slice(0, index));
        }
      }, speed);
      
      return () => clearInterval(interval);
    }, [content, speed]);

    return <div dangerouslySetInnerHTML={{ __html: renderMarkdown(displayedText) }} />;
  };

  // Step indicator for the stepper UI
  const stepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="p-3 sm:p-5 lg:p-6 w-full space-y-4 sm:space-y-5 animate-in fade-in duration-500 h-full overflow-y-auto custom-scrollbar pb-16">
      {/* ─── Compact Header ─── */}
      <div className="bg-white dark:bg-juri-900 p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-juri-800/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-gray-950 dark:text-gray-100 flex items-center gap-2">
              <CubeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-accent shrink-0" />
              <span className="truncate">Simulador OAB</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">
              Corretor IA nos padrões exatos da prova da OAB.
            </p>
          </div>

          {/* Inline Timer */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-juri-950/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-juri-800/60 shrink-0">
            <Clock className={cn("w-3.5 h-3.5", timerAtivo ? "text-accent animate-pulse" : "text-gray-400")} />
            <span className="font-mono text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 tabular-nums">
              {formatarTempo(tempo)}
            </span>
            <div className="flex items-center gap-0.5 border-l border-gray-200 dark:border-juri-800 pl-2">
              <button onClick={toggleTimer} className={cn("p-1 rounded", timerAtivo ? "text-amber-500" : "text-emerald-500")} title={timerAtivo ? 'Pausar' : 'Iniciar'}>
                {timerAtivo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button onClick={resetTimer} className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors" title="Resetar">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 mt-2 uppercase tracking-wider">
          <Star className="w-2.5 h-2.5" /> Estudante Pro
        </span>
      </div>

      {/* ─── Step Indicator (pill tabs) ─── */}
      <div className="flex gap-1 bg-white dark:bg-juri-900 p-1 rounded-xl border border-gray-200 dark:border-juri-800/80 shadow-sm">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isPast = i < stepIndex;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200",
                isActive
                  ? "bg-accent text-slate-950 shadow-sm"
                  : isPast
                    ? "text-accent hover:bg-accent/10"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-juri-950/40"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">{s.label}</span>
              <span className="xs:hidden sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Content Area ─── */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

        {/* ═══ STEP 1: Caso ═══ */}
        {step === 'caso' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-juri-900 rounded-xl border border-gray-200 dark:border-juri-800/80 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Tipo de Peça *</label>
                  <SearchableDropdown
                    value={tipoPeca}
                    onChange={setTipoPeca}
                    options={TIPOS_PECA}
                    placeholder="Selecione o tipo..."
                    searchPlaceholder="Buscar tipo de peça..."
                    variant="accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Área do Direito</label>
                  <SearchableDropdown
                    value={areaDireito}
                    onChange={setAreaDireito}
                    options={AREAS}
                    placeholder="Selecione a área..."
                    searchPlaceholder="Buscar área..."
                    variant="accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Enunciado Oficial da Prova *</label>
                <textarea
                  value={enunciado}
                  onChange={(e) => setEnunciado(e.target.value)}
                  rows={8}
                  placeholder="Cole aqui o caso prático fornecido pela banca..."
                  className="w-full rounded-lg border border-gray-200 dark:border-juri-800 bg-white dark:bg-juri-950 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 resize-none leading-relaxed"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={goToRedacao}
              className="w-full sm:w-auto sm:ml-auto sm:flex px-5 py-3 rounded-xl bg-accent hover:bg-accent-dark text-slate-950 font-bold text-sm tracking-wider uppercase shadow-sm transition-all flex items-center justify-center gap-2"
            >
              Prosseguir para a Redação →
            </button>
          </div>
        )}

        {/* ═══ STEP 2: Redação ═══ */}
        {step === 'resposta' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-juri-900 rounded-xl border border-gray-200 dark:border-juri-800/80 shadow-sm overflow-hidden">
              {/* Summary bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-juri-950/30 border-b border-gray-200 dark:border-juri-800/60 text-[10px] text-gray-500 dark:text-gray-400">
                <span className="font-semibold truncate">{tipoPeca || 'Peça'} • {areaDireito || 'Geral'}</span>
                <span className="font-mono shrink-0 ml-2">Palavras: <strong className="text-gray-800 dark:text-gray-200">{totalPalavras}</strong></span>
              </div>
              
              <textarea
                value={textoPeca}
                onChange={(e) => setTextoPeca(e.target.value)}
                rows={12}
                placeholder="EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO..."
                className="w-full bg-white dark:bg-juri-950/80 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none font-mono leading-relaxed"
                style={{
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0) 96%, rgba(212,175,55,0.05) 96%)',
                  backgroundSize: '100% 28px',
                }}
              />

              <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-juri-950 border-t border-gray-200 dark:border-juri-800/80 text-[10px] text-gray-400 font-mono">
                <span>Palavras: <strong className="text-gray-700 dark:text-gray-200">{totalPalavras}</strong></span>
                <span>Caracteres: <strong className="text-gray-700 dark:text-gray-200">{totalCaracteres}</strong></span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setStep('caso')}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-juri-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
              >
                ← Voltar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent hover:bg-accent-dark text-slate-950 font-bold transition-all text-sm tracking-wider uppercase shadow-sm disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                {loading ? 'Avaliando...' : 'Entregar e Corrigir'}
              </button>

              {(resultado || enunciado || textoPeca) && (
                <button type="button" onClick={handleReset} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-juri-800 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all" title="Zerar Simulado">
                  <RotateCcw className="w-4 h-4 mx-auto" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Resultado ═══ */}
        {step === 'resultado' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-juri-900 rounded-xl border border-gray-200 dark:border-juri-800/80 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-juri-800/60 bg-gray-50/50 dark:bg-juri-950/20">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                <span className="font-bold text-gray-950 dark:text-gray-100 text-xs uppercase tracking-wider">Espelho & Resultado OAB</span>
              </div>

              <div className="p-4 sm:p-5">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-5 text-center animate-in fade-in duration-300">
                    <div className="relative flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                      <Sparkles className="w-4 h-4 text-accent absolute animate-pulse" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                      <p className="text-xs font-bold text-accent uppercase tracking-wider animate-pulse">
                        {LOADING_STEPS[loadingStep]}
                      </p>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        Pode levar até 20 segundos.
                      </p>
                    </div>
                    <div className="w-full max-w-xs space-y-2">
                      {LOADING_STEPS.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[10px]">
                          <div className={cn("w-3 h-3 rounded-full flex items-center justify-center border text-[7px]",
                            idx < loadingStep ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                              : idx === loadingStep ? 'border-accent text-accent animate-spin'
                              : 'border-gray-200 dark:border-juri-800 text-gray-400'
                          )}>
                            {idx < loadingStep ? '✓' : idx === loadingStep ? '◌' : '○'}
                          </div>
                          <span className={cn(idx <= loadingStep ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400')}>{s.slice(0, 35)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!loading && !resultado && !error && (
                  <div className="space-y-4">
                    <div className="bg-gray-50/50 dark:bg-juri-950/40 p-3 sm:p-4 rounded-lg border border-gray-200/50 dark:border-juri-800/80">
                      <h4 className="text-[11px] font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5 text-accent" />
                        Parâmetros de Avaliação (FGV)
                      </h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        Sua redação será julgada conforme os critérios da segunda fase do Exame da Ordem.
                      </p>
                    </div>

                    {/* Mobile: cards instead of table */}
                    <div className="space-y-2 sm:hidden">
                      {CRITERIOS_OAB.map((c, i) => (
                        <div key={i} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-juri-950/30 rounded-lg border border-gray-200/50 dark:border-juri-800/60">
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-100">{c.item}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5 leading-relaxed">{c.desc}</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-accent shrink-0">{c.peso}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg border border-accent/15">
                        <span className="text-[11px] font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider">Nota Máxima Total</span>
                        <span className="text-sm font-mono font-bold text-accent">10,00</span>
                      </div>
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden sm:block overflow-x-auto border border-gray-200 dark:border-juri-800/80 rounded-lg">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-juri-950 border-b border-gray-200 dark:border-juri-800/80 text-gray-400 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Item do Espelho</th>
                            <th className="py-2.5 px-3">Critério de Avaliação</th>
                            <th className="py-2.5 px-3 text-right">Peso Máx.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 dark:divide-juri-800/50 text-gray-700 dark:text-gray-300">
                          {CRITERIOS_OAB.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50/30 dark:hover:bg-juri-950/20">
                              <td className="py-2.5 px-3 font-semibold text-gray-950 dark:text-gray-100">{c.item}</td>
                              <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 leading-normal">{c.desc}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-accent">{c.peso}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 dark:bg-juri-950/40 font-bold">
                            <td colSpan="2" className="py-3 px-3 uppercase tracking-wider text-gray-900 dark:text-gray-200 text-right">Nota Máxima Total</td>
                            <td className="py-3 px-3 text-right font-mono text-xs text-accent">10,00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 bg-accent/5 rounded-lg border border-accent/15">
                      <HelpCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                        <strong>Como funciona?</strong> Volte à aba <strong>Redação</strong>, digite sua petição e clique em <strong>Entregar e Corrigir</strong>. A IA avaliará ponto a ponto.
                      </p>
                    </div>
                  </div>
                )}

                {!loading && resultado && (
                  <div className="animate-in fade-in duration-500">
                    <div className="bg-[#FCFCFC] dark:bg-juri-950/90 border border-gray-200 dark:border-juri-800 p-4 sm:p-5 rounded-lg shadow-sm relative text-gray-800 dark:text-gray-100 leading-relaxed text-xs sm:text-sm">
                      <div className="absolute top-0 left-0 w-1 bg-accent h-full rounded-l-lg" />
                      
                      <div className="flex items-center justify-between border-b border-gray-200 dark:border-juri-800/80 pb-3 mb-4 pl-3">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-accent" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">RESULTADO DE CORREÇÃO OFICIAL</span>
                        </div>
                      </div>

                      {animateResultado ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-300 pl-3">
                          <TypewriterMessage
                            content={resultado}
                            onComplete={() => setAnimateResultado(false)}
                          />
                        </div>
                      ) : (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-300 pl-3"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(resultado) }}
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-4 w-full py-3 rounded-xl border border-gray-200 dark:border-juri-800 text-gray-500 hover:text-accent dark:hover:text-accent transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Novo Simulado
                    </button>
                  </div>
                )}

                {!loading && error && !resultado && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                    <p className="text-sm text-red-500 font-semibold">{error}</p>
                    <button type="button" onClick={() => setStep('resposta')} className="text-xs text-accent font-bold hover:underline">
                      ← Voltar à Redação
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

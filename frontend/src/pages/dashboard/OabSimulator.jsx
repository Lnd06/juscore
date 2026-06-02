import React, { useState, useEffect } from 'react';
import { 
  Scale, BookOpen, CheckCircle, AlertTriangle, ChevronDown, Loader2, RotateCcw, Star,
  Clock, Play, Pause, Award, ClipboardList, PenTool, CheckSquare, Sparkles, HelpCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

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

export default function OabSimulator() {
  const { token } = useAuth();
  const [tipoPeca, setTipoPeca] = useState('');
  const [areaDireito, setAreaDireito] = useState('');
  const [enunciado, setEnunciado] = useState('');
  const [textoPeca, setTextoPeca] = useState('');
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Premium Exam Workspace states
  const [activeTab, setActiveTab] = useState('caso'); // 'caso' ou 'resposta'
  const [tempo, setTempo] = useState(18000); // 5 horas (18000 segundos)
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let interval = null;
    if (timerAtivo && tempo > 0) {
      interval = setInterval(() => {
        setTempo(prev => prev - 1);
      }, 1000);
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
  const resetTimer = () => {
    setTimerAtivo(false);
    setTempo(18000);
  };

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
      setActiveTab('caso');
      return;
    }
    setError('');
    setResultado('');
    setLoading(true);
    setTimerAtivo(false); // Para o timer ao entregar
    try {
      const res = await axios.post('/api/chat/oab-simulator', {
        tipoPeca, areaDireito, enunciado, textoPeca,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResultado(res.data.resultado);
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
    setTipoPeca('');
    setAreaDireito('');
    setEnunciado('');
    setTextoPeca('');
    setResultado('');
    setError('');
    setActiveTab('caso');
    resetTimer();
  };

  const renderMarkdown = (text) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-xs font-bold text-accent mt-4 mb-2 uppercase tracking-wider flex items-center gap-1.5"><span class="w-1.5 h-1.5 bg-accent rounded-full inline-block"></span>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold text-gray-200 mt-6 mb-3 border-b border-juri-800/60 pb-1 flex items-center justify-between">$2</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-base font-extrabold text-white mt-5 mb-4 uppercase tracking-widest border-b-2 border-accent/20 pb-2 flex items-center gap-2"><span class="text-accent">★</span> $1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-300 text-xs py-1 leading-relaxed">$1</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="p-4 sm:p-5 lg:p-6 w-full space-y-6 animate-in fade-in duration-500">
      {/* Header & Simulated Timer Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-juri-900 p-5 rounded-md border border-gray-200 dark:border-juri-800/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        
        <div className="flex items-start gap-3.5 relative z-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-950 dark:text-gray-100 flex items-center gap-2.5">
              <Scale className="w-5 h-5 text-accent" />
              Simulador de Peças OAB
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1 max-w-lg leading-relaxed">
              Escreva sua resposta para o caso prático no editor. Nosso corretor IA avaliará sua peça nos padrões exatos da prova da OAB.
            </p>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 mt-2 uppercase tracking-wider">
              <Star className="w-2.5 h-2.5" /> Estudante Pro
            </span>
          </div>
        </div>

        {/* Dynamic Interactive Timer */}
        <div className="relative z-10 flex items-center gap-3 bg-gray-50 dark:bg-juri-950/80 px-4 py-2.5 rounded-md border border-gray-200 dark:border-juri-800/60 self-start sm:self-auto min-w-[260px]">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md ${timerAtivo ? 'bg-accent/10 text-accent animate-pulse' : 'bg-gray-100 dark:bg-juri-900 text-gray-400'}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Cronômetro de Exame</span>
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-100 tracking-wider">
                {formatarTempo(tempo)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-auto border-l border-gray-200 dark:border-juri-800 pl-3">
            <button
              onClick={toggleTimer}
              className={`p-1.5 rounded transition-all hover:scale-105 ${timerAtivo ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500'}`}
              title={timerAtivo ? 'Pausar Cronômetro' : 'Iniciar Cronômetro'}
            >
              {timerAtivo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-1.5 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Resetar tempo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left Column: Distraction-free Specialized Workspace */}
        <div className="rounded-md border border-gray-200 dark:border-juri-800/80 bg-white dark:bg-juri-900 shadow-sm overflow-hidden flex flex-col">
          {/* Workspace Tabs Header */}
          <div className="flex border-b border-gray-200 dark:border-juri-800/60 bg-gray-50/50 dark:bg-juri-950/20 px-4">
            <button
              onClick={() => setActiveTab('caso')}
              className={`flex items-center gap-2 py-3 px-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'caso'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              1. Enunciado & Caso
            </button>
            <button
              onClick={() => setActiveTab('resposta')}
              className={`flex items-center gap-2 py-3 px-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'resposta'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <PenTool className="w-4 h-4" />
              2. Redação da Peça
            </button>
          </div>

          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'caso' ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tipo de Peça */}
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Tipo de Peça *</label>
                      <div className="relative">
                        <select
                          value={tipoPeca}
                          onChange={(e) => setTipoPeca(e.target.value)}
                          className="w-full appearance-none rounded-md border border-gray-200 dark:border-juri-800 bg-white dark:bg-juri-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent/40 h-9"
                        >
                          <option value="">Selecione o tipo...</option>
                          {TIPOS_PECA.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Área do Direito */}
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Área do Direito</label>
                      <div className="relative">
                        <select
                          value={areaDireito}
                          onChange={(e) => setAreaDireito(e.target.value)}
                          className="w-full appearance-none rounded-md border border-gray-200 dark:border-juri-800 bg-white dark:bg-juri-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent/40 h-9"
                        >
                          <option value="">Selecione a área...</option>
                          {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Enunciado */}
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Enunciado Oficial da Prova *</label>
                    <textarea
                      value={enunciado}
                      onChange={(e) => setEnunciado(e.target.value)}
                      rows={12}
                      placeholder="Cole aqui o caso prático fornecido pela banca..."
                      className="w-full rounded-md border border-gray-200 dark:border-juri-800 bg-white dark:bg-juri-950 px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent/40 resize-none font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (enunciado.trim() === '' || tipoPeca === '') {
                          setError('Preencha o tipo de peça e o enunciado antes de prosseguir.');
                        } else {
                          setError('');
                          setActiveTab('resposta');
                          setTimerAtivo(true); // Ativa o timer automaticamente ao escrever!
                        }
                      }}
                      className="px-5 py-2 rounded-md bg-accent hover:bg-accent-dark text-slate-950 font-bold text-xs tracking-wider uppercase shadow-sm transition-all h-9 flex items-center justify-center gap-1.5"
                    >
                      Prosseguir para a Peça →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Distraction-Free Custom Text Area */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Redação Processual da Peça *</label>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-150 dark:bg-juri-950 px-2 py-0.5 rounded border border-gray-200 dark:border-juri-800/80 font-mono">
                        Limite Recomendado: 150 linhas
                      </span>
                    </div>
                    
                    <div className="relative border border-gray-200 dark:border-juri-800/80 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-accent/20 focus-within:border-accent/40">
                      {/* Line guides simulation inside the editor */}
                      <textarea
                        value={textoPeca}
                        onChange={(e) => setTextoPeca(e.target.value)}
                        rows={14}
                        placeholder="EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO..."
                        className="w-full bg-white dark:bg-juri-950/80 px-4 py-3 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none resize-none font-mono leading-relaxed"
                        style={{
                          backgroundImage: 'linear-gradient(rgba(0,0,0,0) 96%, rgba(212,175,55,0.05) 96%)',
                          backgroundSize: '100% 24px',
                        }}
                      />
                      
                      {/* Editor Status Bar */}
                      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-juri-950 border-t border-gray-200 dark:border-juri-800/80 text-[10px] text-gray-400 font-mono">
                        <span>Palavras: <strong className="text-gray-700 dark:text-gray-200">{totalPalavras}</strong></span>
                        <span>Caracteres: <strong className="text-gray-700 dark:text-gray-200">{totalCaracteres}</strong></span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('caso')}
                      className="px-4 py-2.5 rounded-md border border-gray-200 dark:border-juri-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all text-xs font-bold uppercase tracking-wider h-10"
                    >
                      ← Voltar ao Enunciado
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-accent hover:bg-accent-dark text-slate-950 font-bold transition-all text-xs tracking-wider uppercase shadow-sm disabled:opacity-40 h-10"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                      {loading ? 'Finalizando Avaliação...' : 'Entregar e Corrigir Exame'}
                    </button>
                    
                    {(resultado || enunciado || textoPeca) && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-3.5 py-2.5 rounded-md border border-gray-200 dark:border-juri-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-juri-950 hover:text-red-500 dark:hover:text-red-400 transition-all h-10"
                        title="Zerar Simulado"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Premium Correction and Grading Simulator */}
        <div className="rounded-md border border-gray-200 dark:border-juri-800/80 bg-white dark:bg-juri-900 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 dark:border-juri-800/60 bg-gray-50/50 dark:bg-juri-950/20">
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <span className="font-bold text-gray-950 dark:text-gray-100 text-xs uppercase tracking-wider">Espelho & Resultado OAB</span>
          </div>

          <div className="p-5 flex-1 min-h-[460px]">
            {loading && (
              <div className="flex flex-col items-center justify-center h-80 gap-6 text-center animate-in fade-in duration-300">
                <div className="relative flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                  <Sparkles className="w-5 h-5 text-accent absolute animate-pulse" />
                </div>
                <div className="space-y-3 max-w-sm">
                  <p className="text-xs font-bold text-accent uppercase tracking-wider animate-pulse">
                    {LOADING_STEPS[loadingStep]}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                    Nossa inteligência jurídica está simulando os parâmetros da banca FGV. Isto pode levar até 20 segundos.
                  </p>
                </div>
                {/* Dynamic mini checklists showing fake analysis progress */}
                <div className="w-full max-w-xs bg-gray-50 dark:bg-juri-950 border border-gray-150 dark:border-juri-800 p-4 rounded-md text-left space-y-2">
                  {LOADING_STEPS.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px]">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                        idx < loadingStep 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                          : idx === loadingStep 
                            ? 'border-accent text-accent animate-spin' 
                            : 'border-gray-200 dark:border-juri-850 text-gray-600'
                      }`}>
                        {idx < loadingStep ? '✓' : idx === loadingStep ? '◌' : '○'}
                      </div>
                      <span className={`${idx <= loadingStep ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}`}>{step.slice(0, 32)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && !resultado && !error && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Simulated Espelho de Correção OAB (FGV) */}
                <div className="bg-gray-50/50 dark:bg-juri-950/40 p-4 rounded-md border border-gray-250/20 dark:border-juri-800/80">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-accent" />
                    Parâmetros Oficiais de Avaliação (FGV)
                  </h4>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                    Sua redação será julgada de acordo com os critérios padrão utilizados na segunda fase do Exame da Ordem.
                  </p>
                </div>

                <div className="overflow-x-auto border border-gray-200 dark:border-juri-800/80 rounded-md">
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

                <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-md border border-accent/15">
                  <HelpCircle className="w-4 h-4 text-accent flex-shrink-0" />
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 leading-relaxed">
                    <strong>Como funciona?</strong> Digite sua petição na aba **"Redação da Peça"** e clique em enviar. A IA avaliará ponto a ponto e gerará o seu espelho preenchido com pontuação final e comentários corretivos.
                  </p>
                </div>
              </div>
            )}

            {!loading && resultado && (
              <div className="space-y-4 animate-in fade-in duration-500">
                {/* Premium Correction Container Paper Sheet */}
                <div className="bg-[#FCFCFC] dark:bg-juri-950/90 border border-gray-250 dark:border-juri-800 p-5 sm:p-6 rounded-md shadow-sm relative text-gray-800 dark:text-gray-100 font-sans leading-relaxed text-xs">
                  <div className="absolute top-0 left-0 w-1 bg-accent h-full rounded-l-md" />
                  
                  {/* Exam Stamp Header */}
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-juri-800/80 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-4.5 h-4.5 text-accent" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">RESULTADO DE CORREÇÃO OFICIAL</span>
                    </div>
                    <span className="text-[9px] font-mono bg-gray-100 dark:bg-juri-900 text-gray-400 px-2 py-0.5 rounded border border-gray-200 dark:border-juri-800">
                      CÓD-SIMULAÇÃO: {Math.floor(100000 + Math.random() * 900000)}
                    </span>
                  </div>

                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-300 font-sans"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(resultado) }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

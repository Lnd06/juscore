import React, { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, Send, RotateCcw, Loader2, Star, 
  BookMarked, Lightbulb, FileText, Quote, ListChecks, ArrowRight, BookOpen, Sparkles, ChevronUp
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

const SECOES = [
  { id: 'Definição do Tema', fase: 'Fase 1', desc: 'Recorte temático e problema' },
  { id: 'Introdução', fase: 'Fase 1', desc: 'Objetivos, hipóteses e justificativa' },
  { id: 'Referencial Teórico', fase: 'Fase 2', desc: 'Doutrina, legislação e jurisprudência' },
  { id: 'Metodologia', fase: 'Fase 2', desc: 'Método, técnicas e fontes' },
  { id: 'Desenvolvimento / Análise', fase: 'Fase 3', desc: 'Capítulos de mérito e discussões' },
  { id: 'Conclusão', fase: 'Fase 3', desc: 'Fechamento do problema de pesquisa' },
  { id: 'Referências Bibliográficas (ABNT)', fase: 'Fase 4', desc: 'Obras citadas nos padrões ABNT' },
  { id: 'Resumo / Abstract', fase: 'Fase 4', desc: 'Resumo formal em português e inglês' },
];

const STRUCTURAL_ADVICE = {
  'Definição do Tema': 'O tema deve possuir relevância científica e prática na área jurídica, um recorte temporal/espacial preciso e um problema de pesquisa formulado como pergunta clara.',
  'Introdução': 'Apresente o panorama geral do estudo, a pergunta problematizadora, a hipótese de trabalho, a divisão estrutural de capítulos e a relevância social/científica.',
  'Referencial Teórico': 'Reúna doutrinas consagradas, teses acadêmicas, textos de lei e julgados de tribunais superiores que sustentam a sua argumentação principal.',
  'Metodologia': 'Explique o método utilizado (geralmente hipotético-dedutivo no Direito), a técnica de revisão bibliográfica ou documental, e a abordagem qualitativa.',
  'Desenvolvimento / Análise': 'Divida em 2 ou 3 capítulos lógicos. Use citações diretas e indiretas de forma equilibrada para sustentar seus argumentos críticos e evite plágios.',
  'Conclusão': 'Retome de forma sucinta a introdução, responda objetivamente ao problema formulado e confirme ou refute as hipóteses iniciais, sugerindo novos estudos.',
  'Referências Bibliográficas (ABNT)': 'Deverão seguir a ordem alfabética de sobrenomes dos autores. Revise regras de destaque (itálico/negrito no título do livro) e formatação de leis.',
  'Resumo / Abstract': 'Elabore um texto corrido (150 a 500 palavras) expondo objetivos, método, desenvolvimento e principais conclusões obtidas na pesquisa.'
};

const QUICK_ACTIONS = [
  { icon: Lightbulb, label: 'Sugerir Títulos', prompt: 'Sugira 5 possíveis títulos para o meu TCC neste tema, com variações de recorte e abordagem jurídica.' },
  { icon: Quote, label: 'Citar em ABNT', prompt: 'Mostre como citar corretamente uma obra importante desta área jurídica no formato ABNT.' },
  { icon: ListChecks, label: 'Estrutura Ideal', prompt: 'Qual é a estrutura ideal de um TCC jurídico para esta área? Descreva seção por seção.' },
  { icon: FileText, label: 'Redigir Intro', prompt: 'Ajude-me a escrever um parágrafo introdutório para o meu TCC, justificando e contextualizando a relevância jurídica do tema.' },
  { icon: BookMarked, label: 'Fontes Relevantes', prompt: 'Liste os principais doutrinadores, obras clássicas e legislações fundamentais para fundamentar este tema.' },
];

function renderMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-xs font-bold text-action-light mt-4 mb-2 uppercase tracking-wider">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold text-gray-200 mt-4 mb-2 border-b border-juri-800 pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-base font-bold text-white mt-3 mb-2 uppercase tracking-widest border-b border-action-light/20 pb-1.5">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-300 text-xs py-0.5">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

function TypewriterMessage({ content, speed = 8, onComplete, onTick }) {
  const [displayedText, setDisplayedText] = useState('');
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!content) return;
    
    let index = 0;
    const step = 4;
    
    const interval = setInterval(() => {
      index += step;
      if (index >= content.length) {
        setDisplayedText(content);
        clearInterval(interval);
        if (onCompleteRef.current) onCompleteRef.current();
      } else {
        setDisplayedText(content.slice(0, index));
        if (onTickRef.current) onTickRef.current();
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [content, speed]);

  return <div dangerouslySetInnerHTML={{ __html: renderMarkdown(displayedText) }} />;
}

export default function TccAssistant() {
  const { token } = useAuth();
  const [tema, setTema] = useState('');
  const [secao, setSecao] = useState('');
  const [historico, setHistorico] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStructure, setShowStructure] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historico]);

  const handleTypewriterComplete = (index) => {
    setHistorico(prev => prev.map((msg, i) => i === index ? { ...msg, animate: false } : msg));
  };

  const handleSend = async (mensagem) => {
    const text = (mensagem || input).trim();
    if (!text) return;

    const newUser = { role: 'user', content: text };
    setHistorico(prev => [...prev, newUser]);
    setInput('');
    setLoading(true);
    setError('');
    setShowStructure(false);

    try {
      const res = await axios.post('/api/chat/tcc-assistant', {
        tema, secao, duvida: text,
        historico: historico,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setHistorico(prev => [...prev, { role: 'assistant', content: res.data.resposta, animate: true }]);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('🔒 Este recurso é exclusivo do plano Estudante Pro.');
      } else {
        setError('Erro ao processar sua dúvida. Tente novamente.');
      }
      setHistorico(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setHistorico([]);
    setError('');
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 w-full animate-in fade-in duration-500 flex flex-col h-full">
      {/* ─── Main Layout ─── */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-5 flex-1 min-h-0">

        {/* ─── Left Panel: Config + Structure (desktop always, mobile toggleable) ─── */}
        <div className={cn(
          "lg:col-span-5 flex flex-col gap-4 sm:gap-5 h-full overflow-y-auto lg:overflow-hidden custom-scrollbar pb-16 lg:pb-0 shrink-0",
          "lg:flex",
          showStructure ? "flex" : "hidden"
        )}>
          {/* Theme & Section selector */}
          <div className="bg-white dark:bg-juri-900 rounded-xl border border-gray-200 dark:border-juri-800/80 p-4 sm:p-5 shadow-sm space-y-3">
            <h3 className="text-[11px] font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-action-light" />
              Configuração Acadêmica
            </h3>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Tema do TCC</label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ex: Responsabilidade Civil da IA..."
                className="w-full bg-white dark:bg-juri-950 border border-gray-200 dark:border-juri-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-action-light/25 focus:border-action-light/50 transition-all h-10"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Seção de Escrita Atual</label>
              <SearchableDropdown
                value={secao}
                onChange={setSecao}
                options={SECOES.map(s => ({ id: s.id, label: s.id, desc: `${s.desc} (${s.fase})` }))}
                placeholder="Seção (opcional)"
                searchPlaceholder="Buscar seção..."
                variant="action"
              />
            </div>
          </div>

          {/* Roadmap */}
          <div className="bg-white dark:bg-juri-900 rounded-xl border border-gray-200 dark:border-juri-800/80 p-4 sm:p-5 shadow-sm flex-1 flex flex-col">
            <h3 className="text-[11px] font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-gray-200 dark:border-juri-800/60 pb-2">
              <ListChecks className="w-3.5 h-3.5 text-action-light" />
              Estrutura ABNT
            </h3>
            <div className="space-y-1.5 overflow-y-visible lg:overflow-y-auto lg:custom-scrollbar lg:flex-1 lg:min-h-0">
              {SECOES.map((s) => {
                const isActive = secao === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSecao(s.id);
                      setShowStructure(false);
                    }}
                    className={cn(
                      "w-full text-left flex items-center justify-between p-2.5 rounded-lg transition-all text-xs",
                      isActive
                        ? "bg-action-light/10 border border-action-light/20 text-action-light"
                        : "border border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-juri-950/40 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0",
                        isActive ? "bg-action-light" : "bg-gray-300 dark:bg-juri-700"
                      )} />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium">{s.id}</span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate">{s.desc}</span>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono uppercase bg-gray-100 dark:bg-juri-950 text-gray-450 px-1.5 py-0.5 rounded border border-gray-200 dark:border-juri-800/80 shrink-0 ml-2">
                      {s.fase}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Advice box */}
            {secao && (
              <div className="mt-3 p-3 rounded-lg bg-action-light/5 border border-action-light/15">
                <div className="flex items-center gap-1.5 text-action-light mb-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Diretriz</span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  {STRUCTURAL_ADVICE[secao]}
                </p>
              </div>
            )}

            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => setShowStructure(false)}
              className="lg:hidden mt-3 w-full py-2.5 rounded-lg bg-action-light text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Voltar ao Orientador
            </button>
          </div>
        </div>

        {/* ─── Right Panel: Chat ─── */}
        <div className={cn(
          "lg:col-span-7 bg-white dark:bg-juri-900 rounded-xl border border-gray-200 dark:border-juri-800/80 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0",
          "lg:flex",
          showStructure ? "hidden" : "flex"
        )}>
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-juri-800/60 bg-gray-50/50 dark:bg-juri-950/20 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <CubeIcon className="w-4 h-4 text-action-light shrink-0" />
              <span className="font-bold text-gray-950 dark:text-gray-100 text-xs sm:text-sm uppercase tracking-wider truncate">
                Orientador de TCC
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-action-light/10 text-action-light border border-action-light/20 uppercase tracking-wider shrink-0">
                <Star className="w-2.5 h-2.5" /> Pro
              </span>
              {secao && (
                <span className="hidden sm:inline text-[9px] bg-action-light/10 text-action-light px-2 py-0.5 rounded font-semibold truncate max-w-[200px]">
                  {secao}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Mobile: toggle structure panel */}
              <button
                type="button"
                onClick={() => setShowStructure(true)}
                className="lg:hidden flex items-center gap-1.5 text-xs font-bold text-white bg-action-light hover:bg-action-dark transition-all duration-200 uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg shadow-action-light/25 active:scale-95 border border-transparent"
              >
                <ListChecks className="w-3.5 h-3.5 shrink-0" /> Estrutura
              </button>
              {historico.length > 0 && (
                <button 
                  onClick={handleReset} 
                  className="flex items-center gap-1 text-[9px] font-bold text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors uppercase tracking-wider"
                >
                  <RotateCcw className="w-3 h-3" /> <span className="hidden sm:inline">Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar bg-gray-50/20 dark:bg-juri-950/10 min-h-0">
            {historico.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-6">
                <CubeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-action-light" />
                <div className="space-y-1">
                  <p className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-gray-200">
                    Inicie a Orientação do seu TCC
                  </p>
                  <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed mx-auto">
                    Configure o tema e seção, depois envie dúvidas ou use os atalhos abaixo.
                  </p>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md px-2">
                  {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => handleSend(prompt)}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-juri-800 bg-white dark:bg-juri-950 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:border-action-light/30 transition-all text-[11px] font-medium text-left group"
                    >
                      <Icon className="w-4 h-4 text-action-light shrink-0 group-hover:scale-105 transition-transform" />
                      <span className="truncate flex-1">{label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-action-light shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {historico.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      "max-w-[90%] sm:max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm",
                      msg.role === 'user'
                        ? 'bg-action-light/10 text-slate-100 border border-action-light/20 rounded-br-sm'
                        : 'bg-white dark:bg-juri-950 border border-gray-200 dark:border-juri-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                    )}>
                      {msg.role === 'assistant' ? (
                        msg.animate ? (
                          <TypewriterMessage
                            content={msg.content}
                            onTick={() => bottomRef.current?.scrollIntoView({ behavior: 'auto' })}
                            onComplete={() => handleTypewriterComplete(i)}
                          />
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                        )
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-juri-950 border border-gray-200 dark:border-juri-800 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                       <div className="animate-spin w-4 h-4 flex items-center justify-center text-action-light shrink-0">
                         <svg viewBox="0 0 108 125" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                           <path 
                             d="M2.51465 32.7531L53.5146 64.2531M105.015 32.7531L105.515 90.2531L53.5146 122.253L1.51465 90.7531L2.51465 32.7531L54.0146 1.75305L105.015 32.7531ZM53.5146 64.2531V122.253M53.5146 64.2531L105.015 32.7531" 
                             stroke="currentColor" 
                             strokeWidth="6"
                             strokeLinecap="round"
                             strokeLinejoin="round"
                           />
                         </svg>
                       </div>
                       <div className="flex gap-1 items-center">
                         <span className="w-1.5 h-1.5 rounded-full bg-action-light opacity-60 animate-bounce" style={{ animationDelay: '0ms' }} />
                         <span className="w-1.5 h-1.5 rounded-full bg-action-light opacity-60 animate-bounce" style={{ animationDelay: '150ms' }} />
                         <span className="w-1.5 h-1.5 rounded-full bg-action-light opacity-60 animate-bounce" style={{ animationDelay: '300ms' }} />
                       </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="text-center text-[10px] font-semibold text-red-500 py-2 px-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">{error}</div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-juri-800 bg-white dark:bg-juri-900 shrink-0 space-y-2">
            {historico.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {QUICK_ACTIONS.slice(0, 3).map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => handleSend(prompt)}
                    disabled={loading}
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-juri-950 hover:bg-gray-100 dark:hover:bg-juri-800 text-[9px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-juri-800 transition-all disabled:opacity-40"
                  >
                    <Icon className="w-3 h-3 text-action-light" /> {label}
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                rows={1}
                placeholder="Pergunte ao orientador virtual..."
                disabled={loading}
                className="flex-1 rounded-xl border border-gray-200 dark:border-juri-800 bg-white dark:bg-juri-950 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-action-light/25 focus:border-action-light/50 resize-none disabled:opacity-50 h-10 leading-normal"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="shrink-0 w-10 h-10 rounded-xl bg-action-light hover:bg-action-dark flex items-center justify-center text-white transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

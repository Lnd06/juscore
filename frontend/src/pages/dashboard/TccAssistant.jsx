import React, { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, Send, RotateCcw, ChevronDown, Loader2, Star, 
  BookMarked, Lightbulb, FileText, Quote, ListChecks, ArrowRight, BookOpen, Sparkles
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

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
    .replace(/^### (.+)$/gm, '<h3 class="text-xs font-bold text-accent mt-4 mb-2 uppercase tracking-wider">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold text-gray-200 mt-4 mb-2 border-b border-juri-800 pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-base font-bold text-white mt-3 mb-2 uppercase tracking-widest border-b border-accent/20 pb-1.5">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-300 text-xs py-0.5">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function TccAssistant() {
  const { token } = useAuth();
  const [tema, setTema] = useState('');
  const [secao, setSecao] = useState('');
  const [historico, setHistorico] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historico]);

  const handleSend = async (mensagem) => {
    const text = (mensagem || input).trim();
    if (!text) return;

    const newUser = { role: 'user', content: text };
    const newHistorico = [...historico, newUser];
    setHistorico(newHistorico);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/chat/tcc-assistant', {
        tema, secao, duvida: text,
        historico: historico,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setHistorico(prev => [...prev, { role: 'assistant', content: res.data.resposta }]);
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
    <div className="p-4 sm:p-5 lg:p-6 w-full space-y-6 animate-in fade-in duration-500 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-juri-900 p-5 rounded-md border border-gray-200 dark:border-juri-800/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-action-light/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        
        <div className="flex items-start gap-3.5 relative z-10">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-gray-950 dark:text-gray-100 flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-action-light" />
              Orientador Virtual de TCC
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Obtenha assessoria especializada em metodologia ABNT, referências e estruturação de capítulos para seu trabalho de conclusão.
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-action-light/10 text-action-light border border-action-light/20 mt-2.5 uppercase tracking-wider">
              <Star className="w-3 h-3" /> Estudante Pro
            </span>
          </div>
        </div>
      </div>

      {/* Split screen: Left controls and progress, Right chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Academic Progress Panel (4 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Theme & Selector card */}
          <div className="rounded-md border border-gray-200 dark:border-juri-800/80 bg-white dark:bg-juri-900 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-action-light" />
              Configuração Acadêmica
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Tema do TCC</label>
                <input
                  type="text"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Ex: Responsabilidade Civil da Inteligência Artificial..."
                  className="w-full bg-white dark:bg-juri-950 border border-gray-200 dark:border-juri-800 rounded-md px-3 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-action-light/25 focus:border-action-light/50 transition-all h-9"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">Seção de Escrita Atual</label>
                <div className="relative">
                  <select
                    value={secao}
                    onChange={(e) => setSecao(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-juri-950 border border-gray-200 dark:border-juri-800 rounded-md px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-action-light/25 focus:border-action-light/50 pr-8 h-9"
                  >
                    <option value="">Seção (opcional)</option>
                    {SECOES.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Interactive Progress Roadmap */}
          <div className="rounded-md border border-gray-200 dark:border-juri-800/80 bg-white dark:bg-juri-900 p-5 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-gray-200 dark:border-juri-800/60 pb-2">
                <ListChecks className="w-3.5 h-3.5 text-action-light" />
                Estrutura de Desenvolvimento (ABNT)
              </h3>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {SECOES.map((s) => {
                  const isActive = secao === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSecao(s.id)}
                      className="w-full text-left flex items-center justify-between p-2.5 rounded transition-all text-xs border border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-juri-950/40 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] font-bold ${
                          isActive 
                            ? 'bg-action-light/10 border-action-light text-action-light animate-pulse' 
                            : 'border-gray-200 dark:border-juri-800 text-gray-500'
                        }`}>
                          {isActive ? '●' : '○'}
                        </div>
                        <div className="flex flex-col">
                          <span className="leading-tight">{s.id}</span>
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-none mt-0.5">{s.desc}</span>
                        </div>
                      </div>
                      <span className="text-[8px] font-mono uppercase bg-gray-100 dark:bg-juri-950 text-gray-450 px-1.5 py-0.5 rounded border border-gray-200 dark:border-juri-800/80">
                        {s.fase}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Advice Box */}
            <div className="mt-5 p-4 rounded bg-gray-50 dark:bg-juri-950/60 border border-gray-250/20 dark:border-juri-800/80">
              <div className="flex items-center gap-2 text-action-light mb-1.5">
                <Lightbulb className="w-4 h-4" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Diretriz da Seção</span>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-400 leading-relaxed">
                {secao ? STRUCTURAL_ADVICE[secao] : 'Selecione uma seção da lista acadêmica acima ou no seletor para visualizar as regras ideais de fundamentação científica definidas pela IA.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: AI Advisory Chat (7 cols) */}
        <div className="lg:col-span-7 rounded-md border border-gray-200 dark:border-juri-800/80 bg-white dark:bg-juri-900 shadow-sm overflow-hidden flex flex-col h-[460px] sm:h-[500px] lg:h-[550px] justify-between">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-juri-800/60 bg-gray-50/50 dark:bg-juri-950/20 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-action-light" />
              <span className="font-bold text-gray-950 dark:text-gray-100 text-xs uppercase tracking-wider">
                Orientador Inteligente
              </span>
            </div>
            {historico.length > 0 && (
              <button 
                onClick={handleReset} 
                className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors uppercase tracking-wider"
              >
                <RotateCcw className="w-3 h-3" /> Limpar conversa
              </button>
            )}
          </div>

          {/* Message view thread */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gray-50/20 dark:bg-juri-950/10">
            {historico.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-6">
                <GraduationCap className="w-10 h-10 text-action-light mb-1" />
                <div className="space-y-1.5">
                  <p className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-gray-250">
                    Inicie a Orientação do seu TCC
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed mx-auto">
                    Insira o seu tema à esquerda, selecione o capítulo em escrita e envie suas dúvidas acadêmicas, ou use um dos atalhos metodológicos abaixo:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg px-2">
                  {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => handleSend(prompt)}
                      className="flex items-center gap-2.5 p-2.5 rounded-md border border-gray-255/20 dark:border-juri-800 bg-white dark:bg-juri-950 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:border-action-light/35 transition-all text-[11px] font-medium shadow-sm text-left group"
                    >
                      <Icon className="w-4 h-4 text-action-light flex-shrink-0 group-hover:scale-105 transition-transform" />
                      <span className="truncate">{label}</span>
                      <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-action-light shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {historico.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] rounded-md px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-action-light/10 text-slate-100 border border-action-light/20'
                        : 'bg-white dark:bg-juri-950 border border-gray-250/20 dark:border-juri-800 text-gray-800 dark:text-gray-200'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-juri-950 border border-gray-250/20 dark:border-juri-800 rounded-md px-3.5 py-2.5 h-[36px] min-w-[50px] flex items-center justify-center gap-1 shadow-sm">
                       <span className="w-1.5 h-1.5 rounded-full bg-action-light opacity-60 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                       <span className="w-1.5 h-1.5 rounded-full bg-action-light opacity-60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                       <span className="w-1.5 h-1.5 rounded-full bg-action-light opacity-60 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="text-center text-[10px] font-semibold text-red-500 py-1 bg-red-50 dark:bg-red-950/20 rounded border border-red-250/20 dark:border-red-900/30">{error}</div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Footer Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-juri-800 bg-white dark:bg-juri-900 flex-shrink-0 space-y-2">
            {historico.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar min-w-0 max-w-full">
                {QUICK_ACTIONS.slice(0, 3).map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => handleSend(prompt)}
                    disabled={loading}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-50 dark:bg-juri-950 hover:bg-gray-100 dark:hover:bg-juri-800 text-[9px] font-bold uppercase tracking-wider text-gray-450 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-juri-800 transition-all disabled:opacity-40"
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
                placeholder="Pergunte ao orientador virtual (ex: Metodologia ABNT)..."
                disabled={loading}
                className="flex-1 rounded-md border border-gray-200 dark:border-juri-800 bg-white dark:bg-juri-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-action-light/25 focus:border-action-light/50 resize-none disabled:opacity-50 h-9 leading-normal"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-9 h-9 rounded-md bg-action-light hover:bg-action-dark flex items-center justify-center text-white transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

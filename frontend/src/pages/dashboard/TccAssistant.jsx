import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, Send, RotateCcw, ChevronDown, Loader2, Star, BookMarked, Lightbulb, FileText, Quote, ListChecks } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SECOES = [
  'Definição do Tema',
  'Introdução',
  'Referencial Teórico',
  'Metodologia',
  'Desenvolvimento / Análise',
  'Conclusão',
  'Referências Bibliográficas (ABNT)',
  'Resumo / Abstract',
];

const QUICK_ACTIONS = [
  { icon: Lightbulb, label: 'Sugerir Títulos', prompt: 'Sugira 5 possíveis títulos para o meu TCC neste tema, com variações de recorte e abordagem.' },
  { icon: Quote, label: 'Citar em ABNT', prompt: 'Mostre como citar corretamente uma obra importante desta área jurídica no formato ABNT.' },
  { icon: ListChecks, label: 'Estrutura Ideal', prompt: 'Qual é a estrutura ideal de um TCC jurídico para esta área? Descreva seção por seção.' },
  { icon: FileText, label: 'Redigir Intro', prompt: 'Ajude-me a escrever um parágrafo introdutório para o meu TCC, contextualizando o tema e justificando a pesquisa.' },
  { icon: BookMarked, label: 'Fontes Relevantes', prompt: 'Liste os principais autores, obras e legislações que devo usar como referência para este tema.' },
];

function renderMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-accent mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-white mt-4 mb-2 border-b border-gray-700 pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-white mt-3 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc text-gray-300 text-sm">$1</li>')
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
        historico: historico, // send previous history for context
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
    <div className="flex flex-col h-full p-0 max-w-full mx-auto">
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 flex-shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assistente TCC</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Orientação especializada para seu trabalho de conclusão de curso em Direito.</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mt-2">
            <Star className="w-3 h-3" /> Estudante Pro
          </span>
        </div>
      </div>

      {/* Context Bar */}
      <div className="flex flex-wrap gap-3 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tema do TCC</label>
          <input
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ex: Responsabilidade Civil na IA..."
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-52">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Seção Atual</label>
          <div className="relative">
            <select
              value={secao}
              onChange={(e) => setSecao(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
            >
              <option value="">Seção (opcional)</option>
              {SECOES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {historico.length > 0 && (
          <button onClick={handleReset} className="self-end flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
            <RotateCcw className="w-3.5 h-3.5" /> Limpar conversa
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mb-3 min-h-0">
        {historico.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Olá! Sou seu orientador virtual de TCC.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Defina o tema e a seção acima, depois me faça qualquer dúvida — ou use uma das ações rápidas.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => handleSend(prompt)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {historico.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
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
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 h-[54px] min-w-[70px] flex items-center gap-1.5 shadow-sm">
                   <span className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-60 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                   <span className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                   <span className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-60 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            {error && (
              <div className="text-center text-sm text-red-500 py-2">{error}</div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0">
        {historico.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {QUICK_ACTIONS.slice(0, 3).map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
              >
                <Icon className="w-3 h-3" /> {label}
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
            rows={2}
            placeholder="Faça sua dúvida sobre o TCC... (Enter para enviar)"
            disabled={loading}
            className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  </div>
);
}

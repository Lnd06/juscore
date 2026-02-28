import React, { useState } from 'react';
import { Scale, BookOpen, CheckCircle, AlertTriangle, ChevronDown, Loader2, RotateCcw, Star } from 'lucide-react';
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

export default function OabSimulator() {
  const { token } = useAuth();
  const [tipoPeca, setTipoPeca] = useState('');
  const [areaDireito, setAreaDireito] = useState('');
  const [enunciado, setEnunciado] = useState('');
  const [textoPeca, setTextoPeca] = useState('');
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tipoPeca || !enunciado.trim() || !textoPeca.trim()) {
      setError('Preencha o tipo de peça, o enunciado e o texto da sua peça.');
      return;
    }
    setError('');
    setResultado('');
    setLoading(true);
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
  };

  // Simple markdown renderer for the result
  const renderMarkdown = (text) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-accent mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-white mt-5 mb-2 border-b border-gray-700 pb-1">$2</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-white mt-4 mb-3">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Scale className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Simulador de Peças OAB</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Escreva sua peça, envie e receba avaliação detalhada com nota e feedback da IA — como na prova real.
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 mt-2">
            <Star className="w-3 h-3" /> Estudante Pro
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Peça */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de Peça *</label>
                <div className="relative">
                  <select
                    value={tipoPeca}
                    onChange={(e) => setTipoPeca(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Selecione o tipo...</option>
                    {TIPOS_PECA.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Área do Direito */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Área do Direito</label>
                <div className="relative">
                  <select
                    value={areaDireito}
                    onChange={(e) => setAreaDireito(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Selecione a área...</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Enunciado */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Enunciado / Caso Prático *</label>
                <textarea
                  value={enunciado}
                  onChange={(e) => setEnunciado(e.target.value)}
                  rows={5}
                  placeholder="Cole aqui o enunciado ou caso prático da questão..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              {/* Texto da Peça */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Sua Peça *</label>
                <textarea
                  value={textoPeca}
                  onChange={(e) => setTextoPeca(e.target.value)}
                  rows={10}
                  placeholder="Escreva aqui a sua peça jurídica..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent resize-none font-mono"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                  {loading ? 'Avaliando...' : 'Corrigir Peça'}
                </button>
                {(resultado || enunciado || textoPeca) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    title="Recomeçar"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right: Result */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <BookOpen className="w-4 h-4 text-accent" />
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Avaliação da IA</span>
          </div>
          <div className="p-5 min-h-[400px]">
            {loading && (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Avaliando sua peça...</p>
              </div>
            )}
            {!loading && !resultado && !error && (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Scale className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                  Preencha o formulário ao lado e clique em <strong>Corrigir Peça</strong> para receber avaliação completa.
                </p>
              </div>
            )}
            {!loading && resultado && (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(resultado) }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

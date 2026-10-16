export const CATEGORIAS = [
  { id: 'TODAS',     label: 'Todas',      color: 'gray' },
  { id: 'GERAL',     label: 'Geral',      color: 'blue',   desc: 'Contexto geral da IA (chat)' },
  { id: 'OAB',       label: 'OAB',        color: 'amber',  desc: 'Simulador de Peças OAB' },
  { id: 'TCC',       label: 'TCC',        color: 'green',  desc: 'Assistente TCC' },
  { id: 'DOCUMENTOS',label: 'Documentos', color: 'purple', desc: 'Geração de Documentos (em breve)' },
  { id: 'MODELO_DOCUMENTO', label: 'Modelos de Peças', color: 'pink', desc: 'Modelos para a IA se inspirar' },
];

export const BADGE_COLORS = {
  GERAL:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OAB:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  TCC:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  DOCUMENTOS: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  MODELO_DOCUMENTO: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

export const ITEMS_PER_PAGE = 9;

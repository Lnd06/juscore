import React from 'react';
import { Card, Button, Input } from '../../../components/ui';
import { Lock, Briefcase } from 'lucide-react';

export const fmt = (v) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const ResultRow = ({ label, value, highlight = false, accent = false }) => (
  <div className={`flex justify-between items-center py-2 ${highlight ? 'border-t border-gray-100 dark:border-gray-800 mt-2 pt-4' : ''}`}>
    <span className={`text-sm ${highlight ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
      {label}
    </span>
    <span className={`font-mono ${highlight ? 'text-lg font-bold' : 'text-sm'} ${accent ? 'text-accent' : 'text-gray-900 dark:text-white'}`}>
      {value}
    </span>
  </div>
);

export const ResultCard = ({ children, mode, UpgradeBanner, onDraft, draftTitle, draftData }) => (
  <Card className="p-6 bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/50 h-full flex flex-col">
    <div className="flex-1">
      {children}
    </div>
    
    {mode === 'public' ? (
      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
        <UpgradeBanner />
      </div>
    ) : onDraft && (
      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
        <Button 
          onClick={() => onDraft(draftTitle, draftData)}
          className="w-full bg-accent/10 hover:bg-accent/20 text-accent border-accent/20 flex items-center justify-center gap-2"
        >
          <Briefcase className="w-4 h-4" /> Minutar Petição com este Cálculo
        </Button>
      </div>
    )}
  </Card>
);

export const CalcButton = ({ onClick, disabled, loading, children }) => (
  <Button 
    onClick={onClick} 
    disabled={disabled || loading}
    className="w-full bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/20 h-11"
  >
    {loading ? 'Calculando...' : children}
  </Button>
);

export const FormLabel = ({ children }) => (
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
    {children}
  </label>
);

export const StyledSelect = ({ value, onChange, children }) => (
  <select 
    value={value} 
    onChange={onChange}
    className="w-full h-11 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 text-sm focus:ring-2 focus:ring-accent outline-none transition-all dark:text-white"
  >
    {children}
  </select>
);

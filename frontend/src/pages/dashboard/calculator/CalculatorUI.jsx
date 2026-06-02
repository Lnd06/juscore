/* eslint-disable no-unused-vars */
import React from 'react';
import { Card, Button, Input } from '../../../components/ui';
import { Lock, Briefcase } from 'lucide-react';

export const fmt = (v) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const ResultRow = ({ label, value, highlight = false, accent = false }) => (
  <div className={`flex justify-between items-center py-2.5 ${highlight ? 'border-t border-gray-150 dark:border-juri-800/60 mt-3 pt-4' : 'border-b border-gray-100/50 dark:border-juri-800/20'}`}>
    <span className={`text-xs ${highlight ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
      {label}
    </span>
    <span className={`font-mono ${highlight ? 'text-base font-bold' : 'text-xs'} ${accent ? 'text-accent font-semibold' : 'text-gray-900 dark:text-gray-100'}`}>
      {value}
    </span>
  </div>
);

export const ResultCard = ({ children, mode, UpgradeBanner, onDraft, draftTitle, draftData }) => (
  <Card className="p-6 bg-gray-50/50 dark:bg-juri-900 border border-gray-200 dark:border-juri-800/80 rounded-md h-full flex flex-col shadow-sm">
    <div className="flex-1">
      {children}
    </div>
    
    {mode === 'public' ? (
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-juri-800/60">
        <UpgradeBanner />
      </div>
    ) : onDraft && (
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-juri-800/60">
        <Button 
          onClick={() => onDraft(draftTitle, draftData)}
          className="w-full bg-accent/10 hover:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center gap-2 h-10 rounded-md font-semibold text-xs tracking-wide transition-all duration-200"
        >
          <Briefcase className="w-3.5 h-3.5" /> Minutar Petição com este Cálculo
        </Button>
      </div>
    )}
  </Card>
);

export const CalcButton = ({ onClick, disabled, loading, children }) => (
  <Button 
    onClick={onClick} 
    disabled={disabled || loading}
    className="w-full bg-accent hover:bg-accent-dark text-slate-950 font-bold h-10 rounded-md shadow-sm transition-all duration-200 text-xs tracking-wider uppercase"
  >
    {loading ? 'Calculando...' : children}
  </Button>
);

export const FormLabel = ({ children }) => (
  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 ml-0.5 uppercase tracking-wider">
    {children}
  </label>
);

export const StyledSelect = ({ value, onChange, children }) => (
  <select 
    value={value} 
    onChange={onChange}
    className="w-full h-10 bg-white dark:bg-juri-950 border border-gray-200 dark:border-juri-800/80 rounded-md px-3 text-xs focus:ring-1 focus:ring-accent/20 focus:border-accent/40 outline-none transition-all dark:text-gray-100"
  >
    {children}
  </select>
);

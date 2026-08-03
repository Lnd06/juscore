/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../../components/ui';
import { 
  Calculator as CalcIcon, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Scale, 
  Briefcase, 
  BarChart3, 
  Lock,
  Baby
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Modular Components
import InterestCalculator from './calculator/InterestCalculator';
import FeesCalculator from './calculator/FeesCalculator';
import DeadlineCalculator from './calculator/DeadlineCalculator';
import LaborCalculator from './calculator/LaborCalculator';
import CorrectionCalculator from './calculator/CorrectionCalculator';
import SimpleCalculator from './calculator/SimpleCalculator';
import AlimonyCalculator from './calculator/AlimonyCalculator';

const Calculator = ({ mode = 'private', defaultTab = 'interest' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [usageCount, setUsageCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('calculator_usage_data');
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) {
        setUsageCount(count);
      } else {
        // New day, reset count
        setUsageCount(0);
        localStorage.setItem('calculator_usage_data', JSON.stringify({ date: today, count: 0 }));
      }
    } else {
      localStorage.setItem('calculator_usage_data', JSON.stringify({ date: today, count: 0 }));
    }
  }, []);

  const checkUsageLimit = () => {
    if (mode === 'public') {
      const today = new Date().toISOString().split('T')[0];
      const newCount = usageCount + 1;
      
      if (newCount > 3) {
        return false;
      }

      setUsageCount(newCount);
      localStorage.setItem('calculator_usage_data', JSON.stringify({ date: today, count: newCount }));
    }
    return true;
  };

  const UpgradeBanner = () => (
    <div className="p-6 bg-gradient-to-br from-accent to-accent-dark rounded-3xl text-white shadow-xl shadow-accent/30 text-center">
      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
        <Lock className="w-6 h-6 text-white" />
      </div>
      <h4 className="font-bold text-lg mb-2">Limite Grátis Atingido</h4>
      <p className="text-sm text-white/80 mb-6 px-4">Faça upgrade para o Plano Pro e tenha cálculos ilimitados e salvamento em nuvem.</p>
      <Button 
        onClick={() => navigate('/register')}
        className="w-full bg-white text-accent hover:bg-gray-50 border-white font-bold h-12"
      >
        Começar Agora • Grátis
      </Button>
    </div>
  );

  const handleDraft = (title, data) => {
    if (!data) return;
    
    // Format JSON data into a clean, readable text block without trailing 9999 decimals
    let formattedSummary = '';
    for (const [key, value] of Object.entries(data)) {
      let formattedValue = value;
      if (typeof value === 'number') {
        formattedValue = `R$ ${value.toFixed(2)}`;
      }
      // Capitalize first letter and format key name slightly (e.g. ganhoCorrecao -> GanhoCorrecao)
      const cleanKey = key.charAt(0).toUpperCase() + key.slice(1);
      formattedSummary += `- ${cleanKey}: ${formattedValue}\n`;
    }

    const payload = `Quero gerar uma petição baseada no cálculo '${title}'. Seguem os dados levantados:\n${formattedSummary}\nPor favor, redija um esboço estruturado com esses valores.`;
    navigate(`/dashboard/chat?prompt=${encodeURIComponent(payload)}`);
  };

  const tabs = [
    { id: 'interest', name: 'Juros', icon: TrendingUp },
    { id: 'fees', name: 'Honorários', icon: DollarSign },
    { id: 'deadline', name: 'Prazos', icon: Calendar },
    { id: 'labor', name: 'Trabalhista', icon: Briefcase },
    { id: 'correction', name: 'Correção', icon: BarChart3 },
    { id: 'alimony', name: 'Pensão Alimentícia', icon: Baby },
    { id: 'simple', name: 'Financeira', icon: CalcIcon }
  ];

  const renderActiveCalculator = () => {
    const props = { 
      checkLimit: checkUsageLimit, 
      UpgradeBanner, 
      mode,
      onDraft: handleDraft 
    };

    switch(activeTab) {
      case 'interest': return <InterestCalculator {...props} />;
      case 'fees': return <FeesCalculator {...props} />;
      case 'deadline': return <DeadlineCalculator {...props} />;
      case 'labor': return <LaborCalculator {...props} />;
      case 'correction': return <CorrectionCalculator {...props} />;
      case 'alimony': return <AlimonyCalculator {...props} />;
      case 'simple': return <SimpleCalculator {...props} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      {mode === 'public' ? (
        <div className="bg-white dark:bg-juri-900 p-5 md:p-6 rounded-md border border-gray-200 dark:border-juri-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-accent/10 transition-colors" />
           
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <CalcIcon className="w-4 h-4 text-accent" />
                <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Utilitário Jurídico</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Calculadoras <span className="text-accent">Estratégicas</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md leading-relaxed">
                Cálculos precisos baseados na legislação.
              </p>
            </div>

            <div className="relative z-10 bg-gray-50 dark:bg-juri-950 p-2.5 rounded-md border border-gray-200 dark:border-juri-800/60 self-start sm:self-auto">
               <div className="text-[8px] text-gray-400 uppercase font-bold mb-1 tracking-wider">Cálculos Restantes</div>
               <div className="flex gap-1">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1.5 w-6 rounded-sm transition-all ${i <= (3 - usageCount) ? 'bg-accent shadow-sm shadow-accent/15' : 'bg-gray-200 dark:bg-juri-800/80 opacity-30'}`} />
                  ))}
               </div>
            </div>
         </div>
       ) : (
         <div className="bg-white dark:bg-juri-900 p-6 rounded-md border border-gray-200 dark:border-juri-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-accent/10 transition-colors" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <CalcIcon className="w-4.5 h-4.5 text-accent" />
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Utilitário Jurídico</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                Calculadoras <span className="text-accent">Estratégicas</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xl leading-relaxed">
                Cálculos precisos com base na legislação brasileira. Gere rascunhos de petições instantaneamente na inteligência artificial.
              </p>
            </div>
         </div>
       )}

      {/* Navigation */}
      {mode === 'public' ? (
        <div className="relative z-20">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-md font-semibold transition-all duration-200 bg-white dark:bg-juri-950 border border-gray-200 dark:border-juri-800/80 text-gray-700 dark:text-gray-300 hover:border-accent/40"
          >
            <div className="flex items-center gap-3.5">
              {(() => {
                const active = tabs.find(t => t.id === activeTab);
                const Icon = active?.icon || CalcIcon;
                return (
                  <>
                    <div className="w-6.5 h-6.5 bg-accent/10 rounded-md flex items-center justify-center text-accent">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{active?.name}</span>
                  </>
                );
              })()}
            </div>
            {/* Chevron icon */}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay to close the dropdown on click outside */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-juri-950 rounded-md border border-gray-200 dark:border-juri-800 shadow-xl z-20 overflow-hidden py-1 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors text-xs font-semibold ${
                        active 
                          ? 'bg-accent/10 text-accent' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-juri-900/50 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-accent' : 'text-gray-400 dark:text-gray-500'}`} />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="border-b border-gray-200 dark:border-juri-800/80 pb-px overflow-x-auto custom-scrollbar">
           <div className="flex gap-4 min-w-max">
             {tabs.map((tab) => {
               const Icon = tab.icon;
               const active = activeTab === tab.id;
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`flex items-center gap-2 py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 ${active 
                     ? 'border-accent text-accent scale-[1.01]' 
                     : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'}`}
                 >
                   <Icon className={`w-4 h-4 mr-1 ${active ? 'text-accent' : 'text-gray-400/80 dark:text-gray-500'}`} />
                   {tab.name}
                 </button>
               );
             })}
           </div>
        </div>
      )}

      {/* Calculator Body */}
      <div className="min-h-[500px]">
        {renderActiveCalculator()}
      </div>
    </div>
  );
};

export default Calculator;

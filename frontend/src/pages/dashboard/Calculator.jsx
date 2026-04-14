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

const Calculator = ({ mode = 'private' }) => {
  const [activeTab, setActiveTab] = useState('interest');
  const [usageCount, setUsageCount] = useState(0);
  const navigate = useNavigate();

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
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-accent/10 transition-colors" />
         
         <div className="relative z-10">
           <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <CalcIcon className="w-5 h-5 text-accent" />
             </div>
             <span className="text-xs font-bold text-accent uppercase tracking-widest">Utilitário Jurídico</span>
           </div>
           <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
             Calculadoras <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">Estratégicas</span>
           </h1>
           <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">
             Cálculos precisos com base na legislação brasileira. Gere rascunhos de petições instantaneamente.
           </p>
         </div>

         {mode === 'public' && (
           <div className="relative z-10 bg-gray-50 dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800">
              <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Cálculos Restantes</div>
              <div className="flex gap-1.5">
                 {[1,2,3].map(i => (
                   <div key={i} className={`h-2.5 w-10 rounded-full transition-all ${i <= (3 - usageCount) ? 'bg-accent shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-gray-200 dark:bg-gray-800 opacity-30'}`} />
                 ))}
              </div>
           </div>
         )}
      </div>

      {/* Navigation */}
      <div className="bg-white dark:bg-gray-950 p-2 rounded-[30px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto custom-scrollbar">
         <div className="flex gap-2 min-w-max">
           {tabs.map((tab) => {
             const Icon = tab.icon;
             const active = activeTab === tab.id;
             return (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 ${active 
                   ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-[1.02]' 
                   : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900'}`}
               >
                 <Icon className={`w-4.5 h-4.5 ${active ? 'text-white' : 'text-gray-400'}`} />
                 {tab.name}
               </button>
             );
           })}
         </div>
      </div>

      {/* Calculator Body */}
      <div className="min-h-[500px]">
        {renderActiveCalculator()}
      </div>
    </div>
  );
};

export default Calculator;

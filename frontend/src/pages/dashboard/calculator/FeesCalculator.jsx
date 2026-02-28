import React, { useState } from 'react';
import { ResultRow, ResultCard, CalcButton, FormLabel, fmt } from './CalculatorUI';
import { Input } from '../../../components/ui';

const FeesCalculator = ({ checkLimit, UpgradeBanner, mode, onDraft }) => {
  const [valorCausa, setValorCausa] = useState('');
  const [percentual, setPercentual] = useState('');
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    if (!checkLimit()) return;
    
    const v = parseFloat(valorCausa);
    const p = parseFloat(percentual) / 100;

    if (isNaN(v) || isNaN(p)) return;

    const honorarios = v * p;
    setResultado({ honorarios, total: v + honorarios, base: v, percent: percentual });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <FormLabel>Valor da Causa / Condenação (R$)</FormLabel>
          <Input 
            type="number" 
            placeholder="Ex: 50000" 
            value={valorCausa} 
            onChange={e => setValorCausa(e.target.value)}
          />
        </div>
        <div>
          <FormLabel>Percentual de Honorários (%)</FormLabel>
          <Input 
            type="number" 
            placeholder="Ex: 15" 
            value={percentual} 
            onChange={e => setPercentual(e.target.value)}
          />
        </div>
        <CalcButton onClick={calcular}>Calcular Honorários</CalcButton>
      </div>

      <ResultCard 
        mode={mode} 
        UpgradeBanner={UpgradeBanner} 
        onDraft={onDraft}
        draftTitle="Cálculo de Honorários"
        draftData={resultado}
      >
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Resultado dos Honorários</h3>
        {resultado ? (
          <div className="space-y-1">
            <ResultRow label="Base de Cálculo" value={fmt(resultado.base)} />
            <ResultRow label={`Percentual (${resultado.percent}%)`} value={fmt(resultado.honorarios)} accent />
            <ResultRow label="Total Geral" value={fmt(resultado.total)} highlight />
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
            Preencha os dados para ver o resultado
          </div>
        )}
      </ResultCard>
    </div>
  );
};

export default FeesCalculator;

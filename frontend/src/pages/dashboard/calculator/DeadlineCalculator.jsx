import React, { useState } from 'react';
import { ResultRow, ResultCard, CalcButton, FormLabel, StyledSelect } from './CalculatorUI';
import { Input } from '../../../components/ui';

const DeadlineCalculator = ({ checkLimit, UpgradeBanner, mode, onDraft }) => {
  const [dataInicio, setDataInicio] = useState('');
  const [dias, setDias] = useState('');
  const [tipoDias, setTipoDias] = useState('uteis');
  const [resultado, setResultado] = useState(null);

  const formatarData = (dataISO) => {
    if (!dataISO) return '';
    const [year, month, day] = dataISO.split('-');
    return `${day}/${month}/${year}`;
  };

  const calcular = () => {
    if (!checkLimit()) return;
    
    const start = new Date(dataInicio + 'T00:00:00');
    if (isNaN(start.getTime())) return;
    
    let count = parseInt(dias);
    if (isNaN(count)) return;

    let current = new Date(start);
    let added = 0;

    while (added < count) {
      current.setDate(current.getDate() + 1);
      if (tipoDias === 'uteis') {
        const day = current.getDay();
        if (day !== 0 && day !== 6) added++;
      } else {
        added++;
      }
    }

    setResultado({ 
      final: current.toISOString().split('T')[0],
      inicio: dataInicio,
      dias: count,
      tipo: tipoDias 
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <FormLabel>Data de Início / Intimação</FormLabel>
          <Input 
            type="date" 
            value={dataInicio} 
            onChange={e => setDataInicio(e.target.value)}
          />
        </div>
        <div>
          <FormLabel>Prazo (Quantidade de Dias)</FormLabel>
          <Input 
            type="number" 
            placeholder="Ex: 15" 
            value={dias} 
            onChange={e => setDias(e.target.value)}
          />
        </div>
        <div>
          <FormLabel>Contagem</FormLabel>
          <StyledSelect value={tipoDias} onChange={e => setTipoDias(e.target.value)}>
            <option value="uteis">Dias Úteis (CPC/2015)</option>
            <option value="corridos">Dias Corridos</option>
          </StyledSelect>
        </div>
        <CalcButton onClick={calcular}>Calcular Prazo</CalcButton>
      </div>

      <ResultCard 
        mode={mode} 
        UpgradeBanner={UpgradeBanner} 
        onDraft={onDraft}
        draftTitle="Cálculo de Prazo Processual"
        draftData={resultado}
      >
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Prazo Calculado</h3>
        {resultado ? (
          <div className="space-y-1">
            <ResultRow label="Data Inicial" value={formatarData(resultado.inicio)} />
            <ResultRow label="Prazo" value={`${resultado.dias} dias ${resultado.tipo}`} />
            <ResultRow label="Data de Vencimento" value={formatarData(resultado.final)} highlight accent />
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

export default DeadlineCalculator;

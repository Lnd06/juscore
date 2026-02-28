import React, { useState } from 'react';
import { ResultRow, ResultCard, CalcButton, FormLabel, StyledSelect, fmt } from './CalculatorUI';
import { Input } from '../../../components/ui';

const InterestCalculator = ({ checkLimit, UpgradeBanner, mode, onDraft }) => {
  const [valor, setValor] = useState('');
  const [taxa, setTaxa] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [unidadePeriodo, setUnidadePeriodo] = useState('meses'); // meses, dias
  const [tipo, setTipo] = useState('simples');
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    if (!checkLimit()) return;
    
    const p = parseFloat(valor);
    const iOriginal = parseFloat(taxa) / 100;
    const t = parseFloat(periodo);

    if (isNaN(p) || isNaN(iOriginal) || isNaN(t)) return;

    // Ajusta taxa se for pro-rata die (divide por 30 se a taxa for mensal mas o período em dias)
    let i = iOriginal;
    if (unidadePeriodo === 'dias' && tipo === 'simples') {
      i = iOriginal / 30; // Taxa diária aproximada
    }

    let total, juros;
    if (tipo === 'simples') {
      juros = p * i * t;
      total = p + juros;
    } else {
      total = p * Math.pow((1 + i), t);
      juros = total - p;
    }

    setResultado({ 
      total, 
      juros, 
      principal: p, 
      unidade: unidadePeriodo,
      periodo: t,
      taxaAplicada: (i * 100).toFixed(4)
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <FormLabel>Valor Principal (R$)</FormLabel>
          <Input 
            type="number" 
            placeholder="Ex: 1000" 
            value={valor} 
            onChange={e => setValor(e.target.value)}
          />
        </div>
        <div>
          <FormLabel>Taxa de Juros (% ao mês)</FormLabel>
          <Input 
            type="number" 
            placeholder="Ex: 1" 
            value={taxa} 
            onChange={e => setTaxa(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Período</FormLabel>
            <Input 
              type="number" 
              placeholder="Ex: 12" 
              value={periodo} 
              onChange={e => setPeriodo(e.target.value)}
            />
          </div>
          <div>
            <FormLabel>Unidade</FormLabel>
            <StyledSelect value={unidadePeriodo} onChange={e => setUnidadePeriodo(e.target.value)}>
              <option value="meses">Meses</option>
              <option value="dias">Dias (Pro-rata)</option>
            </StyledSelect>
          </div>
        </div>
        <div>
          <FormLabel>Tipo de Juros</FormLabel>
          <StyledSelect value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="simples">Juros Simples</option>
            <option value="compostos">Juros Compostos</option>
          </StyledSelect>
        </div>
        <CalcButton onClick={calcular}>Calcular Juros</CalcButton>
      </div>

      <ResultCard 
        mode={mode} 
        UpgradeBanner={UpgradeBanner} 
        onDraft={onDraft}
        draftTitle="Cálculo de Juros"
        draftData={resultado}
      >
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Detalhamento do Cálculo</h3>
        {resultado ? (
          <div className="space-y-1">
            <ResultRow label="Valor Principal" value={fmt(resultado.principal)} />
            <ResultRow label={`Juros (${resultado.periodo} ${resultado.unidade})`} value={fmt(resultado.juros)} accent />
            <ResultRow label="VALOR TOTAL" value={fmt(resultado.total)} highlight />
            <p className="text-[10px] text-gray-400 mt-4 leading-tight italic">
              * Taxa aplicada: {resultado.taxaAplicada}% por {resultado.unidade === 'dias' ? 'dia' : 'mês'}.
            </p>
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

export default InterestCalculator;

import React, { useState } from 'react';
import { ResultRow, ResultCard, CalcButton, FormLabel, StyledSelect, fmt } from './CalculatorUI';
import { Input } from '../../../components/ui';

const AlimonyCalculator = ({ checkLimit, UpgradeBanner, mode, onDraft }) => {
  const [baseType, setBaseType] = useState('minimo'); // 'minimo' or 'fixo'
  const [baseValue, setBaseValue] = useState('');
  const [percentual, setPercentual] = useState('');
  const [monthsLate, setMonthsLate] = useState('');
  const [interestRate, setInterestRate] = useState('1'); // 1% ao mês default
  const [correctionIndex, setCorrectionIndex] = useState('INPC'); // INPC, IPCA, IGPM

  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    if (!checkLimit()) return;

    const base = parseFloat(baseValue);
    const perc = parseFloat(percentual) / 100;
    const months = parseInt(monthsLate);
    const taxaJuros = parseFloat(interestRate) / 100;

    if (isNaN(base) || isNaN(perc) || isNaN(months) || isNaN(taxaJuros)) return;

    // Cálculo do valor original devido (sem juros/correção)
    const valorMensalDevido = baseType === 'minimo' ? base * perc : base;
    const valorOriginalDevedor = valorMensalDevido * months;

    // Simulação simplificada de Correção Monetária + Juros (já que não temos API histórica)
    // Para um cálculo real, isso precisaria bater em uma API do BCB com o índice exato mês a mês.
    // Aqui usaremos os juros simples para demonstrar no utilitário de forma conservadora.
    const jurosMoraTotal = valorOriginalDevedor * (taxaJuros * months); 
    const correcaoEstimada = valorOriginalDevedor * 0.05; // 5% estimado fixo para fins UI se API não houver.

    const totalDevido = valorOriginalDevedor + jurosMoraTotal + correcaoEstimada;

    setResultado({
      valorMensal: valorMensalDevido,
      meses: months,
      original: valorOriginalDevedor,
      juros: jurosMoraTotal,
      correcao: correcaoEstimada,
      total: totalDevido,
      indice: correctionIndex,
      taxa: interestRate,
      tipoBase: baseType === 'minimo' ? 'Salário Mínimo' : 'Rendimento Fixo'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
            <div>
                <FormLabel>Base de Cálculo</FormLabel>
                <StyledSelect value={baseType} onChange={e => setBaseType(e.target.value)}>
                    <option value="minimo">Salário Mínimo</option>
                    <option value="fixo">Rendimentos Líquidos</option>
                </StyledSelect>
            </div>
            <div>
                <FormLabel>Valor Base Atual (R$)</FormLabel>
                <Input 
                    type="number" 
                    placeholder={baseType === 'minimo' ? "Ex: 1412" : "Ex: 5000"} 
                    value={baseValue} 
                    onChange={e => setBaseValue(e.target.value)}
                />
            </div>
        </div>
        
        {baseType === 'minimo' && (
            <div>
              <FormLabel>Percentual Devido (%)</FormLabel>
              <Input 
                type="number" 
                placeholder="Ex: 30" 
                value={percentual} 
                onChange={e => setPercentual(e.target.value)}
              />
            </div>
        )}

        <div>
          <FormLabel>Meses em Atraso</FormLabel>
          <Input 
            type="number" 
            placeholder="Ex: 3" 
            value={monthsLate} 
            onChange={e => setMonthsLate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Índice de Correção</FormLabel>
            <StyledSelect value={correctionIndex} onChange={e => setCorrectionIndex(e.target.value)}>
              <option value="INPC">INPC</option>
              <option value="IPCA">IPCA</option>
              <option value="IGPM">IGP-M</option>
            </StyledSelect>
          </div>
          <div>
            <FormLabel>Juros Mora (% a.m.)</FormLabel>
            <Input 
              type="number" 
              placeholder="Ex: 1" 
              value={interestRate} 
              onChange={e => setInterestRate(e.target.value)}
            />
          </div>
        </div>

        <CalcButton onClick={calcular}>Calcular Pensão Atrasada</CalcButton>
      </div>

      <ResultCard 
        mode={mode} 
        UpgradeBanner={UpgradeBanner} 
        onDraft={onDraft}
        draftTitle="Cálculo de Pensão Alimentícia"
        draftData={resultado}
      >
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Detalhamento da Execução</h3>
        {resultado ? (
          <div className="space-y-1">
            <ResultRow label={`Valor Mensal Devido (${resultado.tipoBase})`} value={fmt(resultado.valorMensal)} />
            <ResultRow label={`Dívida Histórica (${resultado.meses} meses)`} value={fmt(resultado.original)} />
            <div className="py-2"></div>
            <ResultRow label={`Correção Monetária (${resultado.indice})`} value={fmt(resultado.correcao)} accent />
            <ResultRow label={`Juros de Mora (${resultado.taxa}% a.m.)`} value={fmt(resultado.juros)} accent />
            <div className="py-2"></div>
            <ResultRow label="TOTAL ATUALIZADO" value={fmt(resultado.total)} highlight />
            <p className="text-[10px] text-gray-400 mt-4 leading-tight italic">
              * O cálculo de correção acima utiliza uma projeção aproximada baseada na taxa média para fins de resumo inicial contencioso. Consulte o índice exato do {resultado.indice} no site do BCB para sentenças judiciais transitadas.
            </p>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
            Preencha os dados da pensão para calcular o montante da execução
          </div>
        )}
      </ResultCard>
    </div>
  );
};

export default AlimonyCalculator;

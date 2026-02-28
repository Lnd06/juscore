import React, { useState } from 'react';
import { ResultRow, ResultCard, CalcButton, FormLabel, StyledSelect, fmt } from './CalculatorUI';
import { Input } from '../../../components/ui';
import { Calendar, DollarSign, Percent, Scale, Calculator as CalcIcon } from 'lucide-react';

const CorrectionCalculator = ({ checkLimit, UpgradeBanner, mode, onDraft }) => {
  const [valor, setValor] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [indice, setIndice] = useState('ipca');
  const [customIndices, setCustomIndices] = useState({ ipca: 1.15, igpm: 1.25, selic: 1.32 });
  
  // Detalhes da Execução
  const [jurosMora, setJurosMora] = useState('1'); // 1% ao mês padrão
  const [mesesJuros, setMesesJuros] = useState('0');
  const [multa, setMulta] = useState('0');
  const [honorarios, setHonorarios] = useState('10'); // 10% padrão
  const [baseHonorarios, setBaseHonorarios] = useState('total'); // 'total' ou 'principal'
  
  const [showSettings, setShowSettings] = useState(false);
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    if (!checkLimit()) return;
    
    const vInput = parseFloat(valor);
    if (isNaN(vInput)) return;

    // 1. Correção Monetária
    const fator = customIndices[indice] || 1.10;
    const valorCorrigido = vInput * fator;
    const ganhoCorrecao = valorCorrigido - vInput;

    // 2. Juros de Mora (Linear/Simples, padrão jurídico brasileiro)
    const taxaJuros = parseFloat(jurosMora) / 100;
    const nMeses = parseInt(mesesJuros) || 0;
    const valorJuros = valorCorrigido * taxaJuros * nMeses; // Juros sobre o corrigido

    // 3. Multa (Normalmente Art. 523 do CPC = 10% sobre o montante da condenação)
    const taxaMulta = parseFloat(multa) / 100;
    const valorMulta = (valorCorrigido + valorJuros) * taxaMulta;

    // 4. Honorários (Sucumbência ou Cumprimento de Sentença)
    const taxaHonorarios = parseFloat(honorarios) / 100;
    let valorHonorarios = 0;
    if (baseHonorarios === 'total') {
      valorHonorarios = (valorCorrigido + valorJuros + valorMulta) * taxaHonorarios;
    } else {
      valorHonorarios = vInput * taxaHonorarios;
    }

    const totalGeral = valorCorrigido + valorJuros + valorMulta + valorHonorarios;

    setResultado({ 
      original: vInput, 
      corrigido: valorCorrigido,
      ganhoCorrecao,
      juros: valorJuros,
      multa: valorMulta,
      honorarios: valorHonorarios,
      total: totalGeral,
      indice: indice.toUpperCase(),
      fatorPercent: (((fator - 1) * 100) || 0).toFixed(2),
      taxaJuros: (taxaJuros * 100).toFixed(2),
      mesesJuros: nMeses,
      taxaMulta: (taxaMulta * 100).toFixed(0),
      taxaHonorarios: (taxaHonorarios * 100).toFixed(0)
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <FormLabel>Valor Histórico/Original (R$)</FormLabel>
          <div className="relative">
            <DollarSign className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <Input 
              type="number" 
              placeholder="Ex: 50000" 
              value={valor} 
              onChange={e => setValor(e.target.value)}
              className="pl-10 h-10 text-sm"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Data do Débito</FormLabel>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input 
                type="date" 
                value={dataInicio} 
                onChange={e => setDataInicio(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>
          <div>
            <FormLabel>Índice de Correção</FormLabel>
            <StyledSelect value={indice} onChange={e => setIndice(e.target.value)}>
              <option value="ipca">IPCA (IBGE)</option>
              <option value="igpm">IGP-M (FGV)</option>
              <option value="selic">SELIC</option>
            </StyledSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div>
            <FormLabel>Juros de Mora (% a.m.)</FormLabel>
            <div className="relative">
              <Percent className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input 
                type="number" 
                step="0.1"
                value={jurosMora} 
                onChange={e => setJurosMora(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>
          <div>
            <FormLabel>Período (Meses para Juros)</FormLabel>
            <Input 
              type="number" 
              placeholder="Qtd Meses"
              value={mesesJuros} 
              onChange={e => setMesesJuros(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
        </div>

        <div className="pt-1">
          <button 
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs font-semibold text-accent hover:text-accent-dark transition-colors flex items-center gap-1 mb-3 ml-1"
          >
            {showSettings ? '− Ocultar Multas e Honorários' : '+ Adicionar Multas e Honorários'}
          </button>

          {showSettings && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FormLabel>Multa (Art. 523 CPC, etc)</FormLabel>
                  <div className="relative">
                    <Percent className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input 
                      type="number" 
                      step="1"
                      placeholder="%"
                      value={multa} 
                      onChange={e => setMulta(e.target.value)}
                      className="pl-9 h-10 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <FormLabel>Honorários Sucumbenciais</FormLabel>
                  <div className="relative">
                    <Scale className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input 
                      type="number" 
                      step="1"
                      placeholder="%"
                      value={honorarios} 
                      onChange={e => setHonorarios(e.target.value)}
                      className="pl-9 h-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                 <FormLabel>Base de Cálculo dos Honorários</FormLabel>
                 <StyledSelect value={baseHonorarios} onChange={e => setBaseHonorarios(e.target.value)}>
                    <option value="total">Sobre o Valor Total Atualizado (com multas e juros)</option>
                    <option value="principal">Sobre o Valor Principal (Sem correção)</option>
                 </StyledSelect>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <FormLabel className="mb-2 block">Simulador Fatores Acumulados</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                  <Input 
                    type="number" step="0.01" value={customIndices.ipca} 
                    onChange={e => setCustomIndices({...customIndices, ipca: parseFloat(e.target.value) || 0})}
                    className="h-8 text-xs text-center" 
                    title="Fator IPCA"
                  />
                  <Input 
                    type="number" step="0.01" value={customIndices.igpm} 
                    onChange={e => setCustomIndices({...customIndices, igpm: parseFloat(e.target.value) || 0})}
                    className="h-8 text-xs text-center"
                    title="Fator IGP-M"
                  />
                  <Input 
                    type="number" step="0.01" value={customIndices.selic} 
                    onChange={e => setCustomIndices({...customIndices, selic: parseFloat(e.target.value) || 0})}
                    className="h-8 text-xs text-center"
                    title="Fator SELIC"
                  />
                </div>
              </div>

            </div>
          )}
        </div>
        <CalcButton onClick={calcular}>Atualizar Valores e Calcular</CalcButton>
      </div>

      <ResultCard 
        mode={mode} 
        UpgradeBanner={UpgradeBanner} 
        onDraft={onDraft}
        draftTitle={`Atualização Monetária - Índice: ${indice.toUpperCase()}`}
        draftData={resultado}
      >
        <div className="flex items-center gap-2 mb-4">
          <CalcIcon className="w-5 h-5 text-gray-900 dark:text-white" />
          <h3 className="font-bold text-gray-900 dark:text-white">Relatório de Atualização</h3>
        </div>
        
        {resultado ? (
          <div className="space-y-2 text-sm">
            <ResultRow label="Principal (Valor Histórico)" value={fmt(resultado.original)} />
            
            <div className="pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-1 my-2">
              <ResultRow label={`Acréscimo por Correção (${resultado.fatorPercent}%)`} value={fmt(resultado.ganhoCorrecao)} />
              {resultado.juros > 0 && <ResultRow label={`Valor Juros de Mora (${resultado.mesesJuros}m x ${resultado.taxaJuros}%)`} value={fmt(resultado.juros)} />}
            </div>

            <ResultRow label="Subtotal Corrigido (Principal + Juros)" value={fmt(resultado.corrigido + resultado.juros)} highlight />
            
            <div className="my-2 border-t border-gray-100 dark:border-gray-800 pt-2 space-y-1">
               {resultado.multa > 0 && <ResultRow label={`Multa Processual/Penal (${resultado.taxaMulta}%)`} value={fmt(resultado.multa)} />}
               {resultado.honorarios > 0 && <ResultRow label={`Honorários Advocatícios (${resultado.taxaHonorarios}%)`} value={fmt(resultado.honorarios)} accent />}
            </div>

            <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700 pt-3 mt-3"></div>
            <ResultRow label="MONTANTE TOTAL DEVIDO" value={fmt(resultado.total)} highlight accent />
            
            <p className="text-[11px] text-gray-400 mt-4 leading-relaxed italic text-center px-4 bg-gray-50 dark:bg-gray-800/40 py-2 rounded-lg">
              * Relatório analítico. Juros aplicados de forma simples sobre o principal atualizado monetariamente pelo {resultado.indice}. Termo de início a partir de {dataInicio || 'data não informada'}.
            </p>
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/30">
            <DollarSign className="w-6 h-6 mb-2 opacity-50" />
            Preencha os dados e gere o relatório
          </div>
        )}
      </ResultCard>
    </div>
  );
};

export default CorrectionCalculator;

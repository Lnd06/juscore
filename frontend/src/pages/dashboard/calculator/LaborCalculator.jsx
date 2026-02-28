import React, { useState } from 'react';
import { ResultRow, ResultCard, CalcButton, FormLabel, fmt, StyledSelect } from './CalculatorUI';
import { Input } from '../../../components/ui';

const LaborCalculator = ({ checkLimit, UpgradeBanner, mode, onDraft }) => {
  const [salario, setSalario] = useState('');
  const [meses, setMeses] = useState('');
  const [feriasVencidas, setFeriasVencidas] = useState(false);
  const [motivo, setMotivo] = useState('sem_justa_causa');
  const [avisoPrevio, setAvisoPrevio] = useState('indenizado'); // indenizado, trabalhado
  const [calcularFGTS, setCalcularFGTS] = useState(true);
  
  const [saldoDias, setSaldoDias] = useState(15);
  const [showSettings, setShowSettings] = useState(false);
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    if (!checkLimit()) return;
    
    const s = parseFloat(salario);
    const m = parseInt(meses);
    const d = parseInt(saldoDias);

    if (isNaN(s) || isNaN(m) || isNaN(d)) return;

    // 1. Verbas Básicas Comuns
    const saldoSalario = (s / 30) * d; 
    let decimoTerceiro = 0;
    let feriasProp = 0;
    let umTercoFerias = 0;
    let valorAviso = 0;
    let fgtsCalculado = 0;
    let multaFgts = 0;

    // 2. Regras por Motivo de Rescisão
    if (motivo !== 'justa_causa') {
      decimoTerceiro = (s / 12) * m;
      feriasProp = (s / 12) * m;
      umTercoFerias = (feriasProp + (feriasVencidas ? s : 0)) / 3;
    } else {
      // Justa causa só recebe férias vencidas
      umTercoFerias = feriasVencidas ? (s / 3) : 0;
    }

    // 3. Aviso Prévio
    if (motivo === 'sem_justa_causa' && avisoPrevio === 'indenizado') {
      valorAviso = s;
    } else if (motivo === 'pedido_demissao' && avisoPrevio === 'nao_cumprido') {
      // Exemplo simplificado onde o funcionário não cumpriu e tem descontado 1 salário (opcional, vamos deixar zerado pra simplificar o crédito)
      valorAviso = 0; 
    }

    // 4. FGTS e Multa
    if (calcularFGTS) {
      const fgtsAcumulado = (s * 0.08) * m;
      
      if (motivo === 'sem_justa_causa') {
        fgtsCalculado = fgtsAcumulado + (saldoSalario + decimoTerceiro + valorAviso) * 0.08;
        multaFgts = fgtsCalculado * 0.40;
      } else if (motivo === 'pedido_demissao' || motivo === 'justa_causa') {
        fgtsCalculado = 0; // Não pode sacar
        multaFgts = 0;
      }
    }

    const total = decimoTerceiro + feriasProp + umTercoFerias + saldoSalario + 
                  valorAviso + fgtsCalculado + multaFgts + (feriasVencidas ? s : 0);

    setResultado({ 
      motivo,
      decimoTerceiro, 
      feriasProp, 
      umTercoFerias, 
      saldoSalario,
      valorAviso,
      fgts: fgtsCalculado,
      multaFgts,
      diasSaldo: d,
      feriasVencidas: feriasVencidas ? s : 0,
      avisoPrevio,
      total 
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <FormLabel>Último Salário Bruto (R$)</FormLabel>
          <Input 
            type="number" 
            placeholder="Ex: 3500" 
            value={salario} 
            onChange={e => setSalario(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Meses Trabalhados</FormLabel>
            <Input 
              type="number" 
              placeholder="Ex: 8" 
              value={meses} 
              onChange={e => setMeses(e.target.value)}
            />
          </div>
          <div>
            <FormLabel>Motivo da Rescisão</FormLabel>
            <StyledSelect value={motivo} onChange={e => setMotivo(e.target.value)}>
              <option value="sem_justa_causa">Sem Justa Causa</option>
              <option value="pedido_demissao">Pedido de Demissão</option>
              <option value="justa_causa">Justa Causa</option>
            </StyledSelect>
          </div>
        </div>
        
        <div className="flex items-center gap-3 py-2">
          <input 
            type="checkbox" 
            id="feriasVencidas"
            checked={feriasVencidas} 
            onChange={e => setFeriasVencidas(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
          />
          <label htmlFor="feriasVencidas" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            Trabalhador possui férias vencidas?
          </label>
        </div>

        <div className="pt-2">
          <button 
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs font-semibold text-accent hover:text-accent-dark transition-colors flex items-center gap-1 mb-3 ml-1"
          >
            {showSettings ? '− Ocultar Ajustes Avançados' : '+ Verbas Adicionais (Aviso/FGTS)'}
          </button>

          {showSettings && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FormLabel>Dias Trabalhados (Saldo)</FormLabel>
                  <Input 
                    type="number" 
                    value={saldoDias} 
                    onChange={e => setSaldoDias(parseInt(e.target.value) || 0)}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <FormLabel>Aviso Prévio</FormLabel>
                  <StyledSelect disabled={motivo === 'justa_causa'} value={avisoPrevio} onChange={e => setAvisoPrevio(e.target.value)}>
                    <option value="indenizado">Indenizado pelo Empregador</option>
                    <option value="trabalhado">Trabalhado</option>
                    {motivo === 'pedido_demissao' && <option value="nao_cumprido">Não cumprido pelo funcionário</option>}
                  </StyledSelect>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mt-2">
                <input 
                  type="checkbox" 
                  id="calcFgts"
                  disabled={motivo !== 'sem_justa_causa'}
                  checked={motivo === 'sem_justa_causa' ? calcularFGTS : false} 
                  onChange={e => setCalcularFGTS(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent disabled:opacity-50"
                />
                <label htmlFor="calcFgts" className={`text-sm cursor-pointer font-medium ${motivo !== 'sem_justa_causa' ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  Incluir FGTS (8%) + Multa Contratual (40%)
                </label>
              </div>
            </div>
          )}
        </div>

        <CalcButton onClick={calcular}>Simular Rescisão Trabalhista</CalcButton>
      </div>

      <ResultCard 
        mode={mode} 
        UpgradeBanner={UpgradeBanner} 
        onDraft={onDraft}
        draftTitle={`Rescisão Trabalhista: ${motivo.replace(/_/g, ' ')}`}
        draftData={resultado}
      >
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Verbas Rescisórias Resumo</h3>
        {resultado ? (
          <div className="space-y-2 text-sm">
            <ResultRow label={`Saldo Salário (${resultado.diasSaldo} dias)`} value={fmt(resultado.saldoSalario)} />
            {resultado.decimoTerceiro > 0 && <ResultRow label="13º Salário Proporcional" value={fmt(resultado.decimoTerceiro)} />}
            {resultado.feriasProp > 0 && <ResultRow label="Férias Proporcionais" value={fmt(resultado.feriasProp)} />}
            {resultado.umTercoFerias > 0 && <ResultRow label="1/3 Constitucional de Férias" value={fmt(resultado.umTercoFerias)} />}
            {resultado.feriasVencidas > 0 && <ResultRow label="Férias Vencidas" value={fmt(resultado.feriasVencidas)} />}
            {resultado.valorAviso > 0 && <ResultRow label="Aviso Prévio Indenizado" value={fmt(resultado.valorAviso)} />}
            
            {(resultado.fgts > 0 || resultado.multaFgts > 0) && <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2"></div>}
            {resultado.fgts > 0 && <ResultRow label="Saque FGTS (Estimativa)" value={fmt(resultado.fgts)} accent />}
            {resultado.multaFgts > 0 && <ResultRow label="Multa 40% do FGTS" value={fmt(resultado.multaFgts)} accent />}
            
            <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700 pt-3 mt-3"></div>
            <ResultRow label="VALOR TOTAL LÍQUIDO A RECEBER" value={fmt(resultado.total)} highlight accent />
            
            <p className="text-[11px] text-gray-400 mt-4 leading-relaxed italic text-center px-4 bg-gray-50 dark:bg-gray-800/40 py-2 rounded-lg">
              * Simulação baseada no motivo '{resultado.motivo.replace(/_/g, ' ')}'. Valores brutos sujeitos a encargos de INSS/IRRF no momento do acerto oficial.
            </p>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/30">
            Preencha os dados e clique em Simular
          </div>
        )}
      </ResultCard>
    </div>
  );
};

export default LaborCalculator;

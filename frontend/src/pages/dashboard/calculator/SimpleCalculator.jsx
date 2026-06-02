/* eslint-disable no-unused-vars, , react-hooks/static-components */
import React, { useState } from 'react';
import { Card, Button } from '../../../components/ui';

const SimpleCalculator = ({ checkLimit, UpgradeBanner, mode }) => {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState(0);
  const [isScientific, setIsScientific] = useState(true);

  // Helper for trigonometry
  const toRad = deg => deg * (Math.PI / 180);
  const toDeg = rad => rad * (180 / Math.PI);

  const getCurrentValue = () => {
    try {
      // Basic math check
      const expression = display.replace(/x/g, '*').replace(/÷/g, '/');
      const result = new Function('return ' + expression)();
      return parseFloat(result);
    } catch {
      return 0;
    }
  };

  const applyScientific = (fn) => {
    const val = getCurrentValue();
    let res = 0;
    switch(fn) {
      case 'sin': res = Math.sin(toRad(val)); break;
      case 'cos': res = Math.cos(toRad(val)); break;
      case 'tan': res = Math.tan(toRad(val)); break;
      case 'sqrt': res = Math.sqrt(val); break;
      case 'log': res = Math.log10(val); break;
      case 'ln': res = Math.log(val); break;
      case 'pow2': res = Math.pow(val, 2); break;
      case 'pow3': res = Math.pow(val, 3); break;
      case 'exp': res = Math.exp(val); break;
      case 'pitagoras': res = 3.14159265; break; // Simple PI
      default: res = val;
    }
    setDisplay(res.toString());
  };

  const input = (val) => {
    if (display === '0') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const clear = () => setDisplay('0');
  const backspace = () => {
    if (display.length > 1) setDisplay(display.slice(0, -1));
    else setDisplay('0');
  };

  const toggleSign = () => {
    if (display.startsWith('-')) {
      setDisplay(display.slice(1));
    } else if (display !== '0') {
      setDisplay('-' + display);
    }
  };

  const calculate = () => {
    if (!checkLimit()) return;
    try {
      // Replace symbols for eval
      let expression = display.replace(/x/g, '*').replace(/÷/g, '/');
      // eslint-disable-next-line no-eval
      let result = new Function('return ' + expression)();
      if (result === Infinity || isNaN(result)) {
        setDisplay('Erro');
      } else {
        setDisplay(result.toString().substring(0, 15));
      }
    } catch (e) {
      setDisplay('Erro');
    }
  };

  const inputPercent = () => {
    const val = getCurrentValue();
    setDisplay((val / 100).toString());
  };

  // Memory functions
  const memAdd = () => setMemory(memory + getCurrentValue());
  const memRecall = () => setDisplay(memory.toString());
  const memClear = () => setMemory(0);

  const ScientificBtn = ({ label, fn, className = "" }) => (
    <button 
      onClick={() => applyScientific(fn)}
      className={`h-12 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
    >
      {label}
    </button>
  );

  const CalcBtn = ({ label, onClick, className = "", variant = "number" }) => {
    const base = "h-14 md:h-16 rounded-2xl flex items-center justify-center text-xl font-medium transition-all duration-200 active:scale-95 ";
    const styles = {
      number: "bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 shadow-sm",
      operator: "bg-accent/10 dark:bg-accent/20 text-accent hover:bg-accent dark:hover:bg-accent hover:text-white font-bold shadow-sm shadow-accent/5",
      action: "bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20",
      equal: "bg-gradient-to-r from-accent to-accent-light text-white hover:opacity-90 shadow-lg shadow-accent/30 font-black"
    };

    return (
      <button onClick={onClick} className={base + styles[variant] + " " + className}>
        {label}
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-4 md:p-8 bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden relative">
        {mode === 'public' && (
          <div className="absolute inset-0 z-10 bg-white/5 backdrop-blur-[2px] pointer-events-none flex flex-col items-center justify-center p-6 text-center">
             <div className="bg-white/90 dark:bg-gray-900/90 p-8 rounded-3xl shadow-2xl border border-accent/20 pointer-events-auto max-w-sm">
                <UpgradeBanner />
             </div>
          </div>
        )}

        {/* Header/Mode Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
             <button 
               onClick={() => setIsScientific(false)}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isScientific ? 'bg-white dark:bg-gray-800 text-accent shadow-sm' : 'text-gray-500'}`}
             >Padrao</button>
             <button 
               onClick={() => setIsScientific(true)}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isScientific ? 'bg-white dark:bg-gray-800 text-accent shadow-sm' : 'text-gray-500'}`}
             >Cientifica</button>
          </div>
          <div className="text-[10px] font-mono text-gray-400 dark:text-gray-600 flex gap-3 uppercase tracking-widest">
            <span>RAD</span>
            <span className={memory !== 0 ? 'text-accent' : 'opacity-20'}>MEM</span>
          </div>
        </div>

        {/* Display */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 mb-8 border border-gray-100 dark:border-gray-800/50">
           <div className="h-6 text-sm text-gray-400 dark:text-gray-600 text-right font-mono truncate mb-1">
             {display !== '0' && display}
           </div>
           <div className="h-16 text-4xl md:text-5xl font-bold text-gray-900 dark:text-white text-right font-mono tracking-tighter truncate leading-tight">
             {display}
           </div>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          {/* Scientific Column (Left on Desktop) */}
          {isScientific && (
            <div className="col-span-4 md:col-span-2 grid grid-cols-4 md:grid-cols-2 gap-2 mb-4 md:mb-0">
               <ScientificBtn label="sin" fn="sin" />
               <ScientificBtn label="cos" fn="cos" />
               <ScientificBtn label="tan" fn="tan" />
               <ScientificBtn label="√" fn="sqrt" />
               <ScientificBtn label="log" fn="log" />
               <ScientificBtn label="ln" fn="ln" />
               <ScientificBtn label="x²" fn="pow2" />
               <ScientificBtn label="x³" fn="pow3" />
               <ScientificBtn label="eˣ" fn="exp" />
               <ScientificBtn label="π" fn="pi" />
               <button onClick={memRecall} className="h-12 rounded-lg bg-accent/5 dark:bg-accent/10 text-accent text-xs font-bold">MR</button>
               <button onClick={memAdd} className="h-12 rounded-lg bg-accent/5 dark:bg-accent/10 text-accent text-xs font-bold">M+</button>
            </div>
          )}

          {/* Main Controls */}
          <div className={`${isScientific ? 'col-span-4' : 'col-span-4 md:col-span-6'} grid grid-cols-4 gap-3`}>
             <CalcBtn label="AC" onClick={clear} variant="action" />
             <CalcBtn label="⌫" onClick={backspace} variant="action" />
             <CalcBtn label="%" onClick={inputPercent} variant="action" />
             <CalcBtn label="÷" onClick={() => input(' ÷ ')} variant="operator" />

             <CalcBtn label="7" onClick={() => input('7')} />
             <CalcBtn label="8" onClick={() => input('8')} />
             <CalcBtn label="9" onClick={() => input('9')} />
             <CalcBtn label="x" onClick={() => input(' x ')} variant="operator" />

             <CalcBtn label="4" onClick={() => input('4')} />
             <CalcBtn label="5" onClick={() => input('5')} />
             <CalcBtn label="6" onClick={() => input('6')} />
             <CalcBtn label="-" onClick={() => input(' - ')} variant="operator" />

             <CalcBtn label="1" onClick={() => input('1')} />
             <CalcBtn label="2" onClick={() => input('2')} />
             <CalcBtn label="3" onClick={() => input('3')} />
             <CalcBtn label="+" onClick={() => input(' + ')} variant="operator" />

             <CalcBtn label="+/-" onClick={toggleSign} />
             <CalcBtn label="0" onClick={() => input('0')} />
             <CalcBtn label="." onClick={() => input('.')} />
             <CalcBtn label="=" onClick={calculate} variant="equal" />
          </div>
        </div>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-600">
           Calculadora Financeira Legal v1.0 • JusCore AI
        </p>
      </div>
    </div>
  );
};

export default SimpleCalculator;

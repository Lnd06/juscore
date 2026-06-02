import { Download, FileText, ChevronDown } from 'lucide-react';
import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';

export const ExportButton = ({ sessionId, className }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (type) => {
    try {
      setIsExporting(true);
      setIsOpen(false);
      
      const endpoint = type === 'doc' ? `/api/export/doc/${sessionId}` : `/api/export/pdf/${sessionId}`;
      
      const response = await axios.get(endpoint, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `JusCore_${type}_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors ${className || ''}`}
      >
        <span className="flex items-center gap-2">
          <Download size={16} />
          {isExporting ? 'Processando...' : 'Exportar / Baixar'}
        </span>
        <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => handleExport('pdf')}
            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50"
          >
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
               <Download size={16} />
            </div>
            <div>
               <div className="font-medium">Exportar Conversa</div>
               <div className="text-xs text-gray-500">Salvar histórico completo do chat</div>
            </div>
          </button>
          
          <button
            onClick={() => handleExport('doc')}
            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
               <FileText size={16} />
            </div>
             <div>
               <div className="font-medium">Documento Formal</div>
               <div className="text-xs text-gray-500">Apenas o texto final (A4 Limpo)</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

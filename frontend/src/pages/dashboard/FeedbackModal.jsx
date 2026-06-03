/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, Bug, Send, Sparkles } from 'lucide-react';
import axios from 'axios';

const FeedbackModal = ({ isOpen, onClose }) => {
  const [type, setType] = useState('SUGGESTION');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/feedback', { type, title, message }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setType('SUGGESTION');
        setTitle('');
        setMessage('');
        onClose();
      }, 2000);
    } catch (err) {
      alert("Erro ao enviar. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 transition-all duration-300">
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-2xl border border-gray-100/80 dark:border-white/5 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* Glow Effects */}
        <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 transition-all duration-500 ${
          type === 'BUG' ? 'bg-red-500' : 'bg-purple-500'
        }`} />
        <div className={`absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-20 transition-all duration-500 ${
          type === 'BUG' ? 'bg-orange-500' : 'bg-blue-500'
        }`} />

        {/* Header */}
        <div className="relative z-10 flex justify-between items-start p-8 pb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
              type === 'BUG' 
                ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                : 'bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
            }`}>
              {type === 'BUG' ? <Bug className="w-6 h-6 animate-pulse" /> : <Sparkles className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                Feedback e Bugs
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Ajude-nos a aprimorar o JusCore AI para seus estudos
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form or Success message */}
        {success ? (
          <div className="relative z-10 p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/25 animate-bounce">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Muito obrigado!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
              Sua mensagem foi enviada. Nossa equipe técnica e de produto analisará o seu relato para aplicar melhorias o quanto antes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative z-10 p-8 pt-4 space-y-6">
            {/* Options Tabs */}
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${
                type === 'SUGGESTION' 
                  ? 'border-purple-500 bg-purple-500/5 text-purple-700 dark:text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.1)] scale-[1.02]' 
                  : 'border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:scale-[1.01]'
              }`}>
                <input 
                  type="radio" 
                  name="type" 
                  value="SUGGESTION" 
                  checked={type === 'SUGGESTION'} 
                  onChange={(e) => setType(e.target.value)} 
                  className="sr-only" 
                />
                <MessageSquare className="w-6 h-6" />
                <span className="font-bold text-xs uppercase tracking-wider">Sugestão / Ideia</span>
              </label>
              
              <label className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300 ${
                type === 'BUG' 
                  ? 'border-red-500 bg-red-500/5 text-red-700 dark:text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.1)] scale-[1.02]' 
                  : 'border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:scale-[1.01]'
              }`}>
                <input 
                  type="radio" 
                  name="type" 
                  value="BUG" 
                  checked={type === 'BUG'} 
                  onChange={(e) => setType(e.target.value)} 
                  className="sr-only" 
                />
                <Bug className="w-6 h-6" />
                <span className="font-bold text-xs uppercase tracking-wider">Relatar Problema</span>
              </label>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  Título
                </label>
                <input 
                  type="text" 
                  required
                  placeholder={type === 'BUG' ? "Ex: Erro ao gerar peça de Direito do Trabalho" : "Ex: Adicionar modo escuro automático por horário"}
                  className={`w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-950/40 border rounded-2xl outline-none transition-all duration-200 text-sm text-gray-950 dark:text-white placeholder-gray-400 ${
                    type === 'BUG' 
                      ? 'border-gray-200 dark:border-white/5 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                      : 'border-gray-200 dark:border-white/5 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'
                  }`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  Descrição
                </label>
                <textarea 
                  required
                  rows="4"
                  placeholder={type === 'BUG' ? "Descreva passo a passo o que aconteceu para simular o erro..." : "Descreva detalhadamente qual funcionalidade gostaria de ver no sistema..."}
                  className={`w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-950/40 border rounded-2xl outline-none transition-all duration-200 text-sm text-gray-950 dark:text-white placeholder-gray-400 resize-none h-32 ${
                    type === 'BUG' 
                      ? 'border-gray-200 dark:border-white/5 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                      : 'border-gray-200 dark:border-white/5 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'
                  }`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={loading}
                className="px-6 py-3 border border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className={`px-8 py-3 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg hover:-translate-y-0.5 ${
                  type === 'BUG'
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-600/20 hover:shadow-red-600/30'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/20 hover:shadow-purple-600/30'
                }`}
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default FeedbackModal;

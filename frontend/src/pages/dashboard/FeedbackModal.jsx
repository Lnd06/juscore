/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { X, MessageSquare, Bug, Send } from 'lucide-react';
import { Button } from '../../components/ui';
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Feedback e Bugs
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {success ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mensagem Enviada!</h3>
            <p className="text-gray-600 dark:text-gray-400">Muito obrigado por ajudar a melhorar o JusCore AI. Nossa equipe analisará em breve.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${type === 'SUGGESTION' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                <input type="radio" name="type" value="SUGGESTION" checked={type === 'SUGGESTION'} onChange={(e) => setType(e.target.value)} className="sr-only" />
                <MessageSquare className="w-6 h-6" />
                <span className="font-medium">Sugestão / Ideia</span>
              </label>
              
              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${type === 'BUG' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                <input type="radio" name="type" value="BUG" checked={type === 'BUG'} onChange={(e) => setType(e.target.value)} className="sr-only" />
                <Bug className="w-6 h-6" />
                <span className="font-medium">Relatar Problema</span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                <input 
                  type="text" 
                  required
                  placeholder={type === 'BUG' ? "Ex: Erro ao gerar documento" : "Ex: Adicionar modo noturno"}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <textarea 
                  required
                  rows="4"
                  placeholder={type === 'BUG' ? "Descreva passo a passo o que aconteceu..." : "Descreva detalhadamente a sua ideia..."}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white min-w-[120px]">
                {loading ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;

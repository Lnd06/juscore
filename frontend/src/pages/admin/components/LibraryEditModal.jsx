/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, Save } from 'lucide-react';
import { CATEGORIAS } from './LibraryConstants';

const LibraryEditModal = ({ book, onClose, onSaved }) => {
  const [editingTitle, setEditingTitle] = useState(book.title || '');
  const [editingCategory, setEditingCategory] = useState(book.categoria || 'GERAL');
  const [editingContent, setEditingContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`/api/knowledge/${book.id || book._id}/content`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEditingContent(data.content);
      } catch (e) {
        alert("Não foi possível carregar o conteúdo do arquivo físico.");
        onClose();
      } finally {
        setIsLoadingContent(false);
      }
    };
    fetchContent();
  }, [book, onClose]);

  const saveEdit = async () => {
    if (!editingTitle) return alert("Título é obrigatório");
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem('token');
      const bookId = book.id || book._id;
      // 1. Save title and category
      await axios.put(`/api/knowledge/${bookId}`, { title: editingTitle, categoria: editingCategory }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // 2. Save content
      await axios.put(`/api/knowledge/${bookId}/content`, { content: editingContent }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("Documento atualizado com sucesso!");
      if (onSaved) onSaved();
    } catch (e) {
      alert("Erro ao salvar edição");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-bg border border-brand-border w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-gray-900/50">
          <h3 className="font-bold text-lg text-white">Editar Documento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Título</label>
              <input 
                type="text" 
                value={editingTitle}
                onChange={e => setEditingTitle(e.target.value)}
                className="w-full bg-gray-900 border border-brand-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-accent text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Categoria</label>
              <select
                value={editingCategory}
                onChange={e => setEditingCategory(e.target.value)}
                className="w-full bg-gray-900 border border-brand-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-accent text-sm"
              >
                {CATEGORIAS.filter(c => c.id !== 'TODAS').map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-gray-900 text-white">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center justify-between">
              Conteúdo do Arquivo Fisico
              {isLoadingContent && <Loader2 className="w-3 h-3 animate-spin"/>}
            </label>
            <textarea 
              value={editingContent}
              onChange={e => setEditingContent(e.target.value)}
              disabled={isLoadingContent}
              placeholder="Carregando conteúdo..."
              className="w-full bg-gray-900 border border-brand-border text-white rounded-xl px-4 py-3 outline-none focus:border-accent text-sm font-mono leading-relaxed h-[50vh] resize-y"
            />
            <p className="text-xs text-accent mt-2">
              *Atenção: PDFs muito grandes podem ficar lentos ao editar aqui. Textos inseridos manualmente são editados tranquilamente.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-brand-border bg-gray-900/50 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={saveEdit}
            disabled={isSavingEdit || isLoadingContent}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-accent text-black hover:bg-accent-dark transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default LibraryEditModal;

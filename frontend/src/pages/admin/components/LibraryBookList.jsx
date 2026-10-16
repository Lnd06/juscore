/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Book, Search, FileText, Power, Edit2, Trash2 } from 'lucide-react';
import { CATEGORIAS, BADGE_COLORS, ITEMS_PER_PAGE } from './LibraryConstants';

const LibraryBookList = ({ books, loading, onBooksChanged, onEditBook }) => {
  const [activeFilter, setActiveFilter] = useState('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Derived state: filtering & pagination
  const searchedBooks = books.filter(b => {
    const matchesCategory = activeFilter === 'TODAS' || b.categoria === activeFilter;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(searchedBooks.length / ITEMS_PER_PAGE);
  const paginatedBooks = searchedBooks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter/search change
  }, [activeFilter, searchQuery]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remover este documento LOCALMENTE?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/knowledge/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onBooksChanged) onBooksChanged();
    } catch (e) { console.error(e); }
  };

  const handleToggleActive = async (book) => {
    try {
      const token = localStorage.getItem('token');
      const val = book.isActive === false ? true : false; 
      await axios.put(`/api/knowledge/${book.id || book._id}`, { isActive: val }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onBooksChanged) onBooksChanged();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 shrink-0">
            <Search className="w-5 h-5 text-accent" /> Acervo ({searchedBooks.length})
          </h2>
          <div className="relative flex-1 md:w-64">
            <input 
              type="text"
              placeholder="Pesquisar documento..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-brand-border text-white rounded-lg pl-9 pr-3 py-2 outline-none focus:border-accent text-sm"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 flex-wrap hide-scrollbar overflow-x-auto max-w-full">
          {CATEGORIAS.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === cat.id ? 'bg-accent text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando biblioteca...</div>
      ) : paginatedBooks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-brand-border rounded-2xl">
          <Book className="w-10 h-10 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-500 text-sm">Nenhum documento encontrado.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {paginatedBooks.map((book) => (
              <div key={book.id || book._id} className={`bg-brand-bg border border-brand-border rounded-xl p-4 transition-colors group flex flex-col ${!book.isActive ? 'opacity-50' : 'hover:border-accent/40'}`}>
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[book.categoria] || BADGE_COLORS['GERAL']}`}>
                      {book.categoria || 'GERAL'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleToggleActive(book)} className="p-1 text-gray-600 hover:text-white" title={book.isActive ? "Desativar" : "Ativar"}>
                      <Power className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEditBook(book)} className="p-1 text-gray-600 hover:text-accent" title="Editar Conteúdo / Título">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(book.id || book._id)} className="p-1 text-gray-600 hover:text-red-500" title="Remover Documento">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug" title={book.title}>
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                    <span>{new Date(book.createdAt).toLocaleDateString()}</span>
                    {!book.isActive && <span className="font-bold text-red-500">DESATIVADO</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-md bg-gray-900 border border-brand-border text-white text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-400 mx-2">
                Página {currentPage} de {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-md bg-gray-900 border border-brand-border text-white text-sm disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LibraryBookList;

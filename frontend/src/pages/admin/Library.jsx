import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Trash2, FileText, Book, Search, Loader2, ChevronDown, X, CheckCircle2, AlertCircle, Edit2, Power, Type, Save } from 'lucide-react';

const CATEGORIAS = [
  { id: 'TODAS',     label: 'Todas',      color: 'gray' },
  { id: 'GERAL',     label: 'Geral',      color: 'blue',   desc: 'Contexto geral da IA (chat)' },
  { id: 'OAB',       label: 'OAB',        color: 'amber',  desc: 'Simulador de Peças OAB' },
  { id: 'TCC',       label: 'TCC',        color: 'green',  desc: 'Assistente TCC' },
  { id: 'DOCUMENTOS',label: 'Documentos', color: 'purple', desc: 'Geração de Documentos (em breve)' },
];

const BADGE_COLORS = {
  GERAL:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OAB:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  TCC:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  DOCUMENTOS: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const ITEMS_PER_PAGE = 9;

const Library = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Upload State
  const [uploadMode, setUploadMode] = useState('pdf'); // 'pdf' | 'manual'
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]); 
  const [categoria, setCategoria] = useState('GERAL');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadResults, setUploadResults] = useState(null); 
  
  // Manual text entry state
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');

  // Filtering & Pagination
  const [activeFilter, setActiveFilter] = useState('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/knowledge', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

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


  // Actions
  const handleDelete = async (id) => {
    if (!window.confirm('Remover este documento LOCALMENTE?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/knowledge/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(prev => prev.filter(b => b.id !== id && String(b._id) !== String(id)));
    } catch (e) { console.error(e); }
  };

  const handleToggleActive = async (book) => {
    try {
      const token = localStorage.getItem('token');
      const val = book.isActive === false ? true : false; 
      await axios.put(`/api/knowledge/${book.id || book._id}`, { isActive: val }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBooks();
    } catch (e) { console.error(e); }
  };

  const openEditModal = async (book) => {
    setEditingBook(book);
    setEditingTitle(book.title);
    setEditingContent('');
    setEditModalOpen(true);
    setIsLoadingContent(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`/api/knowledge/${book.id || book._id}/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingContent(data.content);
    } catch (e) {
      alert("Não foi possível carregar o conteúdo do arquivo físico.");
      setEditModalOpen(false);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const saveEdit = async () => {
    if (!editingTitle) return alert("Título é obrigatório");
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem('token');
      const bookId = editingBook.id || editingBook._id;
      // 1. Save title
      await axios.put(`/api/knowledge/${bookId}`, { title: editingTitle }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // 2. Save content
      await axios.put(`/api/knowledge/${bookId}/content`, { content: editingContent }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("Documento atualizado com sucesso!");
      setEditModalOpen(false);
      fetchBooks();
    } catch (e) {
      alert("Erro ao salvar edição");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Upload Logic
  const addFiles = (newFiles) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    if (pdfs.length !== newFiles.length) alert('Apenas arquivos PDF são aceitos.');
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...pdfs.filter(f => !existing.has(f.name))];
    });
    setUploadResults(null);
  };

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleUploadPDF = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;
    setUploading(true);
    setUploadResults(null);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('categoria', categoria);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('/api/knowledge/upload', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        timeout: 600000 
      });
      setUploadResults(data);
      setFiles([]);
      fetchBooks();
    } catch (error) {
      alert(error.response?.data?.error || 'Falha ao enviar arquivos.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadManual = async (e) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) return alert("Preencha título e conteúdo.");
    setUploading(true);
    setUploadResults(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/knowledge/manual', {
        title: manualTitle,
        categoria,
        content: manualContent
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setManualTitle('');
      setManualContent('');
      setUploadResults({ saved: 1, errors: 0 });
      fetchBooks();
    } catch (error) {
      alert("Falha ao salvar texto manual.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100 bg-brand-bg min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">📚 Biblioteca Jurídica</h1>
        <p className="text-sm text-gray-400">Acervo de documentos usado pela IA em cada módulo.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {CATEGORIAS.filter(c => c.id !== 'TODAS').map(cat => (
          <div key={cat.id} className={`rounded-xl border p-3 ${BADGE_COLORS[cat.id]} border-current/20`}>
            <div className="font-bold text-sm">{cat.label}</div>
            <div className="text-xs opacity-70 mt-0.5">{cat.desc}</div>
            <div className="font-bold text-lg mt-1">{books.filter(b => b.categoria === cat.id).length}</div>
          </div>
        ))}
      </div>

      {/* Upload Area */}
      <div className="bg-brand-bg border border-brand-border rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5" /> Inserir Documentos
          </h2>
          
          <div className="flex bg-gray-900 rounded-lg p-1">
            <button 
              onClick={() => setUploadMode('pdf')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${uploadMode === 'pdf' ? 'bg-accent text-black shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <FileText className="w-4 h-4"/> PDFs
            </button>
            <button 
              onClick={() => setUploadMode('manual')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${uploadMode === 'manual' ? 'bg-accent text-black shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <Type className="w-4 h-4"/> Texto Manual
            </button>
          </div>
        </div>

        <div className="md:w-64 mb-4">
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Categoria *</label>
          <div className="relative">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full appearance-none bg-gray-800 border border-brand-border text-white rounded-xl px-4 py-2.5 pr-9 focus:ring-2 focus:ring-accent outline-none text-sm cursor-pointer"
            >
              {CATEGORIAS.filter(c => c.id !== 'TODAS').map(c => (
                <option key={c.id} value={c.id} style={{ background: '#1e293b', color: '#fff' }}>{c.label} — {c.desc}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {uploadMode === 'pdf' ? (
          <form onSubmit={handleUploadPDF} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                isDragging ? 'border-accent bg-accent/5' : 'border-brand-border hover:border-accent/50'
              }`}
            >
              <Upload className={`w-7 h-7 mb-2 ${isDragging ? 'text-accent' : 'text-gray-500'}`} />
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-accent">Clique ou arraste</span> PDFs aqui
              </p>
              <p className="text-xs text-gray-600 mt-0.5">Múltiplos arquivos · máx. 100MB cada</p>
              <input type="file" className="hidden" accept=".pdf" multiple onChange={(e) => addFiles(e.target.files)} />
            </label>

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-semibold">{files.length} arquivo(s):</p>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {files.map(f => (
                    <div key={f.name} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-accent shrink-0" />
                        <span className="text-sm text-white truncate">{f.name}</span>
                        <span className="text-xs text-gray-500 shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                      </div>
                      <button type="button" onClick={() => removeFile(f.name)} className="text-gray-500 hover:text-red-400 ml-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadResults && (
              <div className={`rounded-xl p-3 text-sm flex items-start gap-2 ${uploadResults.errors > 0 ? 'bg-amber-900/20 text-amber-400' : 'bg-green-900/20 text-green-400'}`}>
                {uploadResults.errors > 0 ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                <div><span className="font-semibold">{uploadResults.saved} salvo(s)</span></div>
              </div>
            )}

            <button type="submit" disabled={files.length === 0 || uploading} className="h-11 px-6 bg-accent hover:bg-accent-dark text-black font-bold rounded-xl transition-colors disabled:opacity-40 flex items-center gap-2">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando {files.length} arquivo(s)...</> : <><Upload className="w-4 h-4" /> Enviar PDF(s)</>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUploadManual} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Título da Lei / Documento *</label>
              <input 
                type="text" 
                required
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                placeholder="Ex: Lei nº 14.133, de 1 de abril de 2021"
                className="w-full bg-gray-900 border border-brand-border text-white rounded-xl px-4 py-2.5 outline-none focus:border-accent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Conteúdo do Documento *</label>
              <textarea 
                required
                value={manualContent}
                onChange={e => setManualContent(e.target.value)}
                placeholder="Cole o texto da lei ou do regulamento aqui..."
                className="w-full bg-gray-900 border border-brand-border text-white rounded-xl px-4 py-3 outline-none focus:border-accent text-sm min-h-[200px]"
              />
            </div>
            {uploadResults && (
              <div className="rounded-xl p-3 text-sm flex items-start gap-2 bg-green-900/20 text-green-400">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div><span className="font-semibold">Texto salvo com sucesso!</span></div>
              </div>
            )}
            <button type="submit" disabled={uploading || !manualTitle || !manualContent} className="h-11 px-6 bg-accent hover:bg-accent-dark text-black font-bold rounded-xl transition-colors disabled:opacity-40 flex items-center gap-2">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar Conteúdo</>}
            </button>
          </form>
        )}
      </div>

      {/* Book list, Filters and Pagination */}
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
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleToggleActive(book)} className="p-1 text-gray-600 hover:text-white" title={book.isActive ? "Desativar" : "Ativar"}>
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(book)} className="p-1 text-gray-600 hover:text-accent" title="Editar Conteúdo / Título">
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

      {/* EDIT MODAL */}
      {editModalOpen && editingBook && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-bg border border-brand-border w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-gray-900/50">
              <h3 className="font-bold text-lg text-white">Editar Documento</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
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
                onClick={() => setEditModalOpen(false)}
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
      )}
    </div>
  );
};

export default Library;

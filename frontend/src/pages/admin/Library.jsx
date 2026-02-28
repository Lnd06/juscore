import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Trash2, FileText, Book, Search, Loader2, ChevronDown, X, CheckCircle2, AlertCircle } from 'lucide-react';

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

const Library = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]); // array of files
  const [categoria, setCategoria] = useState('GERAL');
  const [activeFilter, setActiveFilter] = useState('TODAS');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadResults, setUploadResults] = useState(null); // { saved, errors, failures }

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/knowledge', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filteredBooks = activeFilter === 'TODAS' ? books : books.filter(b => b.categoria === activeFilter);

  const handleDelete = async (id) => {
    if (!window.confirm('Remover este documento?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/knowledge/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(prev => prev.filter(b => b.id !== id && String(b._id) !== String(id)));
    } catch (e) { console.error(e); }
  };

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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;
    setUploading(true);
    setUploadResults(null);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('categoria', categoria);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('http://localhost:3000/api/knowledge/upload', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        timeout: 600000 // 10 min for large batches
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

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100 bg-brand-bg min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">📚 Biblioteca Jurídica</h1>
        <p className="text-sm text-gray-400">Acervo de documentos usado pela IA em cada módulo.</p>
      </div>

      {/* Category summary cards */}
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
        <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
          <Upload className="w-5 h-5" /> Adicionar Documentos
        </h2>
        <form onSubmit={handleUpload} className="space-y-4">

          {/* Categoria */}
          <div className="md:w-64">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Categoria *</label>
            <div className="relative">
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full appearance-none bg-gray-800 border border-brand-border text-white rounded-xl px-4 py-2.5 pr-9 focus:ring-2 focus:ring-accent outline-none text-sm cursor-pointer"
              >
                {CATEGORIAS.filter(c => c.id !== 'TODAS').map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#1e293b', color: '#fff' }}>
                    {c.label} — {c.desc}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Drop zone */}
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
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              multiple
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-semibold">{files.length} arquivo(s) selecionado(s):</p>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {files.map(f => (
                  <div key={f.name} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-sm text-white truncate">{f.name}</span>
                      <span className="text-xs text-gray-500 shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                    </div>
                    <button type="button" onClick={() => removeFile(f.name)} className="text-gray-500 hover:text-red-400 ml-2 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload result */}
          {uploadResults && (
            <div className={`rounded-xl p-3 text-sm flex items-start gap-2 ${uploadResults.errors > 0 ? 'bg-amber-900/20 text-amber-400' : 'bg-green-900/20 text-green-400'}`}>
              {uploadResults.errors > 0 ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              <div>
                <span className="font-semibold">{uploadResults.saved} salvo(s)</span>
                {uploadResults.errors > 0 && <span className="ml-2">{uploadResults.errors} com erro: {uploadResults.failures?.map(f => f.file).join(', ')}</span>}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={files.length === 0 || uploading}
            className="h-11 px-6 bg-accent hover:bg-accent-dark text-black font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando {files.length} arquivo(s)...</>
              : <><Upload className="w-4 h-4" /> Enviar {files.length > 0 ? `${files.length} PDF(s)` : 'PDFs'}</>}
          </button>
        </form>
      </div>

      {/* Book list with filter */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-accent" /> Acervo ({filteredBooks.length})
          </h2>
          <div className="flex gap-1 bg-gray-900 rounded-xl p-1 flex-wrap">
            {CATEGORIAS.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === cat.id ? 'bg-accent text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                {cat.label}
                {cat.id !== 'TODAS' && (
                  <span className="ml-1.5 opacity-60">{books.filter(b => b.categoria === cat.id).length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando biblioteca...</div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-brand-border rounded-2xl">
            <Book className="w-10 h-10 mx-auto text-gray-600 mb-3" />
            <p className="text-gray-500 text-sm">Nenhum documento nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => (
              <div key={book.id || book._id} className="bg-brand-bg border border-brand-border rounded-xl p-4 hover:border-accent/40 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[book.categoria] || BADGE_COLORS['GERAL']}`}>
                      {book.categoria || 'GERAL'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(book.id || book._id)}
                    className="p-1.5 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2" title={book.title}>
                  {book.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {new Date(book.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;

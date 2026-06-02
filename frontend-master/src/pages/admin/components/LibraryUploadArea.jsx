/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Type, ChevronDown, X, AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import { CATEGORIAS } from './LibraryConstants';

const LibraryUploadArea = ({ onUploadSuccess }) => {
  const [uploadMode, setUploadMode] = useState('pdf');
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]); 
  const [categoria, setCategoria] = useState('GERAL');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadResults, setUploadResults] = useState(null); 
  
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');

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
      if (onUploadSuccess) onUploadSuccess();
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
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      alert("Falha ao salvar texto manual.");
    } finally {
      setUploading(false);
    }
  };

  return (
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
  );
};

export default LibraryUploadArea;

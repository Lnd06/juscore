/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Input } from '../../../components/ui';
import { useSearchParams } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Search, 
  ExternalLink, 
  Scale, 
  Calendar, 
  User, 
  Edit2, 
  Trash2, 
  X,
  Info,
  Clock,
  MapPin,
  Globe,
  Activity,
  FileCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

const Processes = () => {
  const [searchParams] = useSearchParams();
  const searchQ = searchParams.get('search') || '';
  
  const [processes, setProcesses] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchQ);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);

  // Estados OAB Search (Crawler)
  const [oabQuery, setOabQuery] = useState('');
  const [oabLoading, setOabLoading] = useState(false);
  const [oabResult, setOabResult] = useState(null);
  const [oabError, setOabError] = useState('');
  const [isOabExpanded, setIsOabExpanded] = useState(false);
  
  const initialFormState = {
    numero: '',
    clientId: '',
    tribunal: '',
    vara: '',
    comarca: '',
    fase: 'Conhecimento',
    probabilidadeExito: 'Media',
    status: 'ativo',
    valorCausa: '',
    dataDistribuicao: '',
    dataCitacao: '',
    observacoes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchProcesses();
    fetchClients();
  }, []);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/processes');
      setProcesses(response.data);
    } catch (err) {
      console.error('Erro ao buscar processos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (err) {
      console.error('Erro ao buscar clientes');
    }
  };

  const handleOpenModal = (process = null) => {
    if (process) {
      setEditingProcess(process);
      setFormData({
        numero: process.numero || '',
        clientId: process.clientId || '',
        tribunal: process.tribunal || '',
        vara: process.vara || '',
        comarca: process.comarca || '',
        fase: process.fase || 'Conhecimento',
        probabilidadeExito: process.probabilidadeExito || 'Media',
        status: process.status || 'ativo',
        valorCausa: process.valorCausa || '',
        dataDistribuicao: process.dataDistribuicao || '',
        dataCitacao: process.dataCitacao || '',
        observacoes: process.observacoes || ''
      });
    } else {
      setEditingProcess(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProcess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (!data.clientId) delete data.clientId; // Remove if empty

      if (editingProcess) {
        await axios.put(`/api/processes/${editingProcess.id}`, data);
      } else {
        await axios.post('/api/processes', data);
      }
      fetchProcesses();
      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar processo.');
    }
  };

  const handleDelete = async (id, numero) => {
    if (!window.confirm(`Deseja realmente excluir o processo ${numero}?`)) return;
    try {
      await axios.delete(`/api/processes/${id}`);
      fetchProcesses();
    } catch (err) {
      alert('Erro ao excluir processo.');
    }
  };

  const handleOabSearch = async (e) => {
    e.preventDefault();
    if (!oabQuery.trim()) return;
    setOabLoading(true);
    setOabError('');
    setOabResult(null);
    try {
      const resp = await axios.get(`/api/processes/oab/${oabQuery}`);
      setOabResult(resp.data);
    } catch (err) {
      setOabError(err.response?.data?.error || 'Erro ao realizar consulta judicial.');
    } finally {
      setOabLoading(false);
    }
  };

  const handleImportProcess = async (proc) => {
    try {
      const dataToImport = {
        numero: proc.numero,
        tribunal: proc.tribunal,
        vara: proc.vara,
        comarca: proc.comarca || 'Capital',
        fase: proc.fase || 'Conhecimento',
        status: 'ativo',
        valorCausa: 50000.00,
        dataDistribuicao: proc.dataDistribuicao || new Date().toISOString().split('T')[0],
        observacoes: `Processo importado via Consulta OAB (Crawler Judicial). Partes: Autor - ${proc.partes?.autor || 'N/A'}, Réu - ${proc.partes?.reu || 'N/A'}`
      };

      await axios.post('/api/processes', dataToImport);
      alert(`Processo ${proc.numero} importado com sucesso para seu painel!`);
      fetchProcesses(); // Recarrega a lista
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao importar processo.');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      ativo: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      suspenso: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
      arquivado: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      sentenciado: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || styles.ativo}`}>
        {status}
      </span>
    );
  };

  const filteredProcesses = processes.filter(p => 
    p.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.Client && p.Client.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.comarca && p.comarca.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-accent" />
            Gestão de Processos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Controle seus processos judiciais, números, comarcas e status atualizados.
          </p>
        </div>
        
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Processo
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por número, cliente ou comarca..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ─── Consulta Rápida por OAB (Judicial Crawler Tool) ─── */}
      <Card className="border border-accent/15 dark:border-accent/10 overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300">
        <div 
          onClick={() => setIsOabExpanded(!isOabExpanded)}
          className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-xl text-accent">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base flex items-center gap-2">
                Consulta de Processos Ativos por OAB
                <span className="text-[9px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Tribunais Federais & Estaduais</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Consulte o acervo ativo de qualquer OAB e importe as ações descobertas diretamente para o ERP em 1 clique.
              </p>
            </div>
          </div>
          <div className="text-gray-400">
            {isOabExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        {isOabExpanded && (
          <div className="p-6 border-t border-gray-100 dark:border-gray-700/80 bg-gray-50/20 dark:bg-gray-900/10 space-y-6 animate-in slide-in-from-top-4 duration-200">
            <form onSubmit={handleOabSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="flex-1">
                <Input 
                  required
                  placeholder="Digite a OAB (Ex: SP123456, RJ789123...)"
                  className="bg-white dark:bg-gray-900 focus:ring-accent border-gray-200 dark:border-gray-700 rounded-xl h-11"
                  value={oabQuery}
                  onChange={(e) => setOabQuery(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={oabLoading} className="h-11 px-6 rounded-xl flex items-center gap-2">
                {oabLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {oabLoading ? 'Consultando...' : 'Consultar OAB'}
              </Button>
            </form>

            {/* Alerta de erro */}
            {oabError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 leading-relaxed flex items-start gap-2 max-w-xl">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{oabError}</span>
              </div>
            )}

            {/* Exibição dos resultados */}
            {oabResult && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-accent tracking-widest block">Advogado Localizado</span>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                      {oabResult.lawyerName}
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                        OAB: {oabResult.oab}
                      </span>
                    </h4>
                  </div>

                  {/* Badges de contagem */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 rounded-xl text-center min-w-[110px]">
                      <span className="text-[9px] uppercase font-bold text-green-500 tracking-wider block">Processos Ativos</span>
                      <span className="text-xl font-black text-green-600 dark:text-green-400">{oabResult.activeCount}</span>
                    </div>

                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl text-center min-w-[110px]">
                      <span className="text-[9px] uppercase font-bold text-blue-500 tracking-wider block">Total Acervo</span>
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400">{oabResult.totalCount}</span>
                    </div>

                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center min-w-[120px]">
                      <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">Fonte Dados</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">{oabResult.source === 'local_database' ? 'Base Interna' : 'Crawler CNJ/TJ'}</span>
                    </div>
                  </div>
                </div>

                {/* Lista de Ações Descobertas */}
                <div className="space-y-3">
                  <h5 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    Processos Ativos Encontrados nos Tribunais
                  </h5>

                  <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap text-xs md:text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                          <tr>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px]">Processo</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px]">Tribunal / Comarca</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px]">Fase</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px]">Partes</th>
                            <th className="px-4 py-3 font-bold text-gray-500 uppercase text-[10px] text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                          {oabResult.processes.map((p, idx) => (
                            <tr key={p.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                              <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{p.numero}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{p.tribunal}</span> - {p.vara || 'Vara Cível'} ({p.comarca || 'Capital'})
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-medium text-xs">{p.fase}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Autor:</span> {p.partes?.autor || 'N/A'}<br/>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Réu:</span> {p.partes?.reu || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button 
                                  onClick={() => handleImportProcess(p)}
                                  className="px-3 py-1.5 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 inline-flex hover:scale-[1.02] active:scale-[0.98]"
                                  title="Importar Processo para o ERP"
                                >
                                  <FileCheck className="w-3.5 h-3.5" /> Importar ERP
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Processo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tribunal / Comarca</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fase</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                  </td>
                </tr>
              ) : filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    Nenhum processo cadastrado.
                  </td>
                </tr>
              ) : (
                filteredProcesses.map(proc => (
                  <tr key={proc.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white">{proc.numero}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" /> 
                          Distribuído: {proc.dataDistribuicao ? new Date(proc.dataDistribuicao + 'T00:00:00').toLocaleDateString('pt-BR') : '---'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium dark:text-gray-300">
                          {proc.Client ? proc.Client.nome : 'Sem cliente'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 dark:text-white">{proc.tribunal || '---'} {proc.vara ? `- ${proc.vara}` : ''}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {proc.comarca || '---'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-sm dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{proc.fase || '---'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(proc.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(proc)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
                          title="Editar Processo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(proc.id, proc.numero)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                          title="Excluir Processo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent" />
                {editingProcess ? 'Editar Processo' : 'Novo Processo'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              {/* Seção 1: Identificação Básica */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">1. Identificação Básico</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Número do Processo Público *</label>
                    <Input 
                      required 
                      placeholder="0000000-00.2024.8.00.0000"
                      value={formData.numero}
                      onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cliente Correspondente (CRM)</label>
                    <select 
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent"
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    >
                      <option value="">Selecione um cliente (opcional)</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor Estimado Causa (R$)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.valorCausa}
                      onChange={(e) => setFormData({...formData, valorCausa: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Localização e Instância */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">2. Juízo e Localização</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tribunal</label>
                    <Input 
                      placeholder="Ex: TJSP"
                      value={formData.tribunal}
                      onChange={(e) => setFormData({...formData, tribunal: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Comarca</label>
                    <Input 
                      placeholder="Ex: São Paulo - SP"
                      value={formData.comarca}
                      onChange={(e) => setFormData({...formData, comarca: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Vara / Câmara</label>
                    <Input 
                      placeholder="Ex: 2ª Vara Cível"
                      value={formData.vara}
                      onChange={(e) => setFormData({...formData, vara: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Status e Datas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">3. Acompanhamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Status Geral</label>
                    <select 
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="suspenso">Suspenso</option>
                      <option value="arquivado">Arquivado</option>
                      <option value="sentenciado">Sentenciado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fase Processual</label>
                    <select 
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent"
                      value={formData.fase}
                      onChange={(e) => setFormData({...formData, fase: e.target.value})}
                    >
                      <option value="Conhecimento">Conhecimento</option>
                      <option value="Execução">Execução</option>
                      <option value="Recurso">Recursos</option>
                      <option value="Arquivado">Arquivado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data Distribuição</label>
                    <Input 
                      type="date"
                      value={formData.dataDistribuicao}
                      onChange={(e) => setFormData({...formData, dataDistribuicao: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data Citação</label>
                    <Input 
                      type="date"
                      value={formData.dataCitacao}
                      onChange={(e) => setFormData({...formData, dataCitacao: e.target.value})}
                    />
                  </div>
                </div>
              </div>

               {/* Seção 4: Estratégia e Resumo */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">4. Estratégia Office</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Probabilidade Êxito</label>
                    <select 
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent"
                      value={formData.probabilidadeExito}
                      onChange={(e) => setFormData({...formData, probabilidadeExito: e.target.value})}
                    >
                      <option value="Alta">Probabilidade Alta</option>
                      <option value="Media">Probabilidade Média</option>
                      <option value="Baixa">Probabilidade Baixa</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Observações / Anotações Internas</label>
                    <textarea 
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent min-h-[100px]"
                      placeholder="Resumo do caso, teses aplicáveis, links para arquivos..."
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" className="flex-1">
                  {editingProcess ? 'Salvar Alterações' : 'Criar Processo'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Processes;

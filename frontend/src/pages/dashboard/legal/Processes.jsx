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
  Clock
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
  const [formData, setFormData] = useState({
    numero: '',
    clientId: '',
    tribunal: '',
    vara: '',
    status: 'ativo',
    valorCausa: '',
    dataDistribuicao: '',
    observacoes: ''
  });

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
        status: process.status || 'ativo',
        valorCausa: process.valorCausa || '',
        dataDistribuicao: process.dataDistribuicao || '',
        observacoes: process.observacoes || ''
      });
    } else {
      setEditingProcess(null);
      setFormData({
        numero: '',
        clientId: '',
        tribunal: '',
        vara: '',
        status: 'ativo',
        valorCausa: '',
        dataDistribuicao: '',
        observacoes: ''
      });
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
      alert('Erro ao salvar processo.');
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
    (p.Client && p.Client.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-accent" />
            Gestão de Processos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Controle seus processos judiciais, números, tribunais e status atualizados.
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
          placeholder="Buscar por número ou cliente..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Processo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tribunal / Vara</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                  </td>
                </tr>
              ) : filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
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
                          Distribuído em {proc.dataDistribuicao ? new Date(proc.dataDistribuicao + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}
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
                        <span className="text-sm text-gray-900 dark:text-white">{proc.tribunal || '---'}</span>
                        <span className="text-xs text-gray-500">{proc.vara || '---'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(proc.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(proc)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(proc.id, proc.numero)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500"
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
          <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent" />
                {editingProcess ? 'Editar Processo' : 'Novo Processo'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Número do Processo</label>
                  <Input 
                    required 
                    placeholder="0000000-00.2024.8.00.0000"
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cliente Correspondente</label>
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
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Status</label>
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
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tribunal</label>
                  <Input 
                    placeholder="Ex: TJSP"
                    value={formData.tribunal}
                    onChange={(e) => setFormData({...formData, tribunal: e.target.value})}
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
                
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor da Causa (R$)</label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valorCausa}
                    onChange={(e) => setFormData({...formData, valorCausa: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data de Distribuição</label>
                  <Input 
                    type="date"
                    value={formData.dataDistribuicao}
                    onChange={(e) => setFormData({...formData, dataDistribuicao: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Observações / Anotações</label>
                  <textarea 
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent min-h-[100px]"
                    placeholder="Resumo do caso, últimas movimentações..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
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

import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [clients, setClients] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    descricao: '',
    valorTotal: '',
    vencimento: '',
    status: 'pendente',
    clientId: '',
    processId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [feesRes, clientsRes, processRes] = await Promise.all([
        axios.get('/api/fees', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/clients', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/processes', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setFees(feesRes.data);
      setClients(clientsRes.data);
      setProcesses(processRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (fee = null) => {
    if (fee) {
      setEditingFee(fee);
      setFormData({
        descricao: fee.descricao,
        valorTotal: fee.valorTotal,
        vencimento: fee.vencimento,
        status: fee.status,
        clientId: fee.clientId,
        processId: fee.processId || ''
      });
    } else {
      setEditingFee(null);
      setFormData({ descricao: '', valorTotal: '', vencimento: '', status: 'pendente', clientId: '', processId: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFee(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        valorTotal: parseFloat(formData.valorTotal.toString().replace(',', '.')),
        clientId: parseInt(formData.clientId),
        processId: formData.processId ? parseInt(formData.processId) : null
      };

      if (editingFee) {
        await axios.put(`/api/fees/${editingFee.id}`, dataToSend, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/fees', dataToSend, { headers: { Authorization: `Bearer ${token}` } });
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar honorário:', error);
    }
  };

  const markAsPaid = async (fee) => {
    try {
      const newStatus = fee.status === 'pago' ? 'pendente' : 'pago';
      const dataPagamento = newStatus === 'pago' ? new Date().toISOString().split('T')[0] : null;
      
      await axios.put(`/api/fees/${fee.id}`, { status: newStatus, dataPagamento }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) {
      console.error('Erro ao baixar parcela:', error);
    }
  };

  const getTotalReceivables = () => {
    return fees
      .filter(f => f.status === 'pendente' || f.status === 'atrasado')
      .reduce((acc, curr) => acc + parseFloat(curr.valorTotal), 0);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando financeiro...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-accent" />
            Gestão Financeira
          </h1>
          <p className="text-gray-500 text-sm mt-1">Controle seus honorários, faturamentos e recebimentos.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0">
          <h3 className="text-gray-400 font-medium mb-2">A Receber Total</h3>
          <p className="text-3xl font-bold font-mono text-accent">
            R$ {getTotalReceivables().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente/Processo</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencimento</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {fees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Nenhum lançamento financeiro encontrado.</td>
                </tr>
              ) : (
                fees.map(fee => (
                  <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="p-4">
                      {fee.status === 'pago' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                        </span>
                      ) : fee.status === 'atrasado' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <AlertCircle className="w-3.5 h-3.5" /> Atrasado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Circle className="w-3.5 h-3.5" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-gray-900 dark:text-white cursor-pointer hover:text-accent" onClick={() => handleOpenModal(fee)}>
                      {fee.descricao}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900 dark:text-white">{fee.Client?.nome}</div>
                      {fee.Process && <div className="text-xs text-gray-500">Proc: {fee.Process.numero}</div>}
                    </td>
                    <td className="p-4 font-mono font-medium text-gray-900 dark:text-white">
                      R$ {parseFloat(fee.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(fee.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant={fee.status === 'pago' ? 'outline' : 'default'} 
                        size="sm"
                        onClick={() => markAsPaid(fee)}
                        className={fee.status === 'pago' ? "text-gray-500" : "bg-green-600 hover:bg-green-700 text-white"}
                      >
                        {fee.status === 'pago' ? 'Estornar' : 'Dar Baixa'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Novo/Editar Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingFee ? 'Editar Lançamento' : 'Novo Faturamento'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <Input required value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="Ex: Honorários Iniciais, Consulta..." />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cliente (Obrigatório)</label>
                <select 
                  required
                  value={formData.clientId}
                  onChange={e => setFormData({...formData, clientId: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all dark:text-white"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor Total (R$)</label>
                  <Input required type="number" step="0.01" min="0" value={formData.valorTotal} onChange={e => setFormData({...formData, valorTotal: e.target.value})} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Vencimento</label>
                  <Input required type="date" value={formData.vencimento} onChange={e => setFormData({...formData, vencimento: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vincular a Processo (Opcional)</label>
                <select 
                  value={formData.processId}
                  onChange={e => setFormData({...formData, processId: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all dark:text-white"
                >
                  <option value="">Nenhum processo</option>
                  {processes.filter(p => !formData.clientId || p.clientId === parseInt(formData.clientId))
                    .map(p => <option key={p.id} value={p.id}>{p.numero}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all dark:text-white"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="atrasado">Atrasado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" className="flex-1">{editingFee ? 'Salvar Mudanças' : 'Registrar Honorário'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Fees;

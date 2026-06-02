/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, CheckCircle2, Circle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
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
  const [summary, setSummary] = useState(null);
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    tipo: 'receita',
    categoria: 'Honorários',
    descricao: '',
    valorTotal: '',
    vencimento: '',
    status: 'pendente',
    formaPagamento: 'PIX',
    clientId: '',
    processId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const [feesRes, clientsRes, processRes, summaryRes] = await Promise.all([
        axios.get('/api/finance', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/clients', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/processes', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/finance/summary?month=${today.getMonth() + 1}&year=${today.getFullYear()}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setFees(feesRes.data);
      setClients(clientsRes.data);
      setProcesses(processRes.data);
      setSummary(summaryRes.data);
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
        tipo: fee.tipo || 'receita',
        categoria: fee.categoria || 'Honorários',
        descricao: fee.descricao,
        valorTotal: fee.valorTotal,
        vencimento: fee.vencimento,
        status: fee.status,
        formaPagamento: fee.formaPagamento || 'PIX',
        clientId: fee.clientId || '',
        processId: fee.processId || ''
      });
    } else {
      setEditingFee(null);
      setFormData({ 
        tipo: 'receita', 
        categoria: 'Honorários', 
        descricao: '', 
        valorTotal: '', 
        vencimento: '', 
        status: 'pendente', 
        formaPagamento: 'PIX',
        clientId: '', 
        processId: '' 
      });
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
        clientId: formData.clientId ? parseInt(formData.clientId) : null,
        processId: formData.processId ? parseInt(formData.processId) : null
      };

      if (editingFee) {
        await axios.put(`/api/finance/${editingFee.id}`, dataToSend, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/finance', dataToSend, { headers: { Authorization: `Bearer ${token}` } });
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      alert(error.response?.data?.error || 'Erro ao salvar lançamento.');
    }
  };

  const markAsPaid = async (fee) => {
    try {
      const newStatus = fee.status === 'pago' ? 'pendente' : 'pago';
      const dataPagamento = newStatus === 'pago' ? new Date().toISOString().split('T')[0] : null;
      
      await axios.put(`/api/finance/${fee.id}`, { status: newStatus, dataPagamento }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) {
      console.error('Erro ao baixar parcela:', error);
    }
  };

  if (loading && !fees.length) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-accent" />
            Gestão Financeira (Local)
          </h1>
          <p className="text-gray-500 text-sm mt-1">Controle de honorários, despesas e fluxo de caixa do escritório.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 border-l-4 border-l-green-500 flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1 dark:text-gray-400">Receitas Pagas (Mês)</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {parseFloat(summary?.receitasPagas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-red-500 flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1 dark:text-gray-400">Despesas Pagas (Mês)</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {parseFloat(summary?.despesasPagas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-500 flex flex-col justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0">
          <h3 className="text-gray-400 font-medium mb-2">A Receber Pendente</h3>
          <p className="text-3xl font-bold font-mono text-accent">
            R$ {parseFloat(summary?.receitasPendentes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status / Tipo</th>
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
                    <td className="p-4 flex flex-col items-start gap-1">
                      {fee.status === 'pago' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                        </span>
                      ) : fee.status === 'atrasado' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <AlertCircle className="w-3.5 h-3.5" /> Atrasado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Circle className="w-3.5 h-3.5" /> Pendente
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase ${fee.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                        {fee.tipo}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-accent" onClick={() => handleOpenModal(fee)}>
                        {fee.descricao}
                      </div>
                      <div className="text-xs text-gray-500">{fee.categoria}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900 dark:text-white">{fee.Client?.nome || '---'}</div>
                      <div className="text-xs text-gray-500">{fee.Process ? `Proc: ${fee.Process.numero}` : '---'}</div>
                    </td>
                    <td className="p-4 font-mono font-medium text-gray-900 dark:text-white">
                      R$ {parseFloat(fee.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {fee.vencimento ? new Date(fee.vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '---'}
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant={fee.status === 'pago' ? 'outline' : 'default'} 
                        size="sm"
                        onClick={() => markAsPaid(fee)}
                        className={fee.status === 'pago' ? "text-gray-500" : "bg-green-600 hover:bg-green-700 text-white"}
                      >
                        {fee.status === 'pago' ? 'Estornar' : 'Baixar Pagamento'}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <DollarSign className="w-5 h-5 text-accent" />
                {editingFee ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Lançamento</label>
                  <select 
                    required
                    value={formData.tipo}
                    onChange={e => setFormData({...formData, tipo: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all dark:text-white"
                  >
                    <option value="receita">Receita (Entrada)</option>
                    <option value="despesa">Despesa (Saída)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                  <select 
                    required
                    value={formData.categoria}
                    onChange={e => setFormData({...formData, categoria: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all dark:text-white"
                  >
                    {formData.tipo === 'receita' ? (
                      <>
                        <option value="Honorários Iniciais">Honorários Iniciais</option>
                        <option value="Honorários Finais">Honorários de Êxito</option>
                        <option value="Consulta">Consulta</option>
                        <option value="Serviço Avulso">Serviço Avulso</option>
                      </>
                    ) : (
                      <>
                        <option value="Custas Processuais">Custas Processuais</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Infraestrutura">Infraestrutura / Software</option>
                        <option value="Salário/Equipe">Equipe e Parceiros</option>
                        <option value="Outros">Outros</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <Input required value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="Descreva brevemente..." />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Forma de Pagamento</label>
                  <select 
                    value={formData.formaPagamento}
                    onChange={e => setFormData({...formData, formaPagamento: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all dark:text-white"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Boleto">Boleto (Controle Manual)</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Transferência">Transferência / TED</option>
                    <option value="Dinheiro">Espécie</option>
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
              </div>

               <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Vínculos (Opcional)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cliente <span className="text-xs text-gray-400 font-normal">(Opcional)</span></label>
                      <select 
                        value={formData.clientId}
                        onChange={e => setFormData({...formData, clientId: e.target.value, processId: ''})} // Reset process if client changes
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all dark:text-white"
                      >
                        <option value="">Nenhum cliente específico</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Processo <span className="text-xs text-gray-400 font-normal">(Opcional)</span></label>
                      <select 
                        value={formData.processId}
                        onChange={e => setFormData({...formData, processId: e.target.value})}
                        disabled={!formData.clientId}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all dark:text-white disabled:opacity-50"
                      >
                        <option value="">Nenhum processo</option>
                        {processes.filter(p => p.clientId === parseInt(formData.clientId))
                          .map(p => <option key={p.id} value={p.id}>{p.numero}</option>)}
                      </select>
                    </div>
                  </div>
              </div>

              <div className="flex gap-4 pt-4 mt-6 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" className="flex-1">{editingFee ? 'Salvar Mudanças' : 'Registrar Lançamento'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Fees;

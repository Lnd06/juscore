
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Percent, DollarSign, Calendar, RefreshCcw } from 'lucide-react';
import { Button } from '../../components/ui';
import axios from 'axios';

const AVAILABLE_PLANS = [
  { id: "student_basic", name: "Estudante Basic" },
  { id: "student_pro", name: "Estudante Pro" },
  { id: "lawyer_starter", name: "Advogado Starter" },
  { id: "lawyer_growth", name: "Advogado Growth" },
  { id: "office_master", name: "Escritório Master" }
];

const AdminFinance = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'PERCENTAGE', value: 0, targetType: 'ALL', allowedPlans: [] });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [resCoupons, resStats] = await Promise.all([
        axios.get('/api/admin/coupons', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/finance/stats', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCoupons(resCoupons.data);
      if (resStats.data && resStats.data.monthlyRevenue !== undefined) {
         setMonthlyRevenue(resStats.data.monthlyRevenue);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/coupons', newCoupon, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setNewCoupon({ code: '', type: 'PERCENTAGE', value: 0, targetType: 'ALL', allowedPlans: [] });
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao criar cupom");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if(!window.confirm("Deseja realmente deletar este cupom?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons();
    } catch (err) {
       console.error(err);
    }
  };

  const togglePlan = (planId) => {
    const currentPlans = Array.isArray(newCoupon.allowedPlans) ? newCoupon.allowedPlans : [];
    if (currentPlans.includes(planId)) {
        setNewCoupon({...newCoupon, allowedPlans: currentPlans.filter(p => p !== planId)});
    } else {
        setNewCoupon({...newCoupon, allowedPlans: [...currentPlans, planId]});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento Financeiro</h1>
        <div className="flex gap-2">
            <Button 
                variant="outline"
                onClick={fetchCoupons}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Cupom
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                 <DollarSign className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm text-gray-500">Receita Mensal</p>
                 <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyRevenue)}
                 </h3>
              </div>
           </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                 <Tag className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm text-gray-500">Cupons Ativos</p>
                 <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{coupons.length}</h3>
              </div>
           </div>
        </div>
      </div>

      {/* Coupons List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
           <h2 className="font-bold text-gray-900 dark:text-white">Cupons de Desconto</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desconto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alvo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-purple-500" />
                      <span className="font-mono font-bold text-gray-900 dark:text-white">{coupon.code}</span>
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                   {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `R$ ${coupon.value}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex flex-col">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 w-fit">
                         {coupon.targetType === 'NEW' ? 'Novos Usuários' : coupon.targetType === 'USER' ? 'Usuário Específico' : 'Todos'}
                      </span>
                      {coupon.allowedPlans && coupon.allowedPlans.length > 0 && (
                          <span className="text-[10px] text-gray-500 mt-1">
                             Apenas: {Array.isArray(coupon.allowedPlans) ? coupon.allowedPlans.join(', ') : coupon.allowedPlans}
                          </span>
                      )}
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                   {coupon.usedCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`px-2 py-1 text-xs font-medium rounded-full ${coupon.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {coupon.isActive ? 'Ativo' : 'Inativo'}
                   </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                   <button 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    onClick={() => handleDeleteCoupon(coupon.id)}
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
           <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Criar Novo Cupom</h2>
              
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código do Cupom</label>
                      <input 
                        type="text" 
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 uppercase"
                        placeholder="EX: NATAL20"
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                          <select 
                            value={newCoupon.type}
                            onChange={(e) => setNewCoupon({...newCoupon, type: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          >
                             <option value="PERCENTAGE">Porcentagem (%)</option>
                             <option value="FIXED">Valor Fixo (R$)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
                          <input 
                            type="number" 
                            value={newCoupon.value}
                            onChange={(e) => setNewCoupon({...newCoupon, value: parseFloat(e.target.value)})}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Público Alvo</label>
                      <select 
                        value={newCoupon.targetType}
                        onChange={(e) => setNewCoupon({...newCoupon, targetType: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                         <option value="ALL">Todos os Usuários</option>
                         <option value="NEW">Apenas Novos Cadastros</option>
                         <option value="USER">Usuário Específico</option>
                      </select>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Planos Elegíveis
                          <span className="text-xs text-gray-400 font-normal block">Deixe todos vazios para aplicar a TODOS os planos.</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                          {AVAILABLE_PLANS.map(plan => (
                              <label key={plan.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                                  <input 
                                      type="checkbox" 
                                      checked={Array.isArray(newCoupon.allowedPlans) && newCoupon.allowedPlans.includes(plan.id)}
                                      onChange={() => togglePlan(plan.id)}
                                      className="rounded text-purple-600 focus:ring-purple-500 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                                  />
                                  {plan.name}
                              </label>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button className="flex-1 bg-purple-600 text-white" onClick={handleCreateCoupon}>Criar Cupom</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinance;

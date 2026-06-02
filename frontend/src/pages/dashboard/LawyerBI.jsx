/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Loader, Button, Input } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Activity, FileText, MessageSquare, Eye, Users, Trophy, DollarSign, Clock, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <Card className="p-6 flex items-center gap-4 bg-white dark:bg-gray-900 border-none shadow-sm h-full relative overflow-hidden">
    <div className={`w-14 h-14 rounded-2xl flex shrink-0 items-center justify-center ${colorClass}`}>
      <Icon className="w-7 h-7" />
    </div>
    <div className="z-10 relative">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-black dark:text-white flex items-baseline gap-2">
        {value}
        {subtitle && <span className="text-xs font-normal text-gray-400">{subtitle}</span>}
      </h3>
    </div>
  </Card>
);

const LawyerBI = () => {
  const { user } = useAuth();

  if (user?.parentUserId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Acesso ao BI Jurídico restrito ao administrador do escritório (pagador da assinatura).
      </div>
    );
  }

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [formData, setFormData] = useState({
    tipo: 'comum'
  });
  const [teamList, setTeamList] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [editFormData, setEditFormData] = useState({ nome: '', tipo: 'comum' });

  const plan = user?.subscriptionPlan || 'free';
  const isSimplified = plan === 'lawyer_growth';

  useEffect(() => {
    if (editingMember) {
      setEditFormData({
        nome: editingMember.nome,
        tipo: editingMember.tipo
      });
    }
  }, [editingMember]);

  useEffect(() => {
    const fetchBI = async () => {
      try {
        const res = await axios.get('/api/team/bi-stats');
        setData(res.data);

        // Também busca a lista completa da equipe para a tabela de edição de membros
        const teamRes = await axios.get('/api/team');
        setTeamList(teamRes.data);
      } catch (err) {
        console.error("Erro ao carregar BI:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBI();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader className="w-8 h-8 text-accent animate-spin" /></div>;
  }

  if (!data || !data.aggregate) {
    return (
       <div className="p-8 text-center text-gray-500">
         Seu plano atual não tem permissão para visualizar o BI de Equipe. Adquira o plano Office Master.
       </div>
    );
  }

  const { aggregate, breakdown } = data;
  const { today, roi } = aggregate;

  const chartData = breakdown.map(member => ({
    name: member.nome.split(' ')[0],
    'Petições Geradas': member.docs,
    'Mensagens': member.chats,
    'Visão (Páginas)': member.vision,
    'Cálculos': member.calc,
  }));

  const topPerformer = chartData.length > 0 ? chartData[0] : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const resp = await axios.post('/api/team/invite', { tipo: formData.tipo });
      const token = resp.data.inviteToken;
      const url = `${window.location.origin}/invite/${token}`;
      setInviteLink(url);
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao gerar link.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Link de convite copiado!');
    setIsModalOpen(false);
    setInviteLink('');
  };

  const handleEditMemberSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/api/team/${editingMember.id}`, editFormData);
      alert('Membro atualizado com sucesso!');
      setEditingMember(null);
      
      // Recarrega a lista de equipe
      const teamRes = await axios.get('/api/team');
      setTeamList(teamRes.data);
      
      // Recarrega as estatísticas de BI
      const res = await axios.get('/api/team/bi-stats');
      setData(res.data);
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao atualizar membro.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja remover ${name} da equipe? Ele perderá o acesso instantaneamente.`)) return;
    try {
      await axios.delete(`/api/team/${id}`);
      alert('Membro removido da equipe.');
      
      // Recarrega a lista de equipe
      const teamRes = await axios.get('/api/team');
      setTeamList(teamRes.data);
      
      // Recarrega as estatísticas de BI
      const res = await axios.get('/api/team/bi-stats');
      setData(res.data);
    } catch (err) {
      alert('Erro ao remover membro.');
    }
  };

  const permissionOptions = [
    {
      tipo: 'comum',
      title: 'Visualizador / Estagiário',
      badge: 'Básico',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      description: 'Ideal para estagiários, paralegais e leitores.',
      features: ['Acesso ao Chat AI Geral', 'Pesquisa de Leis & Doutrinas', 'Consulta simples de processos'],
      colorClass: 'hover:border-blue-500/50 dark:hover:border-blue-500/30'
    },
    {
      tipo: 'especial',
      title: 'Advogado / Criador',
      badge: 'Avançado',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      description: 'Ideal para advogados associados e redatores.',
      features: ['Tudo do Básico', 'Gerador de Documentos com IA', 'Gestão de Clientes & Processos', 'Assinador de PDFs & Simulação OAB/TCC'],
      colorClass: 'hover:border-emerald-500/50 dark:hover:border-emerald-500/30'
    },
    {
      tipo: 'admin',
      title: 'Sócio / Administrador',
      badge: 'Máximo',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      description: 'Ideal para sócios e gerentes do escritório.',
      features: ['Tudo do Avançado', 'Financeiro & Fluxo de Caixa', 'BI Jurídico & Métricas da Equipe', 'Gestão de Membros & Configurações'],
      colorClass: 'hover:border-amber-500/50 dark:hover:border-amber-500/30'
    }
  ];

  const getLimits = () => {
    const currentCount = aggregate?.totalTeamMembers || 0;
    if (plan === 'lawyer_growth') return { max: 2, maxInvites: 1, current: currentCount };
    if (plan === 'office_master') return { max: 4, maxInvites: 3, current: currentCount };
    if (plan === 'enterprise') return { max: 999, maxInvites: 999, current: currentCount };
    return { max: 0, maxInvites: 0, current: 0 };
  };

  const limits = getLimits();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white mb-2">
            <Activity className="w-7 h-7 text-accent" />
            Dashboard BI Jurídico
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe o consumo diário de Inteligência Artificial do seu escritório e o valor financeiro economizado.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-medium text-gray-700 dark:text-gray-300">
            {limits.max === 999 ? 'Equipe Ilimitada' : `${limits.current + 1} de ${limits.max} membros da corporação`}
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            disabled={limits.current >= limits.maxInvites}
            className="flex items-center gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Convidar Membro
          </Button>
        </div>
      </div>

      {/* ROI & Inovação Financeira */}
      {roi && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-700 text-white border-none shadow-lg relative overflow-hidden col-span-1 md:col-span-2 lg:col-span-1">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
              <DollarSign className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <p className="text-green-50 font-medium opacity-90 mb-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Economia Financeira (Hoje)
              </p>
              <h3 className="text-4xl font-black mb-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(roi.valorPoupado || 0)}
              </h3>
              <p className="text-xs text-green-100 opacity-80 mt-2">
                *Baseado no honorário médio padrão (R$ 150/hora) x tempo de redação abatido pela I.A.
              </p>
            </div>
          </Card>
          
          <StatCard 
              title="Tempo Salvo da Equipe" 
              value={`${roi.horasPoupadas || 0}h`} 
              subtitle="produtivas ganhas"
              icon={Clock} 
              colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20" 
          />

          {topPerformer && topPerformer['Petições Geradas'] > 0 && (
            <Card className="p-6 bg-gradient-to-r from-accent/10 to-transparent dark:from-accent/5 border border-accent/20 shadow-sm relative overflow-hidden flex items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-accent/20 flex flex-shrink-0 items-center justify-center border-2 border-accent/40 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                 <Trophy className="w-8 h-8 text-accent animate-pulse" />
               </div>
               <div>
                  <p className="text-xs text-accent font-bold uppercase tracking-wider mb-1">Top Draftsman (Destaque)</p>
                  <h3 className="text-xl font-bold dark:text-white leading-tight">{topPerformer.name}</h3>
                  <p className="text-sm text-gray-500">{topPerformer['Petições Geradas']} petições geradas hoje!</p>
               </div>
            </Card>
          )}
        </div>
      )}

      {/* Aggregate Stats (Today) */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Volume de Operações Brutas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Petições Geradas" value={today.documents} icon={FileText} colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" />
          <StatCard title="Mensagens I.A." value={today.chats} icon={MessageSquare} colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20" />
          <StatCard title="Páginas Lidas" value={today.vision} icon={Eye} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20" />
          <StatCard title="Membros" value={aggregate.totalTeamMembers} icon={Users} colorClass="bg-gray-50 text-gray-600 dark:bg-gray-800" />
        </div>
      </div>

      {/* Breakdown by Member Chart - APENAS MASTER/ENTERPRISE */}
      {!isSimplified && (
        <Card className="p-6 bg-white dark:bg-gray-900 border-none shadow-sm mt-8">
          <h3 className="text-lg font-bold dark:text-white mb-6">Ranking de Produtividade por Advogado Associado</h3>
          
          {chartData.length > 0 ? (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                    cursor={{fill: 'rgba(212, 175, 55, 0.05)'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Petições Geradas" stackId="a" fill="#1d4ed8" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Cálculos" stackId="a" fill="#059669" />
                  <Bar dataKey="Visão (Páginas)" stackId="a" fill="#d97706" />
                  <Bar dataKey="Mensagens" stackId="a" fill="#d4af37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              A sua equipe ainda não utilizou a I.A. hoje para gerar gráficos.
            </div>
          )}
        </Card>
      )}

      {/* Tabela de Gerenciamento de Membros */}
      <Card className="p-6 bg-white dark:bg-gray-900 border-none shadow-sm mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold dark:text-white">Membros do Escritório</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gerencie níveis de acesso, edite nomes e monitore a vinculação de cada advogado associado.
            </p>
          </div>
        </div>

        {teamList.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            Nenhum membro ativo além do administrador principal. Clique em "Convidar Membro" para expandir seu escritório.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800/80">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 border-b dark:border-gray-800">Membro</th>
                  <th className="p-4 border-b dark:border-gray-800">Nível de Acesso</th>
                  <th className="p-4 border-b dark:border-gray-800">Ingresso</th>
                  <th className="p-4 border-b dark:border-gray-800 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                {teamList.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent text-sm font-bold shrink-0">
                        {member.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{member.nome}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{member.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        member.tipo === 'admin' 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : member.tipo === 'especial'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {member.tipo === 'admin' ? 'Sócio / Admin' : member.tipo === 'especial' ? 'Advogado / Criador' : 'Visualizador / Estagiário'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingMember(member)}
                          className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-accent hover:text-accent"
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.nome)}
                          className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 border-red-100 dark:border-red-950 dark:hover:bg-red-950/20"
                        >
                          Remover
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Convidar Membro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-white dark:bg-gray-900 border-none shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white border-b dark:border-gray-800 pb-3">
              <UserPlus className="w-5 h-5 text-accent" />
              Gerar Link de Convite
            </h2>
            
            {inviteLink ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Envie este link para seu associado. Ele mesmo preencherá seus dados e a senha de acesso. O link expira em 7 dias.
                </p>
                <div className="flex items-center gap-2">
                  <Input readOnly value={inviteLink} className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" />
                  <Button onClick={copyLink} className="whitespace-nowrap">Copiar Link</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold mb-3 flex items-center gap-2 dark:text-gray-200">
                    Nível de Permissão
                    <Shield className="w-4 h-4 text-accent" />
                  </label>
                  
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    {permissionOptions.map((opt) => {
                      const isSelected = formData.tipo === opt.tipo;
                      return (
                        <div
                          key={opt.tipo}
                          onClick={() => setFormData(prev => ({ ...prev, tipo: opt.tipo }))}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-300 text-left relative overflow-hidden bg-gray-50/50 dark:bg-gray-800/20 ${opt.colorClass} ${
                            isSelected 
                              ? 'border-accent bg-accent/[0.03] dark:bg-accent/[0.02] shadow-md shadow-accent/5 ring-1 ring-accent/20' 
                              : 'border-gray-200 dark:border-gray-800/80'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent shadow-[2px_0_8px_rgba(212,175,55,0.4)]"></div>
                          )}
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`font-bold text-sm transition-colors ${isSelected ? 'text-accent' : 'text-gray-900 dark:text-white'}`}>
                              {opt.title}
                            </h4>
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${opt.badgeColor}`}>
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mb-2">
                            {opt.description}
                          </p>
                          
                          <div className="space-y-1 mt-2 border-t border-gray-200/50 dark:border-gray-800/50 pt-2">
                            {opt.features.map((feat, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 opacity-80" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t dark:border-gray-800">
                  <Button type="button" variant="outline" className="w-1/2 border-gray-200 dark:border-gray-700 dark:text-gray-300" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="w-1/2 animate-pulse font-bold" disabled={submitting}>
                    {submitting ? 'Gerando...' : 'Gerar Link de Convite'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* Modal de Editar Membro */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-white dark:bg-gray-900 border-none shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white border-b dark:border-gray-800 pb-3">
              <Shield className="w-5 h-5 text-accent" />
              Editar Membro da Equipe
            </h2>
            
            <form onSubmit={handleEditMemberSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo
                </label>
                <Input
                  type="text"
                  required
                  value={editFormData.nome}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-3 flex items-center gap-2 dark:text-gray-200">
                  Nível de Permissão
                  <Shield className="w-4 h-4 text-accent" />
                </label>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 scrollbar-thin">
                  {permissionOptions.map((opt) => {
                    const isSelected = editFormData.tipo === opt.tipo;
                    return (
                      <div
                        key={opt.tipo}
                        onClick={() => setEditFormData(prev => ({ ...prev, tipo: opt.tipo }))}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-300 text-left relative overflow-hidden bg-gray-50/50 dark:bg-gray-800/20 ${opt.colorClass} ${
                          isSelected 
                            ? 'border-accent bg-accent/[0.03] dark:bg-accent/[0.02] shadow-md shadow-accent/5 ring-1 ring-accent/20' 
                            : 'border-gray-200 dark:border-gray-800/80'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent shadow-[2px_0_8px_rgba(212,175,55,0.4)]"></div>
                        )}
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-bold text-sm transition-colors ${isSelected ? 'text-accent' : 'text-gray-900 dark:text-white'}`}>
                            {opt.title}
                          </h4>
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${opt.badgeColor}`}>
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mb-2">
                          {opt.description}
                        </p>
                        
                        <div className="space-y-1 mt-2 border-t border-gray-200/50 dark:border-gray-800/50 pt-2">
                          {opt.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 opacity-80" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t dark:border-gray-800">
                <Button type="button" variant="outline" className="w-1/2 border-gray-200 dark:border-gray-700 dark:text-gray-300" onClick={() => setEditingMember(null)}>Cancelar</Button>
                <Button type="submit" className="w-1/2 font-bold" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
};

export default LawyerBI;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Loader } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Activity, FileText, MessageSquare, Eye, Users, Trophy, DollarSign, Clock } from 'lucide-react';
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const plan = user?.subscriptionPlan || 'free';
  const isSimplified = plan === 'lawyer_growth';

  useEffect(() => {
    const fetchBI = async () => {
      try {
        const res = await axios.get('/api/team/bi-stats');
        setData(res.data);
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

  // Chart Formatting
  const chartData = breakdown.map(member => ({
    name: member.nome.split(' ')[0], // Apelido ou primeiro nome
    'Petições Geradas': member.docs,
    'Mensagens': member.chats,
    'Visão (Páginas)': member.vision,
    'Cálculos': member.calc,
  }));

  const topPerformer = chartData.length > 0 ? chartData[0] : null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white mb-2">
          <Activity className="w-7 h-7 text-accent" />
          Dashboard BI Jurídico
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe o consumo diário de Inteligência Artificial do seu escritório e o valor financeiro economizado.
        </p>
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

    </div>
  );
};

export default LawyerBI;

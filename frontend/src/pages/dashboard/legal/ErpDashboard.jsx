import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  CalendarDays,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../../components/ui/Card';
import { Loader } from '../../../components/ui/Loader';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ErpDashboard = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [processesList, setProcessesList] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const startDate = startOfMonth(today).toISOString();
      const endDate = endOfMonth(today).toISOString();

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [financeRes, processRes, txRes, eventsRes] = await Promise.all([
        axios.get(`/api/finance/summary?month=${month}&year=${year}`, config),
        axios.get('/api/processes', config),
        axios.get(`/api/finance?fromDate=${startDate}&toDate=${endDate}`, config),
        axios.get('/api/events', config)
      ]);

      setFinanceSummary(financeRes.data);
      
      const activeProcesses = processRes.data.filter(p => (p.status || '').toLowerCase() === 'ativo');
      setProcessesList(activeProcesses);
      
      // Process Chart Data (Finances)
      const transactions = txRes.data;
      const dailyData = {};
      
      transactions.forEach(tx => {
        const dateStr = format(new Date(tx.dataVencimento || tx.vencimento + 'T00:00:00'), 'dd/MM', { locale: ptBR });
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = { name: dateStr, Receitas: 0, Despesas: 0 };
        }
        
        const valor = Number(tx.valor || tx.valorTotal || 0);
        const formatTipo = (tx.tipo || '').toLowerCase();
        
        if (formatTipo === 'receita') dailyData[dateStr].Receitas += valor;
        if (formatTipo === 'despesa') dailyData[dateStr].Despesas += valor;
      });
      
      const sortedChartData = Object.values(dailyData).sort((a,b) => {
        const [dayA] = a.name.split('/');
        const [dayB] = b.name.split('/');
        return Number(dayA) - Number(dayB);
      });
      
      setChartData(sortedChartData);

      // Events processing
      const now = new Date();
      const futureEvents = eventsRes.data
        .filter(e => !e.concluido && new Date(e.dataHora) >= now && (e.tipo === 'prazo' || e.tipo === 'audiencia'))
        .sort((a,b) => new Date(a.dataHora) - new Date(b.dataHora))
        .slice(0, 5);
      setUpcomingEvents(futureEvents);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard ERP:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader size="lg" className="text-accent" />
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const processPhasesCount = processesList.reduce((acc, proc) => {
    const defaultFase = proc.fase || 'Não Informada';
    acc[defaultFase] = (acc[defaultFase] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(processPhasesCount).map(key => ({
    name: key,
    value: processPhasesCount[key]
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-accent" />
            Dashboard ERP
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm lg:text-base">
            Métricas e relatórios essenciais. Período: <span className="font-semibold capitalize">{format(new Date(), 'MMMM yy', {locale: ptBR})}</span>
          </p>
        </div>
      </div>

      {/* Finance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-green-500 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-green-500/10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Receitas Recebidas</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(financeSummary?.receitasPagas)}
              </h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl max-w-min">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-500 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-yellow-500/10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">A Receber</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(financeSummary?.receitasPendentes)}
              </h3>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl max-w-min">
              <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-red-500 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-red-500/10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Despesas Pagas</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(financeSummary?.despesasPagas)}
              </h3>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl max-w-min">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-blue-500/10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo no Mês (Líquido)</p>
              <h3 className={`text-2xl font-bold mt-1 ${financeSummary?.saldoAtual < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                {formatCurrency(financeSummary?.saldoAtual)}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl max-w-min">
              <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Financial Bar Chart */}
         <Card className="p-6 lg:col-span-2 flex flex-col shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Fluxo Financeiro Diário
            </h2>
            <div className="flex-1 w-full min-h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" fontSize={12} tickMargin={10} stroke="#9CA3AF" />
                    <YAxis 
                      tickFormatter={(val) => `R$ ${val}`} 
                      fontSize={12} 
                      stroke="#9CA3AF" 
                      width={80}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(val) => formatCurrency(val)} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <DollarSign className="w-12 h-12 opacity-50 text-gray-300" />
                  <p>Nenhuma transação movimentada neste mês.</p>
                </div>
              )}
            </div>
         </Card>

         {/* Processes Pie Chart / Status */}
         <Card className="p-6 flex flex-col shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
               <Scale className="w-5 h-5 text-accent" />
               Fases dos Processos (Ativos)
            </h2>
            <div className="flex-1 w-full min-h-[300px] flex flex-col items-center justify-center relative">
              {pieData.length > 0 ? (
                <>
                  <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#1f2937' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend below */}
                  <div className="flex flex-wrap justify-center gap-3 mt-4 w-full">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-full border border-gray-100 dark:border-gray-800">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        {entry.name} <span className="text-gray-400 ml-1">({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <Scale className="w-12 h-12 opacity-50 text-gray-300" />
                  <p className="text-center px-4">Nenhum processo ativo no momento.</p>
                </div>
              )}
            </div>
         </Card>
      </div>

      {/* Upcoming Events & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
               <CalendarDays className="w-5 h-5 text-accent" />
               Próximos Prazos e Audiências
            </h2>
            <div className="flex-1 w-full relative">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map(ev => (
                    <div key={ev.id} className={`p-4 rounded-xl border-l-4 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center ${
                      ev.tipo === 'prazo' ? 'border-l-red-500' : 'border-l-purple-500'
                    }`}>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{ev.titulo}</h4>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {format(new Date(ev.dataHora), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        ev.tipo === 'prazo' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {ev.tipo === 'prazo' ? 'Prazo' : 'Audiência'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 py-10 space-y-2">
                  <CalendarDays className="w-12 h-12 opacity-50 text-gray-300" />
                  <p className="text-center px-4">Nenhum evento urgente nos próximos dias.</p>
                </div>
              )}
            </div>
        </Card>
        
        {/* Placeholder widget for more metrics */}
        <Card className="p-6 flex flex-col shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-accent" />
               Avisos do Sistema
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10 space-y-2">
              <AlertCircle className="w-12 h-12 opacity-50 text-gray-300" />
              <p className="text-center px-4">Sem alertas críticos no momento.</p>
            </div>
        </Card>
      </div>

    </div>
  );
};

export default ErpDashboard;

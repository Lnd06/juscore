import React, { useState, useEffect } from 'react';
import { Button, Input, Card, Modal } from '../../components/ui';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Settings, Activity, ShieldAlert, TrendingUp, AlertTriangle, Eye, MessageSquarePlus, Trash2, Book, Building2, Plus, DollarSign, Save, CheckCircle, Megaphone } from 'lucide-react';
import axios from 'axios';
import AdminAnnouncements from './AdminAnnouncements';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // Default to overview (charts)
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const USERS_PER_PAGE = 25;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("todos"); // Novo estado para o dropdown

  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingViolations, setLoadingViolations] = useState(false);

  // DASHBOARD STATS
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Organizations State
  const [organizations, setOrganizations] = useState([]);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [newOrg, setNewOrg] = useState({ 
    name: '', slug: '', logoUrl: '', primaryColor: '#D4AF37', secondaryColor: '#0f172a',
    faviconUrl: '', supportEmail: '', supportWhatsapp: '', dashboardWelcome: '', footerText: '',
    sidebarColor: '#ffffff', accentColor: '#2563EB', backgroundColor: '#ffffff', borderColor: '#e2e8f0'
  });

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/organizations');
      setOrganizations(res.data);
    } catch (error) {
      console.error('Erro ao buscar organizações', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/organizations', newOrg);
      setIsOrgModalOpen(false);
      setNewOrg({ 
        name: '', slug: '', logoUrl: '', primaryColor: '#D4AF37', secondaryColor: '#0f172a',
        faviconUrl: '', supportEmail: '', supportWhatsapp: '', dashboardWelcome: '', footerText: '',
        sidebarColor: '#ffffff', accentColor: '#2563EB', backgroundColor: '#ffffff', borderColor: '#e2e8f0'
      });
      fetchOrganizations();
      alert('Organização criada com sucesso!');
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao criar organização');
    }
  };

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/organizations/${editingOrg.id}`, editingOrg);
      setEditingOrg(null);
      fetchOrganizations();
      alert('Organização atualizada!');
    } catch (error) {
      alert('Erro ao atualizar organização');
    }
  };

  const handleLogoUpload = async (file, isEditing = false) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await axios.post('/api/admin/organizations/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (isEditing) {
        setEditingOrg({ ...editingOrg, logoUrl: res.data.url });
      } else {
        setNewOrg({ ...newOrg, logoUrl: res.data.url });
      }
    } catch (error) {
      console.error('Erro no upload do logo', error);
      alert('Erro ao fazer upload da imagem');
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers(page);
    if (activeTab === 'violations') fetchViolations();
    if (activeTab === 'organizations') fetchOrganizations();
  }, [activeTab, page]);

  // Fetch users with explicit pagination or current state defaults
  const fetchUsers = async (pageNum = page) => {
    setLoading(true);
    console.log(`🔄 Buscando usuários: Página ${pageNum}, Busca "${searchTerm}", Tipo "${filterType}"`);
    try {
      const res = await axios.get('/api/admin/users', {
        params: { 
            page: pageNum, 
            limit: USERS_PER_PAGE, 
            search: searchTerm,
            type: filterType 
        }
      });
      
      // Handle both old format (array) and new format (object with users) for safety
      if (Array.isArray(res.data)) {
        setUsers(res.data); // Fallback
      } else {
        setUsers(res.data.users);
        setTotalPages(res.data.totalPages);
      }
    } catch (e) { 
        console.error("Erro ao buscar usuários:", e);
        alert("Erro ao buscar dados. Verifique o console.");
    } finally {
        setLoading(false);
    }
  };

  const [selectedViolation, setSelectedViolation] = useState(null);
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);

  const fetchViolations = async () => {
    setLoadingViolations(true);
    try {
      const res = await axios.get('/api/admin/violations');
      setViolations(res.data);
    } catch (error) {
      console.error('Erro ao buscar violações', error);
    } finally {
      setLoadingViolations(false);
    }
  };

  const handleViewViolation = (violation) => {
    setSelectedViolation(violation);
    setIsViolationModalOpen(true);
  };

  // Settings State
  const [contactSettings, setContactSettings] = useState({
    contact_email: '',
    contact_whatsapp: '',
    contact_instagram: '',
    contact_github: ''
  });
  const [libraryEnabled, setLibraryEnabled] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const [termsContent, setTermsContent] = useState('');
  const [loadingTerms, setLoadingTerms] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/admin/settings/contact');
      setContactSettings(res.data);
    } catch (error) {
      console.error('Erro ao buscar configurações', error);
    }
  };

  const fetchLibraryStatus = async () => {
    try {
      const res = await axios.get('/api/admin/settings/library');
      setLibraryEnabled(res.data.enabled);
    } catch (error) {
      console.error('Erro ao buscar status da biblioteca', error);
    }
  };

  const fetchTerms = async () => {
    try {
      const res = await axios.get('/api/public/terms');
      if (res.data.terms !== "Os termos de uso ainda não foram configurados pelo administrador.") {
        setTermsContent(res.data.terms);
      } else {
        setTermsContent(''); // keep empty to show placeholder
      }
    } catch (error) {
      console.error('Erro ao buscar termos de uso', error);
    }
  };

  const handleToggleLibrary = async () => {
    const nextState = !libraryEnabled;
    const confirmMsg = nextState 
      ? "Deseja ATIVAR a Biblioteca Jurídica (MongoDB)? Isso habilitará a busca em arquivos."
      : "Deseja DESATIVAR a Biblioteca Jurídica (MongoDB)? O chat continuará funcionando sem busca em arquivos locais.";
    
    if (window.confirm(confirmMsg)) {
      setLoadingLibrary(true);
      try {
        await axios.post('/api/admin/settings/library', { enabled: nextState });
        setLibraryEnabled(nextState);
        alert(`Biblioteca ${nextState ? 'ativada' : 'desativada'} com sucesso! Reinicie o servidor se necessário.`);
      } catch (error) {
        alert('Erro ao alterar status da biblioteca');
      } finally {
        setLoadingLibrary(false);
      }
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/settings/contact', contactSettings);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações', error);
      alert('Erro ao salvar configurações');
    }
  };

  const handleSaveTerms = async (e) => {
    e.preventDefault();
    setLoadingTerms(true);
    try {
      await axios.post('/api/admin/settings/terms', { terms: termsContent });
      alert('Termos de uso atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar termos', error);
      alert('Erro ao atualizar termos');
    } finally {
      setLoadingTerms(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
      fetchLibraryStatus();
      fetchTerms();
    }
    if (activeTab === 'prices') fetchPrices();
    if (activeTab === 'overview') fetchDashboardStats();
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get('/api/admin/dashboard');
      setDashboardStats(res.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // ====== PRICING STATE ======
  const PLAN_LABELS = [
    { id: 'student_basic',  label: 'Estudante Basic' },
    { id: 'student_pro',    label: 'Estudante Pro' },
    { id: 'lawyer_starter', label: 'Advogado Starter' },
    { id: 'lawyer_growth',  label: 'Advogado Growth' },
    { id: 'office_master',  label: 'Escritório Master' },
  ];

  const DEFAULT_PRICES = {
    student_basic: '17.90', student_pro: '34.00',
    lawyer_starter: '127.00', lawyer_growth: '147.00', office_master: '497.00',
  };

  const [pricingForm, setPricingForm] = useState(DEFAULT_PRICES);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceSaveStatus, setPriceSaveStatus] = useState(null); // 'success' | 'error' | null

  const fetchPrices = async () => {
    try {
      const res = await axios.get('/api/admin/settings/prices');
      setPricingForm({ ...DEFAULT_PRICES, ...res.data });
    } catch (err) {
      console.error('Erro ao buscar preços', err);
    }
  };

  const handleSavePrices = async (e) => {
    e.preventDefault();
    setLoadingPrices(true);
    setPriceSaveStatus(null);
    try {
      await axios.post('/api/admin/settings/prices', pricingForm);
      setPriceSaveStatus('success');
    } catch (err) {
      console.error('Erro ao salvar preços', err);
      setPriceSaveStatus('error');
    } finally {
      setLoadingPrices(false);
      setTimeout(() => setPriceSaveStatus(null), 4000);
    }
  };

  // Helper to format Chart Data
  const getDayName = (dateStr) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    // Ajuste para evitar problemas de fuso horário com ISO strings
    const date = new Date(dateStr + 'T12:00:00');
    return days[date.getDay()];
  };

  const dashboardChartData = dashboardStats?.crescimento?.map(c => ({
    name: getDayName(c.data),
    chats: c.conversas
  })) || [
    { name: 'Seg', chats: 0 }, { name: 'Ter', chats: 0 }, { name: 'Qua', chats: 0 },
    { name: 'Qui', chats: 0 }, { name: 'Sex', chats: 0 }, { name: 'Sáb', chats: 0 }, { name: 'Dom', chats: 0 }
  ];

  const sentimentMapping = {
    'neutro': 'Neutro',
    'urgente': 'Urgente',
    'risco': 'Risco',
    'duvida': 'Dúvida',
    'positivo': 'Positivo',
    'negativo': 'Negativo'
  };

  const dashboardSentimentData = dashboardStats?.sentimentos?.map(s => ({
    name: sentimentMapping[s.sentiment?.toLowerCase()] || s.sentiment || 'Outros',
    value: s.total
  })) || [
    { name: 'Neutro', value: 0 }, { name: 'Urgente', value: 0 }, { name: 'Risco', value: 0 }, { name: 'Dúvida', value: 0 }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#6366f1'];

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white bg-brand-bg dark:bg-juri-900 p-6 rounded-2xl shadow-sm border border-brand-border dark:border-juri-800 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Create User State
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', email: '', senha: '', apelido: '', tipo: 'comum', subscriptionPlan: 'free' });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/users', newUser);
      setIsCreateUserModalOpen(false);
      setNewUser({ nome: '', email: '', senha: '', apelido: '', tipo: 'comum', subscriptionPlan: 'free' });
      fetchUsers();
      alert('Usuário criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar usuário', error);
      alert(error.response?.data?.error || 'Erro ao criar usuário');
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const [historyUser, setHistoryUser] = useState(null);
  const [userConversations, setUserConversations] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const handleHistoryClick = async (user) => {
    setHistoryUser(user);
    setIsHistoryModalOpen(true);
    setUserConversations([]); // Reset
    try {
      const res = await axios.get(`/api/admin/users/${user.id}/conversations`);
      setUserConversations(res.data);
    } catch (error) {
      console.error('Erro ao buscar histórico', error);
      alert('Erro ao buscar histórico do usuário');
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/users/${editingUser.id}`, editingUser);
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Erro ao atualizar usuário', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${user.nome}? Esta ação não pode ser desfeita.`)) {
      try {
        await axios.delete(`/api/admin/users/${user.id}`);
        fetchUsers(); // Refresh list
        alert('Usuário excluído com sucesso');
      } catch (error) {
        console.error('Erro ao excluir usuário', error);
        alert(error.response?.data?.error || 'Erro ao excluir usuário');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
           <p className="text-gray-500 dark:text-gray-400">Visão geral do sistema e gerenciamento</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl max-w-full overflow-x-auto whitespace-nowrap scrollbar-none flex-shrink-0">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeTab === 'overview' ? 'bg-brand-bg dark:bg-juri-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeTab === 'users' ? 'bg-brand-bg dark:bg-juri-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            Usuários
          </button>
          <button 
            onClick={() => setActiveTab('violations')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeTab === 'violations' ? 'bg-brand-bg dark:bg-juri-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            Violações
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeTab === 'settings' ? 'bg-brand-bg dark:bg-juri-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            Configurações
          </button>
          <button 
            onClick={() => setActiveTab('organizations')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeTab === 'organizations' ? 'bg-brand-bg dark:bg-juri-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            Organizações
          </button>
          <button 
            onClick={() => setActiveTab('prices')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeTab === 'prices' ? 'bg-accent text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            💰 Preços
          </button>
          <button 
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${activeTab === 'announcements' ? 'bg-accent text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            <Megaphone className="w-4 h-4 flex-shrink-0" /> Avisos
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Usuários" 
              value={dashboardStats?.estatisticas?.totalUsuarios ?? '...'} 
              icon={Users} 
              color="bg-blue-500 text-blue-500" 
            />
            <StatCard 
              title="Conversas (Hoje)" 
              value={dashboardStats?.estatisticas?.conversasHoje ?? '...'} 
              icon={MessageSquarePlus} 
              color="bg-green-500 text-green-500" 
            />
            <StatCard 
              title="Tokens Gerados (Total)" 
              value={dashboardStats?.estatisticas?.totalRequests ? (dashboardStats.estatisticas.totalRequests > 1000000 ? `${(dashboardStats.estatisticas.totalRequests / 1000000).toFixed(1)}M` : dashboardStats.estatisticas.totalRequests) : '...'} 
              icon={Activity} 
              color="bg-purple-500 text-purple-500" 
            />
            <StatCard 
              title="Violações Flagged" 
              value={violations.length || 0} 
              icon={AlertTriangle} 
              color="bg-red-500 text-red-500" 
            />
          </div>

          <div className="flex justify-center md:justify-end">
            <Button onClick={() => window.location.href = '/secret-admin-access-8822/library'} className="w-full md:w-auto px-8 py-4 text-lg font-bold shadow-xl flex items-center justify-center gap-3 bg-accent-DEFAULT text-white hover:bg-accent-dark transform hover:scale-105 transition-all hover:shadow-2xl border-2 border-white/10">
              <Book className="w-6 h-6" />
              Gerenciar Biblioteca Jurídica
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-white dark:bg-juri-900 bg-brand-bg">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Atividade Semanal</h3>
              <div className="h-64">
                {loadingStats ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="chats" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-juri-900 bg-brand-bg">
               <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Análise de Sentimento</h3>
               <div className="h-64">
                 {loadingStats ? (
                   <div className="h-full flex items-center justify-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                   </div>
                 ) : (
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie 
                         data={dashboardSentimentData} 
                         innerRadius={60} 
                         outerRadius={80} 
                         paddingAngle={5} 
                         dataKey="value"
                       >
                         {dashboardSentimentData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip />
                       <Legend />
                     </PieChart>
                   </ResponsiveContainer>
                 )}
               </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'violations' && (
        <Card>
          <div className="p-6 border-b border-brand-border dark:border-brand-border/50">
             <h3 className="font-bold flex items-center gap-2">
               <ShieldAlert className="w-5 h-5 text-red-500" />
               Alertas de Segurança
             </h3>
          </div>
          {loadingViolations ? (
            <div className="p-8 text-center text-gray-500">Carregando alertas...</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
               {violations.length === 0 ? (
                 <div className="p-8 text-center text-gray-500">Nenhuma violação registrada</div>
               ) : (
                  violations.map(v => (
                    <div key={v.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-xs">{v.flagReason}</span>
                          <span className="text-sm text-gray-500">{new Date(v.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">{v.User?.nome || 'Usuário Desconhecido'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic line-clamp-1">
                          "{Array.isArray(v.mensagens) || typeof v.mensagens === 'string' ? 'Ver detalhes para o conteúdo' : '...'}"
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleViewViolation(v)}>Ver Detalhes</Button>
                    </div>
                  ))
               )}
            </div>
          )}
        </Card>
      )}
  
      {activeTab === 'users' && (
        <Card>
          <div className="p-4 border-b border-brand-border dark:border-brand-border/50">
             <div className="w-full flex flex-col lg:flex-row gap-3">
               <select
                 className="w-full lg:w-48 px-4 py-2 border border-brand-border dark:border-brand-border rounded-xl bg-brand-bg dark:bg-brand-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/20 outline-none flex-shrink-0"
                 value={filterType}
                 onChange={(e) => setFilterType(e.target.value)}
               >
                  <option value="todos">Todos os Planos</option>
                  <option value="free">Grátis (Free)</option>
                  <option value="student_basic">Estudante Basic</option>
                  <option value="student_pro">Estudante Pro</option>
                  <option value="student_master">Estudante Pesquisador</option>
                  <option value="lawyer_starter">Advogado Starter</option>
                  <option value="lawyer_growth">Advogado Growth</option>
                  <option value="office_master">Escritório Master (Admin)</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="comum">Comum (Legacy)</option>
                  <option value="especial">Especial (Legacy)</option>
                  <option value="admin">Admin (Legacy)</option>
                  <option value="master">Master (Legacy)</option>
               </select>

               <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
                 <div className="flex-1 min-w-0">
                   <Input 
                     placeholder="Buscar por nome, email ou apelido..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchUsers(1))}
                     className="w-full"
                   />
                 </div>
                 <div className="flex gap-2 shrink-0">
                   <Button onClick={() => { setPage(1); fetchUsers(1); }} className="flex-1 sm:flex-initial">Buscar</Button>
                   <Button onClick={() => setIsCreateUserModalOpen(true)} className="flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap">
                     <Users className="w-4 h-4" />
                     Novo Usuário
                   </Button>
                 </div>
               </div>
             </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
               <thead className="bg-brand-bg dark:bg-brand-border/20 text-xs uppercase font-semibold text-gray-500">
                 <tr>
                   <th className="px-6 py-4">Nome</th>
                   <th className="px-6 py-4">Email</th>
                   <th className="px-6 py-4">Tipo</th>
                   <th className="px-6 py-4">Plano</th>
                   <th className="px-6 py-4">Data Cadastro</th>
                   <th className="px-6 py-4 text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-brand-border dark:divide-brand-border/50">
                {loading ? (
                   <tr>
                     <td colSpan="6" className="p-8 text-center text-gray-500">
                       <div className="flex justify-center items-center gap-2">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                         Carregando...
                       </div>
                     </td>
                   </tr>
                ) : users.length === 0 ? (
                   <tr>
                     <td colSpan="6" className="p-8 text-center text-gray-500">
                       Nenhum usuário encontrado para "{searchTerm}"
                     </td>
                   </tr>
                ) : (
                  users.map((user) => (
                  <tr key={user.id} className="hover:bg-brand-border/10 dark:hover:bg-brand-border/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xs font-bold">
                        {user.nome?.charAt(0).toUpperCase()}
                      </div>
                      {user.nome}
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                         user.tipo === 'master' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800' :
                         user.tipo === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                         user.tipo === 'especial' ? 'bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent' :
                         'bg-brand-border/20 text-gray-700 dark:text-gray-300'
                      }`}>
                        {user.tipo === 'comum' ? 'Associado' : user.tipo === 'especial' ? 'Adv. Titular' : user.tipo.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium uppercase tracking-wider">
                        {user.subscriptionPlan === 'free' ? 'Grátis' : 
                         user.subscriptionPlan === 'student_basic' ? 'Estudante Basic' : 
                         user.subscriptionPlan === 'student_pro' ? 'Estudante Pro' : 
                         user.subscriptionPlan === 'student_master' ? 'Estudante Pesquisador' : 
                         user.subscriptionPlan === 'lawyer_starter' ? 'Advogado Starter' : 
                         user.subscriptionPlan === 'lawyer_growth' ? 'Advogado Growth' : 
                         user.subscriptionPlan === 'office_master' ? 'Escritório Master' : 
                         user.subscriptionPlan || 'Grátis'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                       <Button 
                        size="sm" 
                        variant="ghost" 
                        icon={Activity} 
                        title="Ver Histórico"
                        onClick={() => handleHistoryClick(user)} 
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        icon={Settings} 
                        title="Editar"
                        onClick={() => handleEditClick(user)} 
                      />
                       <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Excluir Usuário"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="p-4 border-t border-brand-border dark:border-brand-border flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4">
               <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
             </div>
             <div className="flex gap-2">
               <Button 
                 size="sm" 
                 variant="outline" 
                 disabled={page === 1}
                 onClick={() => setPage(p => Math.max(1, p - 1))}
               >
                 Anterior
               </Button>
               <Button 
                 size="sm" 
                 variant="outline" 
                 disabled={page === totalPages}
                 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
               >
                 Próxima
               </Button>
             </div>
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card className="max-w-2xl">
            <div className="p-6 border-b border-brand-border dark:border-brand-border/50 mb-6">
               <h3 className="font-bold flex items-center gap-2 text-lg">
                 <Settings className="w-5 h-5 text-gray-500" />
                 Configurações de Contato
               </h3>
               <p className="text-sm text-gray-500 mt-1">Gerencie os links exibidos na página "Fale Conosco"</p>
            </div>
            <form onSubmit={handleSaveSettings} className="p-6 pt-0 space-y-6">
              <Input 
                label="Email de Contato" 
                value={contactSettings.contact_email} 
                onChange={(e) => setContactSettings({...contactSettings, contact_email: e.target.value})}
                placeholder="ex: contato@juscore.ai"
              />
              <Input 
                label="WhatsApp (Apenas números)" 
                value={contactSettings.contact_whatsapp} 
                onChange={(e) => setContactSettings({...contactSettings, contact_whatsapp: e.target.value})}
                placeholder="ex: 5511999999999"
              />
              <Input 
                label="Link do Instagram" 
                value={contactSettings.contact_instagram} 
                onChange={(e) => setContactSettings({...contactSettings, contact_instagram: e.target.value})}
                placeholder="https://instagram.com/..."
              />
              <Input 
                label="Link do GitHub" 
                value={contactSettings.contact_github} 
                onChange={(e) => setContactSettings({...contactSettings, contact_github: e.target.value})}
                placeholder="https://github.com/..."
              />
              <div className="flex justify-end pt-4 border-t border-brand-border dark:border-brand-border/50">
                 <Button type="submit">Salvar Configurações</Button>
              </div>
            </form>
          </Card>

          {/* Legacy MongoDB integration card removed */}

          <Card className="max-w-4xl">
            <div className="p-6 border-b border-brand-border dark:border-brand-border/50 mb-6">
               <h3 className="font-bold flex items-center gap-2 text-lg">
                 <Book className="w-5 h-5 text-gray-500" />
                 Termos de Uso e Privacidade
               </h3>
               <p className="text-sm text-gray-500 mt-1">Configure o texto exibido na página pública de Termos de Uso.</p>
            </div>
            <form onSubmit={handleSaveTerms} className="p-6 pt-0 space-y-6">
              <div className="flex flex-col gap-2">
                <textarea
                  className="w-full min-h-[400px] p-4 bg-brand-bg dark:bg-juri-900 border border-brand-border dark:border-brand-border/50 rounded-xl focus:ring-2 focus:ring-accent/20 outline-none text-gray-700 dark:text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-wrap"
                  value={termsContent}
                  onChange={(e) => setTermsContent(e.target.value)}
                  placeholder="Escreva seus Termos de Uso aqui... Você pode usar formatação básica."
                  required
                />
              </div>
              <div className="flex justify-end pt-4 border-t border-brand-border dark:border-brand-border/50">
                 <Button type="submit" disabled={loadingTerms}>
                    {loadingTerms ? 'Salvando...' : 'Salvar Termos de Uso'}
                 </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {activeTab === 'prices' && (
        <Card>
          <div className="p-6 border-b border-brand-border dark:border-brand-border/50">
            <h3 className="font-bold flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-accent" />
              Gerenciamento de Preços
            </h3>
            <p className="text-sm text-gray-500 mt-1">Alterações refletem imediatamente na Landing Page e na tela de Assinatura.</p>
          </div>
          <form onSubmit={handleSavePrices} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PLAN_LABELS.map(({ id, label }) => (
                <div key={id} className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricingForm[id] || ''}
                      onChange={(e) => setPricingForm(prev => ({ ...prev, [id]: e.target.value }))}
                      className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-juri-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-4">
              <button
                type="submit"
                disabled={loadingPrices}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent-dark transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
              >
                <Save className="w-4 h-4" />
                {loadingPrices ? 'Salvando...' : 'Salvar Preços'}
              </button>
              {priceSaveStatus === 'success' && (
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium animate-in fade-in">
                  <CheckCircle className="w-4 h-4" /> Preços salvos com sucesso!
                </span>
              )}
              {priceSaveStatus === 'error' && (
                <span className="text-red-500 text-sm font-medium">Erro ao salvar. Tente novamente.</span>
              )}
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'organizations' && (
        <Card>
          <div className="p-6 border-b border-brand-border dark:border-brand-border/50 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              Gestão White Label
            </h3>
            <Button 
              onClick={() => setIsOrgModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Organização
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-brand-border/5 dark:bg-brand-border/10 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-6 py-4">Organização</th>
                  <th className="px-6 py-4 text-center">Cores Branding</th>
                  <th className="px-6 py-4 text-center">Usuários</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border dark:divide-brand-border/50">
                {organizations.length === 0 ? (
                   <tr>
                     <td colSpan="5" className="p-8 text-center text-gray-500">Nenhuma organização cadastrada.</td>
                   </tr>
                ) : (
                  organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-white dark:bg-gray-700 flex items-center justify-center p-1 border border-gray-100 dark:border-gray-600 shadow-sm overflow-hidden">
                            {org.logoUrl ? (
                              <img src={org.logoUrl} alt={org.name} className="w-full h-full object-contain" />
                            ) : (
                              <Building2 className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">{org.name}</div>
                            <div className="text-xs text-gray-500">/{org.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full border border-white dark:border-gray-600 shadow-lg" style={{ backgroundColor: org.primaryColor }} />
                            <span className="text-[10px] mt-1 opacity-60">Primária</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full border border-white dark:border-gray-600 shadow-lg" style={{ backgroundColor: org.secondaryColor }} />
                            <span className="text-[10px] mt-1 opacity-60">Secundária</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {org.users?.length || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            org.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {org.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingOrg(org)}
                          icon={Settings}
                          title="Configurar Branding"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'announcements' && (
        <AdminAnnouncements />
      )}

      {/* History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Histórico de: ${historyUser?.nome}`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {userConversations.length === 0 ? (
             <p className="text-center text-gray-500 py-4">Nenhuma conversa encontrada.</p>
          ) : (
            userConversations.map((chat) => (
              <div key={chat.id} className="p-3 border border-brand-border dark:border-brand-border/50 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{chat.titulo || 'Sem título'}</h4>
                <p className="text-xs text-gray-500 mb-2">{new Date(chat.createdAt).toLocaleString()}</p>
                <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {/* Simplistic preview of messages if array */}
                  {Array.isArray(chat.mensagens) && chat.mensagens.length > 0 
                    ? (Array.isArray(chat.mensagens[0].content) 
                        ? chat.mensagens[0].content.find(c => c.type === 'text')?.text || 'Imagem enviada'
                        : chat.mensagens[0].content)
                    : 'Sem mensagens'}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end pt-4">
           <Button onClick={() => setIsHistoryModalOpen(false)}>Fechar</Button>
        </div>
      </Modal>

      {/* Violation Details Modal */}
      <Modal
        isOpen={isViolationModalOpen}
        onClose={() => setIsViolationModalOpen(false)}
        title="Detalhes da Violação"
      >
        {selectedViolation && (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
              <div className="flex justify-between items-start mb-2">
                 <span className="font-bold text-red-700 dark:text-red-400">{selectedViolation.flagReason || 'Violação Genérica'}</span>
                 <span className="text-xs text-red-600 dark:text-red-400 opacity-75">{new Date(selectedViolation.updatedAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                <strong>Usuário:</strong> {selectedViolation.User?.nome} ({selectedViolation.User?.email})
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mensagens da Conversa</h4>
              <div className="bg-brand-bg dark:bg-brand-bg/50 rounded-lg p-3 max-h-60 overflow-y-auto space-y-3">
                 {(Array.isArray(selectedViolation.mensagens) ? selectedViolation.mensagens : JSON.parse(selectedViolation.mensagens || '[]')).map((msg, i) => (
                   <div key={i} className={`p-2 rounded ${msg.role === 'user' ? 'bg-white dark:bg-gray-700 border border-brand-border dark:border-brand-border/50' : 'bg-transparent pl-4 border-l-2 border-primary-500'}`}>
                     <p className="text-xs font-bold text-gray-500 uppercase mb-1">{msg.role}</p>
                     <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                       {Array.isArray(msg.content) 
                         ? msg.content.find(c => c.type === 'text')?.text || '[Imagem]' 
                         : msg.content}
                     </p>
                   </div>
                 ))}
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => setIsViolationModalOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit User Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Usuário"
      >
        {editingUser && (
          <form onSubmit={handleSaveUser} className="space-y-4">
             <Input 
                label="Nome" 
                value={editingUser.nome} 
                onChange={(e) => setEditingUser({...editingUser, nome: e.target.value})} 
             />
             <Input 
                label="Email" 
                value={editingUser.email} 
                onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
             />
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Acesso</label>
               <select 
                 className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                 value={editingUser.tipo || 'comum'}
                 onChange={(e) => setEditingUser({...editingUser, tipo: e.target.value})}
               >
                  <option value="comum">Comum (Usuário Padrão)</option>
                  <option value="especial">Especial (Legacy)</option>
                  <option value="admin">Administrador</option>
                  <option value="master">Master (Acesso Reduzido)</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plano de Assinatura</label>
               <select 
                 className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                 value={editingUser.subscriptionPlan || 'free'}
                 onChange={(e) => setEditingUser({...editingUser, subscriptionPlan: e.target.value})}
               >
                  <option value="free">Grátis (Free)</option>
                  <option value="student_basic">Estudante Basic</option>
                  <option value="student_pro">Estudante Pro</option>
                  <option value="student_master">Estudante Pesquisador</option>
                  <option value="lawyer_starter">Advogado Starter</option>
                  <option value="lawyer_growth">Advogado Growth</option>
                  <option value="office_master">Escritório Master (Admin)</option>
                  <option value="enterprise">Enterprise</option>
               </select>
             </div>
             <Input 
                label="Preço Customizado (R$)" 
                type="number"
                step="0.01"
                value={editingUser.subscriptionPrice || ''} 
                onChange={(e) => setEditingUser({...editingUser, subscriptionPrice: e.target.value})} 
                placeholder="Padrão do plano se vazio"
              />
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organização (White Label)</label>
               <select 
                 className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                 value={editingUser.organizationId || ''}
                 onChange={(e) => setEditingUser({...editingUser, organizationId: e.target.value || null})}
               >
                  <option value="">Nenhuma (Padrão JusCore)</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
               </select>
             </div>
             <div className="flex justify-end gap-2 pt-4">
               <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
               <Button type="submit">Salvar</Button>
             </div>
          </form>
        )}
      </Modal>

      {/* Create User Modal */}
      <Modal 
        isOpen={isCreateUserModalOpen} 
        onClose={() => setIsCreateUserModalOpen(false)}
        title="Novo Usuário"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
           <Input 
              label="Nome" 
              value={newUser.nome} 
              onChange={(e) => setNewUser({...newUser, nome: e.target.value})} 
              required
           />
           <Input 
              label="Apelido" 
              value={newUser.apelido} 
              onChange={(e) => setNewUser({...newUser, apelido: e.target.value})} 
              required
           />
           <Input 
              label="Email" 
              type="email"
              value={newUser.email} 
              onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
              required
           />
           <Input 
              label="Senha" 
              type="password"
              value={newUser.senha} 
              onChange={(e) => setNewUser({...newUser, senha: e.target.value})} 
              required
           />
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Acesso</label>
             <select 
               className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
               value={newUser.tipo}
               onChange={(e) => setNewUser({...newUser, tipo: e.target.value})}
             >
                <option value="comum">Comum (Usuário Padrão)</option>
                <option value="especial">Especial (Legacy)</option>
                <option value="admin">Administrador</option>
                <option value="master">Master</option>
             </select>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plano de Assinatura</label>
             <select 
               className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
               value={newUser.subscriptionPlan}
               onChange={(e) => setNewUser({...newUser, subscriptionPlan: e.target.value})}
             >
                <option value="free">Grátis (Free)</option>
                <option value="student_basic">Estudante Basic</option>
                <option value="student_pro">Estudante Pro</option>
                <option value="student_master">Estudante Pesquisador</option>
                <option value="lawyer_starter">Advogado Starter</option>
                <option value="lawyer_growth">Advogado Growth</option>
                <option value="office_master">Escritório Master (Admin)</option>
                <option value="enterprise">Enterprise</option>
             </select>
           </div>
           <Input 
                label="Preço Customizado (R$)" 
                type="number"
                step="0.01"
                value={newUser.subscriptionPrice || ''} 
                onChange={(e) => setNewUser({...newUser, subscriptionPrice: e.target.value})} 
                placeholder="Padrão do plano se vazio"
              />
           <div className="flex justify-end gap-2 pt-4">
             <Button type="button" variant="ghost" onClick={() => setIsCreateUserModalOpen(false)}>Cancelar</Button>
             <Button type="submit">Criar Usuário</Button>
           </div>
        </form>
      </Modal>
      {/* Modal Criar Organização */}
      <Modal 
        isOpen={isOrgModalOpen} 
        onClose={() => setIsOrgModalOpen(false)}
        title="Nova Organização"
      >
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <Input 
            label="Nome da Organização" 
            value={newOrg.name} 
            onChange={(e) => setNewOrg({...newOrg, name: e.target.value})} 
            required 
          />
          <Input 
            label="Slug (URL)" 
            value={newOrg.slug} 
            onChange={(e) => setNewOrg({...newOrg, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} 
            placeholder="ex: escritório-pontes"
            required 
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo da Organização</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
                {newOrg.logoUrl ? (
                  <img src={newOrg.logoUrl} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e.target.files[0], false)}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/80 cursor-pointer"
                />
                <Input 
                  value={newOrg.logoUrl} 
                  onChange={(e) => setNewOrg({...newOrg, logoUrl: e.target.value})} 
                  placeholder="Ou cole a URL da imagem..."
                  className="text-xs"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Primária (Ação)" 
              type="color"
              value={newOrg.primaryColor} 
              onChange={(e) => setNewOrg({...newOrg, primaryColor: e.target.value})} 
            />
            <Input 
              label="Secundária (Sombrias)" 
              type="color"
              value={newOrg.secondaryColor} 
              onChange={(e) => setNewOrg({...newOrg, secondaryColor: e.target.value})} 
            />
            <Input 
              label="Fundo do Sidebar" 
              type="color"
              value={newOrg.sidebarColor} 
              onChange={(e) => setNewOrg({...newOrg, sidebarColor: e.target.value})} 
            />
            <Input 
              label="Cor de Destaque" 
              type="color"
              value={newOrg.accentColor} 
              onChange={(e) => setNewOrg({...newOrg, accentColor: e.target.value})} 
            />
            <Input 
              label="Fundo do Site" 
              type="color"
              value={newOrg.backgroundColor} 
              onChange={(e) => setNewOrg({...newOrg, backgroundColor: e.target.value})} 
            />
            <Input 
              label="Cor das Bordas" 
              type="color"
              value={newOrg.borderColor} 
              onChange={(e) => setNewOrg({...newOrg, borderColor: e.target.value})} 
            />
          </div>

          <div className="border-t border-brand-border dark:border-brand-border/50 pt-4 mt-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Configurações Avançadas</h4>
            <div className="space-y-4">
              <Input 
                label="Favicon URL" 
                value={newOrg.faviconUrl} 
                onChange={(e) => setNewOrg({...newOrg, faviconUrl: e.target.value})} 
                placeholder="Ícone da aba do navegador"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Email de Suporte" 
                  value={newOrg.supportEmail} 
                  onChange={(e) => setNewOrg({...newOrg, supportEmail: e.target.value})} 
                  placeholder="contato@exemplo.com"
                />
                <Input 
                  label="WhatsApp de Suporte" 
                  value={newOrg.supportWhatsapp} 
                  onChange={(e) => setNewOrg({...newOrg, supportWhatsapp: e.target.value})} 
                  placeholder="55..."
                />
              </div>
              <Input 
                label="Boas-vindas (Dashboard)" 
                value={newOrg.dashboardWelcome} 
                onChange={(e) => setNewOrg({...newOrg, dashboardWelcome: e.target.value})} 
                placeholder="Ex: Bem-vindo ao Portal Jurídico"
              />
              <Input 
                label="Texto do Rodapé (Copyright)" 
                value={newOrg.footerText} 
                onChange={(e) => setNewOrg({...newOrg, footerText: e.target.value})} 
                placeholder="Ex: © 2024 Advocacia Silva"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOrgModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Organização */}
      <Modal 
        isOpen={!!editingOrg} 
        onClose={() => setEditingOrg(null)}
        title="Configurar Organização"
      >
        {editingOrg && (
          <form onSubmit={handleSaveOrg} className="space-y-4">
            <Input 
              label="Nome" 
              value={editingOrg.name} 
              onChange={(e) => setEditingOrg({...editingOrg, name: e.target.value})} 
            />
            <Input 
              label="Slug" 
              value={editingOrg.slug} 
              onChange={(e) => setEditingOrg({...editingOrg, slug: e.target.value})} 
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo da Organização</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
                  {editingOrg.logoUrl ? (
                    <img src={editingOrg.logoUrl} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e.target.files[0], true)}
                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/80 cursor-pointer"
                  />
                  <Input 
                    value={editingOrg.logoUrl} 
                    onChange={(e) => setEditingOrg({...editingOrg, logoUrl: e.target.value})} 
                    placeholder="Ou cole a URL da imagem..."
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Primária (Ação)" 
                type="color"
                value={editingOrg.primaryColor} 
                onChange={(e) => setEditingOrg({...editingOrg, primaryColor: e.target.value})} 
              />
              <Input 
                label="Secundária (Sombrias)" 
                type="color"
                value={editingOrg.secondaryColor} 
                onChange={(e) => setEditingOrg({...editingOrg, secondaryColor: e.target.value})} 
              />
              <Input 
                label="Fundo do Sidebar" 
                type="color"
                value={editingOrg.sidebarColor || '#ffffff'} 
                onChange={(e) => setEditingOrg({...editingOrg, sidebarColor: e.target.value})} 
              />
              <Input 
                label="Cor de Destaque" 
                type="color"
                value={editingOrg.accentColor || '#1E3A8A'} 
                onChange={(e) => setEditingOrg({...editingOrg, accentColor: e.target.value})} 
              />
              <Input 
                label="Fundo do Site" 
                type="color"
                value={editingOrg.backgroundColor || '#ffffff'} 
                onChange={(e) => setEditingOrg({...editingOrg, backgroundColor: e.target.value})} 
              />
              <Input 
                label="Cor das Bordas" 
                type="color"
                value={editingOrg.borderColor || '#e2e8f0'} 
                onChange={(e) => setEditingOrg({...editingOrg, borderColor: e.target.value})} 
              />
            </div>

            <div className="border-t border-brand-border dark:border-brand-border/50 pt-4 mt-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Configurações Avançadas</h4>
              <div className="space-y-4">
                <Input 
                  label="Favicon URL" 
                  value={editingOrg.faviconUrl || ''} 
                  onChange={(e) => setEditingOrg({...editingOrg, faviconUrl: e.target.value})} 
                  placeholder="Ícone da aba do navegador"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Email de Suporte" 
                    value={editingOrg.supportEmail || ''} 
                    onChange={(e) => setEditingOrg({...editingOrg, supportEmail: e.target.value})} 
                    placeholder="contato@exemplo.com"
                  />
                  <Input 
                    label="WhatsApp de Suporte" 
                    value={editingOrg.supportWhatsapp || ''} 
                    onChange={(e) => setEditingOrg({...editingOrg, supportWhatsapp: e.target.value})} 
                    placeholder="55..."
                  />
                </div>
                <Input 
                  label="Boas-vindas (Dashboard)" 
                  value={editingOrg.dashboardWelcome || ''} 
                  onChange={(e) => setEditingOrg({...editingOrg, dashboardWelcome: e.target.value})} 
                  placeholder="Ex: Bem-vindo ao Portal Jurídico"
                />
                <Input 
                  label="Texto do Rodapé (Copyright)" 
                  value={editingOrg.footerText || ''} 
                  onChange={(e) => setEditingOrg({...editingOrg, footerText: e.target.value})} 
                  placeholder="Ex: © 2024 Advocacia Silva"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={editingOrg.active} 
                onChange={(e) => setEditingOrg({...editingOrg, active: e.target.checked})} 
                id="org-active"
              />
              <label htmlFor="org-active">Organização Ativa</label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setEditingOrg(null)}>Cancelar</Button>
              <Button type="submit">Atualizar</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;

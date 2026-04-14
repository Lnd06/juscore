import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar as CalendarIcon, Clock, CheckCircle2, Circle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarOverrides.css';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const Events = () => {
  const [events, setEvents] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const { user, token, setUser } = useAuth();
  const [googleStatus, setGoogleStatus] = useState(!!user?.googleId);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'tarefa',
    dataHora: '',
    processId: '',
    observacoes: ''
  });
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, processRes] = await Promise.all([
        axios.get('/api/events', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/processes', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setEvents(eventsRes.data);
      setProcesses(processRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        titulo: event.titulo,
        tipo: event.tipo,
        dataHora: new Date(event.dataHora).toISOString().slice(0, 16),
        processId: event.processId || '',
        observacoes: event.observacoes || ''
      });
    } else {
      setEditingEvent(null);
      setFormData({ titulo: '', tipo: 'tarefa', dataHora: '', processId: '', observacoes: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleGoogleConnect = async () => {
    try {
      // Limpa resultado anterior
      localStorage.removeItem('google_auth_result');

      // 1. Abre a janela de popup *antes* de fazer a requisição (Síncrono)
      // Isso evita que navegadores bloqueiem o popup ou percam o foco
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        '', 
        'GoogleAuth', 
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        alert('Popup bloqueado pelo navegador. Por favor, permita popups para este site.');
        return;
      }

      // 2. Busca a URL do backend
      const res = await axios.get('/api/auth/google/url?t=' + Date.now(), { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const { url } = res.data;
      
      // 3. Atualiza a URL do popup
      if (url && typeof url === 'string' && url.startsWith('https://')) {
        popup.location.href = url;
      } else {
        popup.close();
        alert('Erro ao carregar link do Google. Tente novamente.');
        return;
      }

      // Polling de localStorage (mesma estratégia do Login.jsx)
      const poll = setInterval(() => {
        try {
          const raw = localStorage.getItem('google_auth_result');
          if (raw) {
            const payload = JSON.parse(raw);
            localStorage.removeItem('google_auth_result');
            clearInterval(poll);
            if (payload.token && payload.user) {
              setGoogleStatus(true);
              if (setUser) setUser(prev => ({ ...prev, googleId: payload.user.googleId }));
            }
          }
          if (popup.closed) { clearInterval(poll); }
        } catch { clearInterval(poll); }
      }, 500);
      setTimeout(() => clearInterval(poll), 120000);
    } catch (err) {
      console.error('Erro ao iniciar conexão com Google:', err);
    }
  };

  const handleGoogleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await axios.post('/api/events/sync-google', {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
    } catch (err) {
      console.error('Erro ao sincronizar com Google Agenda:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!window.confirm('Deseja desconectar o Google Agenda?')) return;
    try {
      await axios.post('/api/auth/google/disconnect', {}, { headers: { Authorization: `Bearer ${token}` } });
      setGoogleStatus(false);
      if (setUser) setUser(prev => ({ ...prev, googleId: null }));
    } catch (err) {
      console.error('Erro ao desconectar Google:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        processId: formData.processId ? parseInt(formData.processId) : null
      };

      if (editingEvent) {
        await axios.put(`/api/events/${editingEvent.id}`, dataToSend, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/events', dataToSend, { headers: { Authorization: `Bearer ${token}` } });
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
    }
  };

  const toggleStatus = async (event) => {
    try {
      await axios.put(`/api/events/${event.id}`, { concluido: !event.concluido }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) {
      console.error('Erro ao alternar status do evento:', error);
    }
  };

  const getTypeColor = (tipo) => {
    switch (tipo) {
      case 'prazo': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200';
      case 'audiencia': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200';
      case 'reuniao': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200';
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando agenda...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-accent" />
            Agenda e Prazos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie seus compromissos e prazos processuais.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!googleStatus ? (
            <Button 
              onClick={handleGoogleConnect} 
              variant="outline" 
              className="flex items-center gap-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Conectar Google Agenda
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleGoogleSync}
                disabled={isSyncing}
                variant="outline"
                className="flex items-center gap-2 border-green-300 text-green-700 dark:text-green-400 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <CheckCircle2 className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Google'}
              </Button>
              <button
                onClick={handleGoogleDisconnect}
                title="Desconectar Google"
                className="text-xs text-gray-400 hover:text-red-500 transition-colors px-1"
              >
                Desconectar
              </button>
            </div>
          )}
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Evento
          </Button>
        </div>
      </div>

      <Card className="p-4 h-[700px]">
        <BigCalendar
          localizer={localizer}
          events={events.map(e => ({
            ...e,
            title: e.titulo,
            start: new Date(e.dataHora),
            end: new Date(new Date(e.dataHora).getTime() + 60 * 60 * 1000) // Default 1 hour duration
          }))}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture="pt-BR"
          view={currentView}
          onView={view => setCurrentView(view)}
          date={currentDate}
          onNavigate={date => setCurrentDate(date)}
          views={['month', 'week', 'day', 'agenda']}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Lista",
            date: "Data",
            time: "Hora",
            event: "Compromisso",
            noEventsInRange: "Não há compromissos neste período.",
            showMore: total => `+ ${total} mais`
          }}
          onSelectEvent={(event) => handleOpenModal(event)}
          onSelectSlot={(slotInfo) => {
            handleOpenModal();
            setFormData(prev => ({ 
              ...prev, 
              // Preenche data e zera os minutos e segundos
              dataHora: new Date(slotInfo.start).toISOString().slice(0, 11) + "08:00" 
            }));
          }}
          selectable
          eventPropGetter={(event) => {
            let backgroundColor = '#3b82f6'; // default blue (reunião)
            if (event.tipo === 'prazo') backgroundColor = '#ef4444'; // red
            if (event.tipo === 'audiencia') backgroundColor = '#a855f7'; // purple
            if (event.concluido) backgroundColor = '#9ca3af'; // gray strikethrough

            return { 
              style: { 
                backgroundColor, 
                borderRadius: '6px', 
                border: 'none', 
                color: '#fff',
                textDecoration: event.concluido ? 'line-through' : 'none',
                opacity: event.concluido ? 0.7 : 1
              } 
            };
          }}
        />
      </Card>

      {/* Modal Novo/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                <Input required value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} placeholder="Ex: Prazo de Contestação" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                  <select 
                    value={formData.tipo}
                    onChange={e => setFormData({...formData, tipo: e.target.value})}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all dark:text-white"
                  >
                    <option value="tarefa">Tarefa Comum</option>
                    <option value="prazo">Prazo Processual</option>
                    <option value="audiencia">Audiência</option>
                    <option value="reuniao">Reunião</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data e Hora</label>
                  <Input type="datetime-local" required value={formData.dataHora} onChange={e => setFormData({...formData, dataHora: e.target.value})} />
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
                  {processes.map(p => (
                    <option key={p.id} value={p.id}>{p.numero}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label>
                <textarea 
                  value={formData.observacoes}
                  onChange={e => setFormData({...formData, observacoes: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all dark:text-white min-h-[100px]"
                  placeholder="Anotações adicionais..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                {editingEvent && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20" 
                    onClick={async () => {
                      if(!window.confirm('Excluir este evento? (isso apagará do JusCore e também do seu Google Agenda, caso sincronizado)')) return;
                      try {
                        await axios.delete(`/api/events/${editingEvent.id}`, { headers: { Authorization: `Bearer ${token}` } });
                        fetchData();
                        handleCloseModal();
                      } catch(e) { console.error('Erro ao apagar', e); }
                    }}
                  >
                    Excluir
                  </Button>
                )}
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" className="flex-1 lg:flex-[2]">{editingEvent ? 'Salvar Edição' : 'Agendar'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Events;

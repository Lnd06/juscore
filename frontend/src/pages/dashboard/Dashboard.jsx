import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card } from '../../components/ui';
import { MessageSquarePlus, Clock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#0B0F19] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden border border-white/[0.06]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-accent block mb-2">Painel de Controle</span>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2 tracking-tight">Olá, <span className="text-accent">{user?.nome?.split(' ')[0] || 'Doutor(a)'}</span></h1>
          <p className="text-gray-400 max-w-xl text-sm md:text-base leading-relaxed">
            {user?.organization?.dashboardWelcome || "O JusCore AI está pronto para auxiliar em suas análises jurídicas hoje. Comece uma nova conversa ou revise seus casos recentes."}
          </p>
          <div className="mt-6">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent-dark text-slate-950 font-bold rounded-xl border-none shadow-sm"
              onClick={() => navigate('/dashboard/chat')}
              icon={MessageSquarePlus}
            >
              Iniciar Nova Consulta
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="p-6 bg-[#0B0F19] border border-white/[0.06] rounded-2xl">
          <h2 className="text-base font-display font-bold text-white mb-5 tracking-tight">Acesso Rápido</h2>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/dashboard/chat')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/30 group transition-all text-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-white group-hover:text-accent transition-colors">Nova Conversa</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Inicie uma análise ou elabore uma peça</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-accent transform group-hover:translate-x-0.5 transition-all" />
            </button>

            <button 
              onClick={() => navigate('/dashboard/profile')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/30 group transition-all text-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-300 group-hover:text-accent group-hover:border-accent/20 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-white group-hover:text-accent transition-colors">Meu Perfil</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Gerencie seus dados e credenciais</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-accent transform group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </Card>

        {/* Recent History Preview */}
        <Card className="p-6 bg-[#0B0F19] border border-white/[0.06] rounded-2xl">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-display font-bold text-white tracking-tight">Histórico Recente</h2>
          </div>
          <div className="space-y-2.5">
             {(user?.ultimasConversas || []).slice(0, 3).map((chat, idx) => (
               <div key={idx} className="flex items-center gap-3.5 p-3 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] rounded-xl transition-all cursor-pointer" onClick={() => navigate(`/dashboard/chat?sessionId=${chat.sessionId}`)}>
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-200 truncate">{chat.titulo || 'Consulta sem título'}</h4>
                    <p className="text-xs text-gray-500">{chat.data ? new Date(chat.data).toLocaleDateString() : 'Hoje'}</p>
                  </div>
               </div>
             ))}
             {(!user?.ultimasConversas || user.ultimasConversas.length === 0) && (
               <p className="text-sm text-gray-500 text-center py-6">Nenhuma conversa recente.</p>
             )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

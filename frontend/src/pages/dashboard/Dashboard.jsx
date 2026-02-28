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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden border border-accent/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Olá, <span className="text-accent">{user?.nome?.split(' ')[0] || 'Doutor(a)'}</span></h1>
          <p className="text-gray-300 max-w-xl text-lg">
            {user?.organization?.dashboardWelcome || "O JusCore AI está pronto para auxiliar em suas análises jurídicas hoje. Comece uma nova conversa ou revise seus casos recentes."}
          </p>
          <div className="mt-8">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-accent to-accent-dark hover:from-accent-light hover:to-accent text-white border-none shadow-lg shadow-accent/20"
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
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Acesso Rápido</h2>
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/dashboard/chat')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-juri-800 shadow-sm bg-gray-50 dark:bg-juri-900/40 hover:bg-gray-100 dark:hover:bg-juri-800/80 group transition-all text-gray-900 dark:text-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Nova Conversa</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Inicie uma análise ou tire dúvidas</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transform group-hover:translate-x-1 transition-all" />
            </button>

            <button 
              onClick={() => navigate('/dashboard/profile')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-juri-800 shadow-sm bg-gray-50 dark:bg-juri-900/40 hover:bg-gray-100 dark:hover:bg-juri-800/80 group transition-all text-gray-900 dark:text-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Meu Perfil</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie seus dados e senha</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transform group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </Card>

        {/* Recent History Preview */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Histórico Recente</h2>
          </div>
          <div className="space-y-3">
             {(user?.ultimasConversas || []).slice(0, 3).map((chat, idx) => (
               <div key={idx} className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-juri-800/60 rounded-lg transition-colors cursor-pointer" onClick={() => navigate('/dashboard/chat')}>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-juri-800/20 flex items-center justify-center text-gray-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">{chat.titulo || 'Consulta sem título'}</h4>
                    <p className="text-xs text-gray-500">{chat.data ? new Date(chat.data).toLocaleDateString() : 'Hoje'}</p>
                  </div>
               </div>
             ))}
             {(!user?.ultimasConversas || user.ultimasConversas.length === 0) && (
               <p className="text-gray-500 text-center py-4">Nenhuma conversa recente.</p>
             )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

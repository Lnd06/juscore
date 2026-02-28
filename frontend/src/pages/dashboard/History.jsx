import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/ui';
import { MessageSquare, Calendar, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/chat/history');
      setConversations(res.data);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Histórico de Conversas</h1>
        <p className="text-gray-500 dark:text-gray-400">Consulte todas as suas interações anteriores com o JusCore AI.</p>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando histórico...</div>
        ) : conversations.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma conversa encontrada</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Você ainda não iniciou nunhuma consulta jurídica.</p>
            <Button onClick={() => navigate('/dashboard/chat')}>Iniciar Nova Consulta</Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {conversations.map((chat) => (
              <div 
                key={chat.sessionId} 
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group cursor-pointer"
                onClick={() => navigate(`/dashboard/chat?sessionId=${chat.sessionId}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      {chat.titulo || 'Consulta sem título'}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(chat.updatedAt).toLocaleDateString()} às {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default History;

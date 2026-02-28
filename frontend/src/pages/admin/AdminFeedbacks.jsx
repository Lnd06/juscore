import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Bug, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../../components/ui';

const AdminFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleResolve = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/feedback/${id}`, { status: 'RESOLVED' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: 'RESOLVED' } : f));
    } catch (err) {
      alert("Erro ao marcar como resolvido.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedbacks e Bugs</h1>
        <Button variant="outline" onClick={fetchFeedbacks}>
          Atualizar
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : feedbacks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum feedback recebido ainda.</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {feedbacks.map((item) => (
              <div key={item.id} className={`p-6 flex flex-col md:flex-row gap-6 ${item.status === 'RESOLVED' ? 'bg-gray-50 dark:bg-gray-800/50 opacity-75' : ''}`}>
                <div className="flex-shrink-0">
                  {item.type === 'BUG' ? (
                    <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                      <Bug className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-sm text-gray-500">Enviado por: {item.user?.nome || 'Usuário Deletado'} ({item.user?.email})</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'RESOLVED' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {item.status === 'RESOLVED' ? 'Resolvido' : 'Pendente'}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm border border-gray-100 dark:border-gray-700">
                    {item.message}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(item.createdAt).toLocaleString('pt-BR')}
                    </span>
                    
                    {item.status !== 'RESOLVED' && (
                      <Button size="sm" onClick={() => handleResolve(item.id)} className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como Resolvido
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedbacks;

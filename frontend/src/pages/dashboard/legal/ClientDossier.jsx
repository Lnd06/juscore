/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { X, DollarSign, Calendar, Scale, Clock } from 'lucide-react';

const ClientDossier = ({ client, onClose }) => {
  const { token } = useAuth();
  const [timeline, setTimeline] = useState({ processes: [], finances: [], events: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client) {
      fetchTimeline();
    }
  }, [client]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/clients/${client.id}/timeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeline({
        processes: res.data.processes || [],
        finances: res.data.finances || [],
        events: res.data.events || []
      });
    } catch (err) {
      console.error('Erro ao buscar timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-0">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Dossiê Completo: {client.nome}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {client.tipoPessoa || 'PF'} | {client.cpf_cnpj || '---'} | {client.email || 'Sem e-mail'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Processos */}
                 <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-800">
                      <Scale className="w-5 h-5 text-blue-500" />
                      Processos ({timeline.processes.length})
                    </h3>
                    <div className="space-y-3">
                      {timeline.processes.length === 0 ? (
                        <p className="text-sm text-gray-500 italic px-2">Nenhum processo vinculado.</p>
                      ) : (
                        timeline.processes.map(p => (
                           <div key={p.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-blue-500/30 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                 <strong className="text-sm dark:text-white">{p.numero || 'Sem número'}</strong>
                                 <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                   {p.status || 'Ativo'}
                                 </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{p.titulo}</p>
                              <div className="text-xs text-gray-500 flex justify-between">
                                  <span>{p.comarca || 'Comarca não inf.'}</span>
                                  <span>{p.fase || 'Fase não inf.'}</span>
                              </div>
                           </div>
                        ))
                      )}
                    </div>
                 </div>

                 <div className="space-y-8">
                    {/* Financeiro */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-800">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        Financeiro ({timeline.finances.length})
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto pt-1 pr-2 custom-scrollbar">
                        {timeline.finances.length === 0 ? (
                          <p className="text-sm text-gray-500 italic px-2">Nenhuma movimentação financeira.</p>
                        ) : (
                          timeline.finances.map(f => (
                             <div key={f.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-800/50">
                                <div>
                                   <p className="text-sm font-medium dark:text-white">{f.descricao}</p>
                                   <p className="text-xs text-gray-500">{f.vencimento ? new Date(f.vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data Indefinida'}</p>
                                </div>
                                <div className="text-right">
                                   <p className={`text-sm font-bold ${f.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                                      {f.tipo === 'receita' ? '+' : '-'} R$ {Number(f.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                   </p>
                                   <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-medium inline-block mt-1 ${
                                     f.status === 'pago' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                     f.status === 'atrasado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                   }`}>
                                      {f.status}
                                   </span>
                                </div>
                             </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Eventos / Prazos */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-800">
                        <Calendar className="w-5 h-5 text-purple-500" />
                        Agenda e Prazos ({timeline.events.length})
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto pt-1 pr-2 custom-scrollbar">
                        {timeline.events.length === 0 ? (
                          <p className="text-sm text-gray-500 italic px-2">Nenhum evento registrado.</p>
                        ) : (
                          timeline.events.map(e => (
                             <div key={e.id} className="p-3 rounded-xl border border-l-4 border-l-purple-500 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                                <p className="text-sm font-medium dark:text-white">{e.titulo}</p>
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                   <Clock className="w-3 h-3" />
                                   <span>{e.dataHora ? new Date(e.dataHora).toLocaleString('pt-BR') : 'Data Indefinida'}</span>
                                </div>
                             </div>
                          ))
                        )}
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
            <Button onClick={onClose}>Fechar Dossiê</Button>
          </div>
      </Card>
    </div>
  );
};

export default ClientDossier;

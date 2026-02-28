import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Input, Card, Loader } from '../../components/ui';
import { Smartphone, CheckCircle, XCircle, Loader2, Plus, QrCode, Trash2 } from 'lucide-react';

const Whatsapp = () => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [assistantRole, setAssistantRole] = useState('Atendimento Geral');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Quick poll interval for QR Code / Connection state updates
  useEffect(() => {
    fetchInstances();
    const interval = setInterval(fetchInstances, 5000); // Check every 5s while on page
    return () => clearInterval(interval);
  }, []);

  const fetchInstances = async () => {
    try {
      const resp = await axios.get('/api/whatsapp');
      setInstances(resp.data);
    } catch (error) {
      console.error("Erro ao buscar instâncias:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newInstanceName) return alert("Digite um nome para identificar o robô.");
    
    setCreating(true);
    try {
      await axios.post('/api/whatsapp/create', { 
        name: newInstanceName,
        companyName,
        assistantRole
      });
      setIsModalOpen(false);
      setNewInstanceName('');
      setCompanyName('');
      setAssistantRole('Atendimento Geral');
      fetchInstances();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao criar instância. Verifique seu limite.');
    } finally {
      setCreating(false);
    }
  };

  const handleConnect = async (id) => {
    try {
      await axios.get(`/api/whatsapp/connect/${id}`);
      fetchInstances();
    } catch (error) {
      console.error("Erro ao solicitar conexão:", error);
      alert('Erro ao carregar QR Code.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja desconectar e excluir o robô "${name}"? Ele parará de responder imediatamente.`)) return;
    try {
      await axios.delete(`/api/whatsapp/${id}`);
      fetchInstances();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao excluir instância.');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'connected':
        return <span className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3 h-3" /> Online</span>;
      case 'connecting':
        return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs font-bold"><Loader2 className="w-3 h-3 animate-spin" /> Aguardando Leitura</span>;
      case 'disconnected':
      case 'expired':
      case 'error':
        return <span className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-bold"><XCircle className="w-3 h-3" /> Desconectado</span>;
      default:
        return <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs font-bold uppercase">{status}</span>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader className="w-8 h-8 text-accent animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
            <Smartphone className="w-7 h-7 text-accent" />
            Integração WhatsApp IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Conecte o número do seu escritório e transforme o WhatsApp em uma Secretária Jurídica Inteligente.
          </p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Novo Robô
        </Button>
      </div>

      {instances.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center bg-white dark:bg-gray-900 border-dashed border-2">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
             <QrCode className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold dark:text-white mb-2">Nenhuma Instância Ativa</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Você ainda não conectou nenhum número de WhatsApp. Clique em "Novo Robô" para gerar um QR Code e vincular seu aparelho.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Criar Minha Primeira Secretária IA
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instances.map(inst => (
            <Card key={inst.id} className="overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
              <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <span className="font-bold text-gray-900 dark:text-white truncate" title={inst.instanceName}>
                  {inst.instanceName.replace(/juscore_\d+_/g, 'Robô #')}
                </span>
                {getStatusBadge(inst.status)}
              </div>
              
              <div className="p-6 flex-1 flex flex-col items-center justify-center gap-4 text-center">
                {inst.status === 'connected' ? (
                   <>
                     <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                     </div>
                     <div>
                       <h4 className="font-bold text-gray-900 dark:text-white">Conectado e Operando</h4>
                       <p className="text-xs text-gray-500 mt-1">A IA está respondendo às mensagens recebidas neste número automaticamente.</p>
                     </div>
                   </>
                ) : inst.status === 'connecting' && inst.qrCode ? (
                   <>
                     <div className="bg-white p-2 rounded-lg border-4 border-accent shadow-lg mb-2">
                        {/* Render base64 string as image */}
                        <img src={inst.qrCode} alt="QR Code" className="w-48 h-48 object-contain" />
                     </div>
                     <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                       Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie este QR Code.
                     </p>
                     <p className="text-xs text-gray-400 mt-1">Atualizando status automaticamente...</p>
                   </>
                ) : (
                   <>
                     <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Smartphone className="w-8 h-8 text-gray-400" />
                     </div>
                     <p className="text-sm text-gray-500 px-4">Esta instância está inativa no momento. Gere um novo QR Code para se reconectar.</p>
                     <Button variant="outline" size="sm" onClick={() => handleConnect(inst.id)} className="mt-2 text-gray-600 dark:text-gray-300">
                       <QrCode className="w-4 h-4 mr-2" /> Gerar QR Code
                     </Button>
                   </>
                )}
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center border-t dark:border-gray-800">
                <span className="text-xs text-gray-400">ID: {inst.id}</span>
                <button 
                  onClick={() => handleDelete(inst.id, inst.instanceName)}
                  className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Excluir Instância"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Criar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-900 border-none">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <Plus className="w-5 h-5 text-accent" />
              Nova Secretária IA
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Apelido do Robô (Interno)</label>
                <Input required name="nome" value={newInstanceName} onChange={(e) => setNewInstanceName(e.target.value)} placeholder="Ex: Recepção Matriz" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome da Empresa / Escritório</label>
                <Input required name="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex: JusAdvogados Associados" />
                <p className="text-xs text-gray-500 mt-2">A IA usará este nome ao conversar com os clientes.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 dark:text-gray-300">O que ela deve fazer?</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { title: 'Triagem Inicial', desc: 'Coleta nome, área e resumo.' },
                    { title: 'Agendamento', desc: 'Foca em marcar consultas.' },
                    { title: 'Tira Dúvidas', desc: 'Responde dúvidas curtas.' },
                    { title: 'Atendimento Geral', desc: 'Uma mistura de tudo.' }
                  ].map((role) => (
                    <div 
                      key={role.title}
                      onClick={() => setAssistantRole(role.title)}
                      className={`cursor-pointer border p-3 rounded-lg transition-all ${assistantRole === role.title ? 'border-accent bg-accent/5 dark:bg-accent/10' : 'border-gray-200 dark:border-gray-700 hover:border-accent/40'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                         <span className={`text-sm font-bold ${assistantRole === role.title ? 'text-accent' : 'dark:text-white'}`}>{role.title}</span>
                         <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${assistantRole === role.title ? 'border-accent' : 'border-gray-300'}`}>
                            {assistantRole === role.title && <div className="w-2 h-2 rounded-full bg-accent" />}
                         </div>
                      </div>
                      <p className="text-xs text-gray-500">{role.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t dark:border-gray-800">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="w-1/2" disabled={creating}>
                  {creating ? 'Criando...' : 'Avançar'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
};

export default Whatsapp;

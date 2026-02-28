import React, { useState, useEffect } from 'react';
import { Button, Input, Card, Modal } from '../../components/ui';
import { MessageSquarePlus, Trash2, Megaphone, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import axios from 'axios';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    message: '',
    targetType: 'all', // all | plan | user
    targetValue: '',
    type: 'info' // info | warning | success | error
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/announcements');
      setAnnouncements(res.data);
    } catch (error) {
      console.error('Erro ao buscar avisos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/announcements', newAnnouncement);
      setIsModalOpen(false);
      setNewAnnouncement({ message: '', targetType: 'all', targetValue: '', type: 'info' });
      fetchAnnouncements();
      alert('Aviso criado com sucesso!');
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao criar aviso');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await axios.put(`/api/announcements/${id}/toggle`);
      setAnnouncements(prev => prev.map(ann => ann.id === id ? res.data : ann));
    } catch (error) {
      alert('Erro ao alterar status do aviso');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja apagar este aviso permanentemente?')) {
      try {
        await axios.delete(`/api/announcements/${id}`);
        fetchAnnouncements();
      } catch (error) {
        alert('Erro ao apagar aviso');
      }
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (type === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (type === 'error') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  const getTargetLabel = (type, val) => {
    if (type === 'all') return 'Todos os Usuários';
    if (type === 'plan') return `Plano: ${val}`;
    if (type === 'user') return `Usuário: ${val}`;
    return type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-juri-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-juri-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-accent" />
            Avisos do Sistema
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Crie banners flutuantes de anúncios que aparecerão no painel dos clientes.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4" /> Novo Aviso
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-juri-800 text-sm font-medium text-gray-500 pb-2">
                  <th className="p-3">ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Tipo / Cor</th>
                  <th className="p-3">Público-Alvo</th>
                  <th className="p-3" style={{ minWidth: "300px" }}>Mensagem</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan="6" className="text-center p-4">Carregando avisos...</td></tr>
                ) : announcements.length === 0 ? (
                  <tr><td colSpan="6" className="text-center p-4 text-gray-500">Nenhum aviso criado.</td></tr>
                ) : (
                  announcements.map((ann) => (
                    <tr key={ann.id} className="border-b border-gray-50 dark:border-juri-800/50 hover:bg-gray-50 dark:hover:bg-juri-800/50 transition-colors">
                      <td className="p-3 font-mono text-xs text-gray-500">#{ann.id}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                          ann.isActive 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {ann.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3 uppercase text-xs font-bold flex items-center gap-2">
                        {getTypeIcon(ann.type)} {ann.type}
                      </td>
                      <td className="p-3">
                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-medium">
                          {getTargetLabel(ann.targetType, ann.targetValue)}
                        </span>
                      </td>
                      <td className="p-3 font-medium truncate max-w-xs" title={ann.message}>
                        {ann.message.length > 50 ? ann.message.substring(0, 50) + '...' : ann.message}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggle(ann.id)}
                        >
                          {ann.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(ann.id)}
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
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Criar Novo Aviso">
        <form onSubmit={handleCreate} className="space-y-4 pt-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Público-Alvo</label>
            <select
              value={newAnnouncement.targetType}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetType: e.target.value, targetValue: '' })}
              className="w-full p-2.5 bg-white dark:bg-juri-800 border border-gray-200 dark:border-juri-700 rounded-lg outline-none"
              required
            >
              <option value="all">Todos os Usuários</option>
              <option value="plan">Usuários de um Plano Específico</option>
              <option value="user">Usuário Específico (Email)</option>
            </select>
          </div>

          {newAnnouncement.targetType === 'plan' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Selecione o Plano</label>
              <select
                value={newAnnouncement.targetValue}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetValue: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-juri-800 border border-gray-200 dark:border-juri-700 rounded-lg outline-none"
                required
              >
                <option value="">-- Escolha um plano --</option>
                <option value="student_basic">Estudante Basic</option>
                <option value="student_pro">Estudante Pro</option>
                <option value="lawyer_starter">Advogado Starter</option>
                <option value="lawyer_growth">Advogado Growth</option>
                <option value="office_master">Escritório Master</option>
              </select>
            </div>
          )}

          {newAnnouncement.targetType === 'user' && (
            <Input
              label="Email do Usuário"
              type="email"
              value={newAnnouncement.targetValue}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetValue: e.target.value })}
              required
            />
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo / Cor Visual</label>
            <select
              value={newAnnouncement.type}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
              className="w-full p-2.5 bg-white dark:bg-juri-800 border border-gray-200 dark:border-juri-700 rounded-lg outline-none"
              required
            >
              <option value="info">Info (Azul)</option>
              <option value="success">Sucesso (Verde)</option>
              <option value="warning">Alerta (Amarelo)</option>
              <option value="error">Aviso Crítico (Vermelho)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem do Aviso</label>
            <textarea
              value={newAnnouncement.message}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
              className="w-full p-3 bg-white dark:bg-juri-800 border border-gray-200 dark:border-juri-700 rounded-lg outline-none overflow-hidden resize-none h-32"
              placeholder="Ex: O sistema passará por manutenção às 00:00..."
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Ativar Aviso Publicamente</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminAnnouncements;

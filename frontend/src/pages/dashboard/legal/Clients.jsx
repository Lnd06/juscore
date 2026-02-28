import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '../../../components/ui';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Edit2, 
  Trash2, 
  X,
  CreditCard 
} from 'lucide-react';

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    endereco: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        nome: client.nome || '',
        email: client.email || '',
        telefone: client.telefone || '',
        cpf_cnpj: client.cpf_cnpj || '',
        endereco: client.endereco || '',
        observacoes: client.observacoes || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cpf_cnpj: '',
        endereco: '',
        observacoes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await axios.put(`/api/clients/${editingClient.id}`, formData);
      } else {
        await axios.post('/api/clients', formData);
      }
      fetchClients();
      handleCloseModal();
    } catch (err) {
      alert('Erro ao salvar cliente.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deseja realmente excluir o cliente ${name}?`)) return;
    try {
      await axios.delete(`/api/clients/${id}`);
      fetchClients();
    } catch (err) {
      alert('Erro ao excluir cliente.');
    }
  };

  const filteredClients = clients.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cpf_cnpj && c.cpf_cnpj.includes(searchTerm))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            Gestão de Clientes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Cadastre e gerencie os dados dos seus clientes para petições e processos.
          </p>
        </div>
        
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou CPF/CNPJ..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="col-span-full p-12 text-center flex flex-col items-center border-dashed">
            <Users className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nenhum cliente encontrado</h3>
            <p className="text-gray-500 mt-1">Comece cadastrando seu primeiro cliente clicando no botão acima.</p>
          </Card>
        ) : (
          filteredClients.map(client => (
            <Card key={client.id} className="p-5 hover:border-accent/50 transition-all group overflow-hidden relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                  <span className="text-xl font-bold">{client.nome.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(client)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(client.id, client.nome)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate mb-2">{client.nome}</h3>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{client.telefone}</span>
                  </div>
                )}
                {client.cpf_cnpj && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span>{client.cpf_cnpj}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500">
                <span>Criado em {new Date(client.createdAt).toLocaleDateString()}</span>
                <Button 
                  variant="ghost" 
                  className="h-7 text-xs px-2 hover:text-accent"
                  onClick={() => navigate(`/dashboard/processes?search=${encodeURIComponent(client.nome)}`)}
                >
                  Ver Processos
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {editingClient ? <Edit2 className="w-5 h-5 text-accent" /> : <UserPlus className="w-5 h-5 text-accent" />}
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome Completo</label>
                  <Input 
                    required 
                    placeholder="João Silva..."
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">E-mail</label>
                  <Input 
                    type="email"
                    placeholder="joao@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Telefone</label>
                  <Input 
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">CPF ou CNPJ</label>
                  <Input 
                    placeholder="000.000.000-00"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Endereço</label>
                  <Input 
                    placeholder="Rua Exemplo, 123 - Centro"
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Observações</label>
                  <textarea 
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent min-h-[100px]"
                    placeholder="Informações adicionais sobre o cliente..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" className="flex-1">
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Clients;

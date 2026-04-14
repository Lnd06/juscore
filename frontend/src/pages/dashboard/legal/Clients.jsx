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
import ClientDossier from './ClientDossier';

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [dossierClient, setDossierClient] = useState(null);
  
  const initialFormState = {
    nome: '',
    tipoPessoa: 'Fisica',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    rg: '',
    estadoCivil: '',
    profissao: '',
    cep: '',
    endereco: '',
    cidade: '',
    estado: '',
    dadosBancarios: '',
    observacoes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

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
        tipoPessoa: client.tipoPessoa || 'Fisica',
        email: client.email || '',
        telefone: client.telefone || '',
        cpf_cnpj: client.cpf_cnpj || '',
        rg: client.rg || '',
        estadoCivil: client.estadoCivil || '',
        profissao: client.profissao || '',
        cep: client.cep || '',
        endereco: client.endereco || '',
        cidade: client.cidade || '',
        estado: client.estado || '',
        dadosBancarios: client.dadosBancarios || '',
        observacoes: client.observacoes || ''
      });
    } else {
      setEditingClient(null);
      setFormData(initialFormState);
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
      alert(err.response?.data?.error || 'Erro ao salvar cliente.');
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
    (c.cpf_cnpj && c.cpf_cnpj.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            CRM Jurídico - Clientes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestão completa de dados, contatos e histórico de clientes.
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
          placeholder="Buscar por nome, e-mail ou CPF/CNPJ..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
            <Card key={client.id} className="p-5 hover:border-accent/50 transition-all group overflow-hidden relative flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0">
                    <span className="text-xl font-bold">{client.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-1" title={client.nome}>{client.nome}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full font-medium">
                      {client.tipoPessoa || 'Fisica'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(client)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
                    title="Editar Cliente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(client.id, client.nome)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                    title="Excluir Cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 flex-1">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate" title={client.email}>{client.email}</span>
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
                {client.cidade && client.estado && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{client.cidade} - {client.estado}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500">
                <span>Criado em {new Date(client.createdAt).toLocaleDateString('pt-BR')}</span>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    className="h-7 text-xs px-2 hover:text-accent"
                    onClick={() => navigate(`/dashboard/processes?search=${encodeURIComponent(client.nome)}`)}
                  >
                    Processos
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-7 text-xs px-2 border-accent text-accent hover:bg-accent/10"
                    onClick={() => setDossierClient(client)}
                  >
                    Dossiê
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {editingClient ? <Edit2 className="w-5 h-5 text-accent" /> : <UserPlus className="w-5 h-5 text-accent" />}
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              {/* Seção 1: Dados Principais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">1. Dados Principais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tipo de Pessoa</label>
                    <div className="flex space-x-4 mt-1">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="tipoPessoa" 
                          value="Fisica"
                          checked={formData.tipoPessoa === 'Fisica'}
                          onChange={(e) => setFormData({...formData, tipoPessoa: e.target.value})}
                          className="text-accent focus:ring-accent"
                        />
                        <span className="text-sm dark:text-gray-300">Pessoa Física</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="tipoPessoa" 
                          value="Juridica"
                          checked={formData.tipoPessoa === 'Juridica'}
                          onChange={(e) => setFormData({...formData, tipoPessoa: e.target.value})}
                          className="text-accent focus:ring-accent"
                        />
                        <span className="text-sm dark:text-gray-300">Pessoa Jurídica</span>
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome Completo / Razão Social *</label>
                    <Input 
                      required 
                      placeholder="Ex: João da Silva..."
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      {formData.tipoPessoa === 'Fisica' ? 'CPF' : 'CNPJ'}
                    </label>
                    <Input 
                      placeholder={formData.tipoPessoa === 'Fisica' ? "000.000.000-00" : "00.000.000/0000-00"}
                      value={formData.cpf_cnpj}
                      onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                    />
                  </div>

                  {formData.tipoPessoa === 'Fisica' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">RG</label>
                        <Input 
                          placeholder="00.000.000-0"
                          value={formData.rg || ''}
                          onChange={(e) => setFormData({...formData, rg: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Estado Civil</label>
                        <select 
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent"
                          value={formData.estadoCivil || ''}
                          onChange={(e) => setFormData({...formData, estadoCivil: e.target.value})}
                        >
                          <option value="">Selecione...</option>
                          <option value="Solteiro(a)">Solteiro(a)</option>
                          <option value="Casado(a)">Casado(a)</option>
                          <option value="Divorciado(a)">Divorciado(a)</option>
                          <option value="Viúvo(a)">Viúvo(a)</option>
                          <option value="União Estável">União Estável</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Profissão / Ramo de Atuação</label>
                    <Input 
                      placeholder={formData.tipoPessoa === 'Fisica' ? "Ex: Engenheiro" : "Ex: Comércio Varejista"}
                      value={formData.profissao || ''}
                      onChange={(e) => setFormData({...formData, profissao: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Contatos e Endereço */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">2. Contatos e Localização</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">E-mail</label>
                    <Input 
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Telefone / WhatsApp</label>
                    <Input 
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">CEP</label>
                    <Input 
                      placeholder="00000-000"
                      value={formData.cep || ''}
                      onChange={(e) => setFormData({...formData, cep: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Endereço Completo (Rua, Número, Bairro)</label>
                    <Input 
                      placeholder="Rua Exemplo, 123 - Centro"
                      value={formData.endereco}
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cidade</label>
                    <Input 
                      placeholder="São Paulo"
                      value={formData.cidade || ''}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Estado (UF)</label>
                    <Input 
                      placeholder="SP"
                      maxLength={2}
                      value={formData.estado || ''}
                      onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Informações Adicionais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">3. Outras Informações</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Dados Bancários</label>
                    <textarea 
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent min-h-[60px]"
                      placeholder="Banco, Agência, Conta, Chave PIX (Para repasses)..."
                      value={formData.dadosBancarios || ''}
                      onChange={(e) => setFormData({...formData, dadosBancarios: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Observações Gerais</label>
                    <textarea 
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-accent min-h-[100px]"
                      placeholder="Fatos sociais, comportamentos, preferências de contato..."
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" className="flex-1">
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <ClientDossier client={dossierClient} onClose={() => setDossierClient(null)} />
    </div>
  );
};

export default Clients;

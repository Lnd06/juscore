/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { Users, UserPlus, Trash2, Mail, Lock, CheckCircle, Shield } from 'lucide-react';

const Team = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [formData, setFormData] = useState({
    tipo: 'comum'
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await axios.get('/api/team');
      setTeam(response.data);
    } catch (err) {
      alert('Erro ao carregar equipe.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const resp = await axios.post('/api/team/invite', { tipo: formData.tipo });
      const token = resp.data.inviteToken;
      const url = `${window.location.origin}/invite/${token}`;
      setInviteLink(url);
      fetchTeam();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao gerar link.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Link de convite copiado!');
    setIsModalOpen(false);
    setInviteLink('');
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja remover ${name} da equipe? Ele perderá o acesso instantaneamente.`)) return;
    try {
      await axios.delete(`/api/team/${id}`);
      alert('Membro removido da equipe.');
      fetchTeam();
    } catch (err) {
      alert('Erro ao remover membro.');
    }
  };

  const getLimitText = () => {
    const plan = user?.subscriptionPlan;
    // Visão Atualizada (Dono + Convidados permitidos)
    // Growth: 2 Usuários Totais (owner + 1 convidado extra)
    // Master: 4 Usuários Totais (owner + 3 convidados extras)
    if (plan === 'lawyer_growth') return { max: 2, maxInvites: 1, current: team.length };
    if (plan === 'office_master') return { max: 4, maxInvites: 3, current: team.length };
    if (plan === 'enterprise') return { max: 999, maxInvites: 999, current: team.length };
    return { max: 0, maxInvites: 0, current: 0 };
  };

  const limits = getLimitText();
  const allowedTypes = user?.tipo === 'admin' || user?.tipo === 'master' 
    ? ['comum', 'especial', 'admin'] : (user?.tipo === 'especial' ? ['comum', 'especial'] : ['comum']);

  const typeLabels = {
    comum: "Visualizador / Estagiário",
    especial: "Advogado / Criador",
    admin: "Sócio / Administrador"
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            Gestão de Equipe
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Convide advogados e gerencie as permissões dos membros do seu escritório.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-medium text-gray-700 dark:text-gray-300">
            {limits.max === 999 ? 'Ilimitado' : `${limits.current + 1} de ${limits.max} membros na sua corporação`}
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            disabled={limits.current >= limits.maxInvites}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Novo Membro
          </Button>
        </div>
      </div>

      <div className="grid gap-4 mt-6">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>
        ) : team.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center border-dashed">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nenhum membro na equipe</h3>
            <p className="text-gray-500 mt-2 max-w-md">
              Sua equipe está vazia. Comece a convidar outros advogados clicando no botão "Novo Membro" acima.
            </p>
          </Card>
        ) : (
          team.map(member => (
            <Card key={member.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-accent/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent text-lg font-bold">
                  {member.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {member.nome}
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 font-medium">
                      {typeLabels[member.tipo] || member.tipo}
                    </span>
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {member.email}</span>
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Ativo</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                onClick={() => handleRemove(member.id, member.nome)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-900">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-accent" />
              Gerar Link de Convite
            </h2>
            
            {inviteLink ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Envie este link para seu associado. Ele mesmo preencherá seus dados e a senha de acesso. O link expira em 7 dias.
                </p>
                <div className="flex items-center gap-2">
                  <Input readOnly value={inviteLink} className="flex-1 text-xs" />
                  <Button onClick={copyLink} className="whitespace-nowrap">Copiar</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 flex items-center gap-2 dark:text-gray-300">
                  Nível de Permissão
                  <Shield className="w-4 h-4 text-gray-400" />
                </label>
                <select 
                  name="tipo" 
                  value={formData.tipo} 
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                >
                  {allowedTypes.includes('comum') && <option value="comum">{typeLabels.comum} (Básico)</option>}
                  {allowedTypes.includes('especial') && <option value="especial">{typeLabels.especial} (Avançado)</option>}
                  {allowedTypes.includes('admin') && <option value="admin">{typeLabels.admin} (Max)</option>}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Seu cargo atual permite criar membros até o seu próprio nível organizacional.
                </p>
              </div>

              <div className="flex gap-4 pt-4 border-t dark:border-gray-800">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="w-1/2" disabled={submitting}>
                  {submitting ? 'Gerando...' : 'Gerar Link'}
                </Button>
              </div>
            </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Team;

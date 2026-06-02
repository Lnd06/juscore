import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Input } from '../../components/ui';
import { Scale, Mail, Lock, User, ShieldCheck } from 'lucide-react';

const InviteRegister = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    maioridadeConfirmada: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.senha !== formData.confirmarSenha) {
      alert("As senhas não coincidem.");
      return;
    }

    if (!formData.maioridadeConfirmada) {
      alert("Você precisa confirmar que é maior de 16 anos ou possui autorização dos pais.");
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/team/register-invite', {
        token,
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha
      });
      
      alert("Conta criada com Sucesso! Faça login para começar.");
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.error || "Ocorreu um erro ao criar a conta. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
              <Scale className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              Convite JusCore AI
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-center mt-2 text-sm">
              Você foi convidado(a) para integrar uma Equipe Jurídica.
              Complete seus dados para acessar o sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome de Exibição
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  required
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha Segura
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  required
                  type="password"
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 w-full"
                  minLength="6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  required
                  type="password"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  placeholder="Repita a senha"
                  className="pl-10 w-full"
                  minLength="6"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="relative flex items-center h-5">
                <input
                  id="maioridadeConfirmada"
                  name="maioridadeConfirmada"
                  type="checkbox"
                  checked={formData.maioridadeConfirmada}
                  onChange={(e) => setFormData(prev => ({ ...prev, maioridadeConfirmada: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
                />
              </div>
              <div className="text-sm">
                <label htmlFor="maioridadeConfirmada" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Sou maior de 16 anos ou possuo autorização dos meus pais
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? 'Criando Conta...' : 'Aceitar Convite e Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteRegister;

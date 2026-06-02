/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Button, Input } from '../../components/ui';

import { Mail, Lock, User, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    nome: '',
    apelido: '',
    email: '',
    senha: '',
    confirmSenha: '',
    cargo: '',
    finalidade: '',
    termosAceitos: false,
    maioridadeConfirmada: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.id]: value });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, cargo: role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.senha !== formData.confirmSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!formData.cargo) {
      setError('Selecione um perfil profissional.');
      return;
    }

    if (!formData.termosAceitos) {
      setError('Você precisa aceitar os Termos de Uso.');
      return;
    }

    if (!formData.maioridadeConfirmada) {
      setError('Você precisa confirmar que é maior de 16 anos ou possui autorização dos pais.');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      // Redirect to login or auto-login? Legacy seemed to redirect to login or show success toast.
      // Let's redirect to login with a success state or just login directly using the token if returned.
      // But register usually returns just success message or token. 
      // AuthContext.register returns res.data.
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao criar conta.';
      if (err.response?.status === 409) setError('E-mail já cadastrado.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    "Advogado(a)", "Empresa", "Estudante de Direito", "Bacharel em Direito", "Assistente Jurídico", "Outro"
  ];

  return (
    <AuthLayout 
      title="Crie sua conta" 
      subtitle="Junte-se à revolução da inteligência jurídica."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              NOME COMPLETO
            </label>
            <Input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="João Silva"
              required
            />
          </div>

          <div>
            <label htmlFor="apelido" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              APELIDO
            </label>
            <Input
              type="text"
              id="apelido"
              value={formData.apelido}
              onChange={handleChange}
              placeholder="João"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              E-MAIL
            </label>
            <Input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="senha"
              label="Senha"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.senha}
              onChange={handleChange}
              required
            />
            <Input
              id="confirmSenha"
              label="Confirmar"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.confirmSenha}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Perfil Profissional
            </label>
            <div className="flex flex-wrap gap-2">
              {roles.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    formData.cargo === role
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-400'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <Input
            id="finalidade"
            label="Objetivo de Uso"
            placeholder="Ex: Pesquisa para TCC, análise de contratos..."
            value={formData.finalidade}
            onChange={handleChange}
          />
          
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="relative flex items-center h-5">
                <input
                  id="termosAceitos"
                  type="checkbox"
                  checked={formData.termosAceitos}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-accent"
                />
              </div>
              <div className="text-sm">
                <label htmlFor="termosAceitos" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Concordo com os <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-bold">Termos de Uso</a>
                </label>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  Ao criar uma conta, você aceita nossa política de responsabilidade sobre IA.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="relative flex items-center h-5">
                <input
                  id="maioridadeConfirmada"
                  type="checkbox"
                  checked={formData.maioridadeConfirmada}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-accent"
                />
              </div>
              <div className="text-sm">
                <label htmlFor="maioridadeConfirmada" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Sou maior de 16 anos ou possuo autorização dos meus pais
                </label>
              </div>
            </div>
          </div>

        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 animate-pulse">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          size="lg" 
          isLoading={loading}
        >
          Cadastrar Gratuitamente
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-[#0f172a] text-gray-500">
              Ou continue com
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              const res = await axios.get(`/api/auth/google/url?t=${Date.now()}`);
              const { url } = res.data;

              if (url && typeof url === 'string' && url.startsWith('https://')) {
                window.location.href = url;
              } else {
                setError('Erro ao carregar link do Google. Tente novamente mais tarde.');
              }
            } catch (err) {
              setError('Erro ao iniciar cadastro com Google');
            }
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-bold text-primary-600 hover:text-accent-dark dark:text-primary-400 transition-colors">
            Fazer login
          </Link>
        </p>
      </form>

    </AuthLayout>
  );
};

export default Register;

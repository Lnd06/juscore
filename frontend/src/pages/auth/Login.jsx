/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Button, Input } from '../../components/ui';
import axios from 'axios';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Bem-vindo de volta" 
      subtitle="Entre com suas credenciais para acessar sua conta."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            required
            autoComplete="email"
          />
          <div className="space-y-1">
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={100}
              required
              autoComplete="current-password"
            />
            <div className="flex justify-end pt-1">
              <Link 
                to="/forgot-password" 
                className="text-xs font-semibold text-accent hover:text-[#CAA453] transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: [0, -8, 8, -6, 6, -4, 4, 0], opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="p-3 rounded-lg bg-red-900/10 text-red-400 text-xs border border-red-950/40"
          >
            {error}
          </motion.div>
        )}

        <Button 
          type="submit" 
          className="w-full text-sm font-bold bg-accent hover:bg-accent-dark text-slate-950 rounded-xl h-12" 
          size="lg" 
          isLoading={loading}
        >
          Entrar na Plataforma
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2.5 bg-[#0B0F19] text-gray-500 font-medium">
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
                setError('Erro ao carregar link do Google. Tente novamente.');
              }
            } catch (err) {
              setError('Erro ao iniciar login com Google');
            }
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-white/5 bg-[#131B2E] text-gray-200 rounded-xl hover:bg-white/5 transition-colors font-semibold text-sm h-12"
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

        <p className="text-center text-xs text-gray-400">
          Não tem uma conta?{' '}
          <Link to="/register" className="font-bold text-accent hover:text-[#CAA453] transition-colors">
            Criar conta gratuita
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;

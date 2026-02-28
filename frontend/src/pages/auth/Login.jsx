import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Button, Input, Card, Logo } from '../../components/ui';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithToken } = useAuth();
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
              required
              autoComplete="current-password"
            />
            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm font-medium text-primary-600 hover:text-accent-dark dark:text-primary-400"
              >
                Esqueceu a senha?
              </Link>
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
          Entrar na Plataforma
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
              // Limpa qualquer resultado anterior
              localStorage.removeItem('google_auth_result');

              const res = await axios.get('/api/auth/google/url');
              const { url } = res.data;
              
              const width = 500;
              const height = 600;
              const left = window.screen.width / 2 - width / 2;
              const top = window.screen.height / 2 - height / 2;
              
              const popup = window.open(
                url, 
                'GoogleAuth', 
                `width=${width},height=${height},left=${left},top=${top}`
              );

              if (!popup) {
                setError('Popup bloqueado pelo navegador. Por favor, permita popups para este site.');
                return;
              }

              // Polling: verifica localStorage a cada 500ms
              // (storage event do browser só dispara em OUTRAS abas, não na mesma)
              const poll = setInterval(() => {
                try {
                  const raw = localStorage.getItem('google_auth_result');
                  if (raw) {
                    const payload = JSON.parse(raw);
                    localStorage.removeItem('google_auth_result');
                    clearInterval(poll);

                    if (payload.token && payload.user) {
                      // Aplica diretamente sem depender do AuthContext listener
                      localStorage.setItem('token', payload.token);
                      axios.defaults.headers.common['Authorization'] = `Bearer ${payload.token}`;
                      // Dispara storage event manualmente para o AuthContext também capturar
                      window.dispatchEvent(new StorageEvent('storage', {
                        key: 'google_auth_result',
                        newValue: raw,
                      }));
                    } else if (payload.error) {
                      setError(payload.error || 'Falha na autenticação com Google.');
                    }
                  }

                  // Para o poll se o popup fechou e não há resultado
                  if (popup.closed) {
                    const remaining = localStorage.getItem('google_auth_result');
                    if (!remaining) clearInterval(poll);
                  }
                } catch (e) {
                  clearInterval(poll);
                }
              }, 500);

              // Timeout de segurança: para o poll após 3 minutos
              setTimeout(() => clearInterval(poll), 180000);

            } catch (err) {
              setError('Erro ao iniciar login com Google');
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
          Não tem uma conta?{' '}
          <Link to="/register" className="font-bold text-primary-600 hover:text-accent-dark dark:text-primary-400 transition-colors">
            Criar conta gratuita
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;

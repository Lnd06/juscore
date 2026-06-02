/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Página de callback do Google OAuth.
 * Agora opera como redirecionamento de tela cheia, resolvendo problemas
 * de popups bloqueados e Cross-Origin-Opener-Policy.
 */
const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userRaw = params.get('user');
    const error = params.get('error');

    if (error || !token || !userRaw) {
      console.error("Falha na autenticação Google:", error || "Token ausente.");
      setStatus('error');
      // Redireciona para login após um tempo para mostrar o erro
      setTimeout(() => navigate('/login'), 4000);
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));

      // Aplica login usando a função padrão do contexto
      loginWithToken(token, user);
      
      setStatus('success');
      
      // Redirecionamento firme com reload para garantir a montagem limpa dos Providers de Auth
      setTimeout(() => {
        window.location.href = '/dashboard/chat';
      }, 1500);

    } catch (e) {
      console.error('Erro ao processar callback Google:', e);
      setStatus('error');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [navigate, loginWithToken]);

  return (
    <div style={{
      background: '#0f172a', /* slate-900 */
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      fontFamily: 'sans-serif',
      margin: 0,
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 32, background: 'rgba(30,30,40,0.4)', backdropFilter: 'blur(8px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">Conectando...</h2>
            <p className="text-slate-400 text-sm">Validando sua chave do Google.</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center animate-pulse">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">Login realizado!</h2>
            <p className="text-slate-400 text-sm">Redirecionando para o seu painel...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Erro na autenticação</h2>
            <p className="text-slate-400 text-sm">Não foi possível conectar com o Google. Redirecionando de volta ao Início.</p>
            <button onClick={() => navigate('/login')} className="mt-6 bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer">
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAuthCallback;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Página de callback do Google OAuth.
 * O backend redireciona para cá após autenticar o usuário.
 * Como estamos no mesmo origin (localhost:5173), podemos:
 * - Escrever no localStorage
 * - Usar window.opener.postMessage
 * - Fechar o popup via window.close()
 */
const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userRaw = params.get('user');
    const error = params.get('error');

    if (error || !token) {
      setStatus('error');
      // Avisar a janela pai se existir
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Falha na autenticação com Google.' }, window.location.origin);
        } catch {}
      }
      // Fechar após 3s
      setTimeout(() => window.close(), 3000);
      return;
    }

    setStatus('success');

    try {
      // Salvar no localStorage (mesma origem — funciona!)
      const user = JSON.parse(decodeURIComponent(userRaw));

      // Método 1: postMessage para a janela pai (funciona porque agora somos mesma origem)
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'GOOGLE_AUTH_SUCCESS', token, user },
          window.location.origin
        );
        // Fechar o popup após enviar a mensagem
        setTimeout(() => window.close(), 1000);
      } else {
        // Método 2: janela não é um popup — salvar direto e redirecionar
        localStorage.setItem('token', token);
        window.location.href = '/dashboard';
      }
    } catch (e) {
      console.error('Erro ao processar callback:', e);
      setStatus('error');
      setTimeout(() => window.close(), 3000);
    }
  }, []);

  return (
    <div style={{
      background: '#0f172a',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif',
      margin: 0,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        {status === 'loading' && (
          <>
            <div style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: 40,
              height: 40,
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }} />
            <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>Conectando...</h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>Autenticação concluída com sucesso.</p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 15 }}>Aguarde, fechando automaticamente...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 20 }}>✅</div>
            <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>Login realizado!</h2>
            <p style={{ color: '#94a3b8' }}>Esta janela vai fechar em instantes...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 20 }}>⚠️</div>
            <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>Erro na autenticação</h2>
            <p style={{ color: '#94a3b8' }}>Não foi possível conectar com o Google. Feche e tente novamente.</p>
            <button onClick={() => window.close()} style={{
              background: '#ef4444', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginTop: 16,
            }}>
              Fechar
            </button>
          </>
        )}
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;

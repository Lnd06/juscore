import React, { useState } from 'react';
import axios from 'axios';

const ConfirmIdentity = ({ user, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Re-verifica o login com o e-mail do usuário autenticado e a senha fornecida
      const res = await axios.post('/api/auth/login', { 
        email: user.email, 
        senha: password 
      });

      if (res.data && res.data.user && res.data.user.tipo === 'master') {
        onConfirm();
      } else {
        setError('Acesso negado. Apenas administradores do sistema.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Senha incorreta. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 px-4 fixed top-0 left-0 z-[999998] overflow-y-auto">
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[#020617] pointer-events-none"></div>
      
      <div className="max-w-md w-full space-y-8 bg-slate-900/90 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden z-10 my-8">
        {/* Glow effect */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-center relative">
          <div className="mx-auto h-16 w-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Confirmação de Segurança Master
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sua sessão como <strong className="text-amber-500">{user.nome}</strong> está ativa. Insira sua senha para confirmar a liberação do painel administrativo.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Senha de Administrador
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-800 bg-slate-950/80 placeholder-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-sm text-center animate-pulse">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Desbloquear Painel Master'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmIdentity;

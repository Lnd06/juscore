import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import BrowserErrorPage from './components/ui/BrowserErrorPage';
import ConfirmIdentity from './components/ui/ConfirmIdentity';
import { Loader } from './components/ui';

import ForgotPassword from './pages/auth/ForgotPassword';
import NewPassword from './pages/auth/NewPassword';
import VerifyCode from './pages/auth/VerifyCode';
import AdminDashboard from './pages/admin/AdminDashboard';
import Library from './pages/admin/Library';
import Finance from './pages/admin/Finance';
import AdminFeedbacks from './pages/admin/AdminFeedbacks';
import MasterRoute from './components/route/MasterRoute';
import AdminLayout from './components/layout/AdminLayout';

function App() {
  const { user, loading } = useAuth();
  const [confirmed, setConfirmed] = useState(
    () => sessionStorage.getItem('master_confirmed') === 'true'
  );

  // Se o AuthContext ainda estiver validando o token compartilhado
  if (loading) {
    return <Loader text="Carregando..." />;
  }

  // REGRA 1: Para acessar o painel master o usuario master deve acessar primeiro a aplicação normal.
  // Se o usuário não existe no contexto do navegador ou não é administrador (master),
  // renderizamos a tela de erro falsa do navegador (site não existe).
  if (!user || user.tipo !== 'master') {
    return <BrowserErrorPage />;
  }

  // REGRA 2: Se ele realmente for master, ele entra e coloca a senha de novo para confirmar e liberar.
  if (!confirmed) {
    return (
      <ConfirmIdentity 
        user={user} 
        onConfirm={() => {
          sessionStorage.setItem('master_confirmed', 'true');
          setConfirmed(true);
        }} 
      />
    );
  }

  // Se passou em todas as validações de segurança, libera as rotas administrativas em memória.
  return (
    <Routes>
      {/* Redirecionamento da raiz diretamente para o Painel Master */}
      <Route path="/" element={<Navigate to="/master-panel" replace />} />
      
      {/* Redireciona logins para o painel se já está liberado */}
      <Route path="/login" element={<Navigate to="/master-panel" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/new-password" element={<NewPassword />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      
      {/* Painel Administrativo Master */}
      <Route 
        path="/master-panel" 
        element={
          <MasterRoute>
            <AdminLayout />
          </MasterRoute>
        }
      >
         <Route index element={<AdminDashboard />} />
         <Route path="library" element={<Library />} />
         <Route path="finance" element={<Finance />} />
         <Route path="feedbacks" element={<AdminFeedbacks />} />
      </Route>

      {/* Rota Fallback */}
      <Route path="*" element={<Navigate to="/master-panel" replace />} />
    </Routes>
  );
}

export default App;

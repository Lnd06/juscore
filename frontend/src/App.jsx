import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import NewPassword from './pages/auth/NewPassword';
import VerifyCode from './pages/auth/VerifyCode';
import Terms from './pages/Terms';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Chat from './pages/dashboard/Chat';
import Profile from './pages/dashboard/Profile';
import Calculator from './pages/dashboard/Calculator';
import DashboardContact from './pages/dashboard/Contact';
import History from './pages/dashboard/History'; 
import { useAuth } from './context/AuthContext';
import { Loader } from './components/ui';
import AdminDashboard from './pages/admin/AdminDashboard';
import Subscription from './pages/dashboard/Subscription';
import Team from './pages/dashboard/Team';
import Whatsapp from './pages/dashboard/Whatsapp';
import LawyerBI from './pages/dashboard/LawyerBI';
import Library from './pages/admin/Library';
import Finance from './pages/admin/Finance';
import AdminFeedbacks from './pages/admin/AdminFeedbacks';
import MasterRoute from './components/route/MasterRoute';
import AdminLayout from './components/layout/AdminLayout';
import Landing from './pages/Landing';
import InviteRegister from './pages/auth/InviteRegister';
import Clients from './pages/dashboard/legal/Clients';
import Processes from './pages/dashboard/legal/Processes';
import Events from './pages/dashboard/legal/Events';
import Fees from './pages/dashboard/legal/Fees';
import GoogleAuthCallback from './pages/auth/GoogleAuthCallback';
import OabSimulator from './pages/dashboard/OabSimulator';
import TccAssistant from './pages/dashboard/TccAssistant';
import DocumentGenerator from './pages/dashboard/legal/DocumentGenerator';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

// Nível 1: Clientes, Processos (Starter+)
const StarterRoute = ({ children }) => {
  const { user } = useAuth();
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  const isProfessional = user?.cargo === 'Advogado(a)' || user?.cargo === 'Empresa';
  const plan = user?.subscriptionPlan || 'free';
  const hasAccess = isPrivileged || (isProfessional && ['lawyer_starter', 'lawyer_growth', 'office_master', 'enterprise'].includes(plan));

  if (!hasAccess) return <Navigate to="/dashboard" replace />;
  return children;
};

// Nível 2: Documentos, Agenda (Growth+)
const GrowthRoute = ({ children }) => {
  const { user } = useAuth();
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  const isProfessional = user?.cargo === 'Advogado(a)' || user?.cargo === 'Empresa';
  const plan = user?.subscriptionPlan || 'free';
  const hasAccess = isPrivileged || (isProfessional && ['lawyer_growth', 'office_master', 'enterprise'].includes(plan));

  if (!hasAccess) return <Navigate to="/dashboard/subscription" replace />;
  return children;
};

// Nível 3: Financeiro, Equipe, BI (Master+)
const MasterProfRoute = ({ children }) => {
  const { user } = useAuth();
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  const isProfessional = user?.cargo === 'Advogado(a)' || user?.cargo === 'Empresa';
  const plan = user?.subscriptionPlan || 'free';
  const hasAccess = isPrivileged || (isProfessional && ['office_master', 'enterprise'].includes(plan));

  if (!hasAccess) return <Navigate to="/dashboard/subscription" replace />;
  return children;
};

import AcademicHub from './pages/dashboard/AcademicHub';

// Nível Estudante Pro/Acadêmico: OAB e TCC (Também liberado para Advogados)
const AcademicRoute = ({ children }) => {
  const { user } = useAuth();
  const plan = user?.subscriptionPlan || 'free';
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  const isProfessional = ['lawyer_starter', 'lawyer_growth', 'office_master', 'enterprise'].includes(plan);

  if (!isPrivileged && plan !== 'student_pro' && !isProfessional) {
    return <Navigate to="/dashboard/subscription" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/new-password" element={<NewPassword />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/invite/:token" element={<InviteRegister />} />
      <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
      
      <Route path="/" element={<Landing />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="chat" element={<Chat />} />
        <Route path="profile" element={<Profile />} />
        <Route path="calculator" element={<Calculator />} />
        <Route path="contact" element={<DashboardContact />} />
        <Route path="history" element={<History />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="team" element={<GrowthRoute><Team /></GrowthRoute>} />
        <Route path="whatsapp" element={<MasterProfRoute><Whatsapp /></MasterProfRoute>} />
        <Route path="bi" element={<GrowthRoute><LawyerBI /></GrowthRoute>} />
        <Route path="clients" element={<StarterRoute><Clients /></StarterRoute>} />
        <Route path="processes" element={<StarterRoute><Processes /></StarterRoute>} />
        <Route path="events" element={<GrowthRoute><Events /></GrowthRoute>} />
        <Route path="fees" element={<MasterProfRoute><Fees /></MasterProfRoute>} />
        <Route path="oab-simulator" element={<AcademicRoute><OabSimulator /></AcademicRoute>} />
        <Route path="tcc-assistant" element={<AcademicRoute><TccAssistant /></AcademicRoute>} />
        <Route path="academic-hub" element={<AcademicRoute><AcademicHub /></AcademicRoute>} />
        <Route path="document-generator" element={<GrowthRoute><DocumentGenerator /></GrowthRoute>} />
      </Route>





      <Route 
        path="/secret-admin-access-8822" 
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

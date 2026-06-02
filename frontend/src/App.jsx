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
import Subscription from './pages/dashboard/Subscription';
import Team from './pages/dashboard/Team';
import LawyerBI from './pages/dashboard/LawyerBI';
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
import ErpDashboard from './pages/dashboard/legal/ErpDashboard';
import AcademicHub from './pages/dashboard/AcademicHub';
import Signatures from './pages/dashboard/legal/Signatures';
import SignDocument from './pages/public/SignDocument';

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
  const plan = user?.subscriptionPlan || 'free';
  
  if (user?.parentUserId) {
    // Se for sub-conta de Equipe: especial (Advogado) e admin (Sócio) têm acesso
    const hasAccess = ['especial', 'admin', 'master'].includes(user.tipo);
    if (!hasAccess) return <Navigate to="/dashboard" replace />;
  } else {
    // Se for proprietário
    const hasAccess = isPrivileged || ['lawyer_starter', 'lawyer_growth', 'office_master', 'enterprise'].includes(plan);
    if (!hasAccess) return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Nível 2: Documentos, Agenda (Growth+)
const GrowthRoute = ({ children }) => {
  const { user } = useAuth();
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  const plan = user?.subscriptionPlan || 'free';
  
  if (user?.parentUserId) {
    // Se for sub-conta de Equipe: especial (Advogado) e admin (Sócio) têm acesso
    const hasAccess = ['especial', 'admin', 'master'].includes(user.tipo);
    if (!hasAccess) return <Navigate to="/dashboard/subscription" replace />;
  } else {
    // Se for proprietário
    const hasAccess = isPrivileged || ['lawyer_growth', 'office_master', 'enterprise'].includes(plan);
    if (!hasAccess) return <Navigate to="/dashboard/subscription" replace />;
  }
  return children;
};

// Rota de Assinaturas (Permite qualquer plano pago de advogados)
const SignaturesRoute = ({ children }) => {
  const { user } = useAuth();
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  const plan = user?.subscriptionPlan || 'free';
  const isStudentPlan = plan.startsWith('student_');
  
  if (user?.parentUserId) {
    // Se for sub-conta de Equipe: especial (Advogado) e admin (Sócio) têm acesso
    const hasAccess = ['especial', 'admin', 'master'].includes(user.tipo);
    if (!hasAccess) return <Navigate to="/dashboard/subscription" replace />;
  } else {
    // Se for proprietário
    const hasAccess = isPrivileged || (plan !== 'free' && !isStudentPlan);
    if (!hasAccess) return <Navigate to="/dashboard/subscription" replace />;
  }
  return children;
};

// Rota Específica do Gerador de Documentos (Growth+ ou Estudantes Pro e Master)
const DocumentGeneratorRoute = ({ children }) => {
  const { user } = useAuth();
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  const plan = user?.subscriptionPlan || 'free';
  
  if (user?.parentUserId) {
    // Se for sub-conta de Equipe: especial (Advogado) e admin (Sócio) têm acesso
    const hasAccess = ['especial', 'admin', 'master'].includes(user.tipo);
    if (!hasAccess) return <Navigate to="/dashboard/subscription" replace />;
  } else {
    // Se for proprietário
    const hasAccess = isPrivileged || ['lawyer_growth', 'office_master', 'enterprise', 'student_pro', 'student_master'].includes(plan);
    if (!hasAccess) return <Navigate to="/dashboard/subscription" replace />;
  }
  return children;
};

// Nível 3: Financeiro, Equipe, BI (Master+)
const MasterProfRoute = ({ children }) => {
  const { user } = useAuth();
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  const plan = user?.subscriptionPlan || 'free';
  
  if (user?.parentUserId) {
    // Se for sub-conta de Equipe: apenas admin (Sócio) tem acesso a recursos financeiros/equipe
    const hasAccess = ['admin', 'master'].includes(user.tipo);
    if (!hasAccess) return <Navigate to="/dashboard/subscription" replace />;
  } else {
    // Se for proprietário
    const hasAccess = isPrivileged || ['office_master', 'enterprise'].includes(plan);
    if (!hasAccess) return <Navigate to="/dashboard/subscription" replace />;
  }
  return children;
};

// Nível Estudante Pro/Acadêmico: OAB e TCC (Também liberado para Advogados)
const AcademicRoute = ({ children }) => {
  const { user } = useAuth();
  const plan = user?.subscriptionPlan || 'free';
  const isPrivileged = user?.tipo === 'admin' || user?.tipo === 'master';
  const hasProfessionalPlan = ['lawyer_starter', 'lawyer_growth', 'office_master', 'enterprise'].includes(plan);

  if (!isPrivileged && !['student_pro', 'student_master'].includes(plan) && !hasProfessionalPlan) {
    return <Navigate to="/dashboard/subscription" replace />;
  }
  return children;
};

function App() {
  // Route Load
  return (
    <Routes>
      <Route path="/sign/:token" element={<SignDocument />} />
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
        <Route path="bi" element={<GrowthRoute><LawyerBI /></GrowthRoute>} />
        {/* ERP Routes */}
        <Route path="erp" element={<GrowthRoute><ErpDashboard /></GrowthRoute>} />
        <Route path="clients" element={<StarterRoute><Clients /></StarterRoute>} />
        <Route path="processes" element={<StarterRoute><Processes /></StarterRoute>} />
        <Route path="events" element={<GrowthRoute><Events /></GrowthRoute>} />
        <Route path="finance" element={<MasterProfRoute><Fees /></MasterProfRoute>} /> {/* Using Fees component for now, will update later */}
        <Route path="fees" element={<MasterProfRoute><Fees /></MasterProfRoute>} />
        <Route path="oab-simulator" element={<AcademicRoute><OabSimulator /></AcademicRoute>} />
        <Route path="tcc-assistant" element={<AcademicRoute><TccAssistant /></AcademicRoute>} />
        <Route path="academic-hub" element={<AcademicRoute><AcademicHub /></AcademicRoute>} />
        <Route path="document-generator" element={<DocumentGeneratorRoute><DocumentGenerator /></DocumentGeneratorRoute>} />
        <Route path="signatures" element={<SignaturesRoute><Signatures /></SignaturesRoute>} />
      </Route>







      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../ui';

const MasterRoute = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && user && user.tipo !== 'master') {
      logout();
      navigate('/login?error=not_authorized', { replace: true });
    }
  }, [user, loading, logout, navigate]);

  if (loading) return <Loader text="Validando Acesso de Administrador..." />;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.tipo !== 'master') {
    return <Loader text="Redirecionando..." />;
  }
  
  return children;
};

export default MasterRoute;

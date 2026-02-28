import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../ui';

const MasterRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loader text="Validando Acesso de Administrador..." />;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.tipo !== 'master') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default MasterRoute;

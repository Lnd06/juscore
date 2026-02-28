import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Button, Input } from '../../components/ui';
import { Mail, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await axios.post('/api/auth/forgot-password', { email });
      navigate('/verify-code?email=' + email); 
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Recuperar Senha" 
      subtitle="Digite seu e-mail para receber as instruções."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {message && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm border border-green-200 dark:border-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 animate-pulse">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          Enviar Link de Recuperação
        </Button>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-accent transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;

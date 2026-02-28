import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Button, Input } from '../../components/ui';
import { Lock, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const NewPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    // Password complexity check
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('A senha deve ter no mínimo 6 caracteres, maiúscula, minúscula e número.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/auth/reset-password', { 
        email,
        codigo: token, 
        novaSenha: formData.password 
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Erro" subtitle="Link inválido ou expirado.">
        <Link to="/login" className="text-accent hover:underline">Voltar para Login</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Redefinir Senha" 
      subtitle="Crie uma nova senha segura. Mínimo de 6 caracteres."
    >
      {success ? (
        <div className="text-center space-y-4">
          <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-16 h-16 flex items-center justify-center mx-auto text-green-600">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Senha Alterada!</h3>
          <p className="text-gray-600 dark:text-gray-300">Você será redirecionado para o login em instantes.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nova Senha"
            type="password"
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="Nova senha forte"
          />
          <Input
            label="Confirmar Nova Senha"
            type="password"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            placeholder="Confirme a senha"
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Alterar Senha
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default NewPassword;

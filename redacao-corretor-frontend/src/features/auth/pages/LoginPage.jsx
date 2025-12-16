import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { Button } from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Página de Login
 * Form com email e password
 */
export const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setLoading, setError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorState(null); // Limpa erro ao digitar
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorState(null);

    try {
      // Login - tokens definidos em cookies httpOnly pelo backend
      const user = await authService.login(formData.email, formData.password);

      // Salva apenas dados do usuário no store
      setUser(user);

      // Redireciona para dashboard
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao fazer login';
      setErrorState(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full">
        {/* Card de Login */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Redação Corretor</h1>
            <p className="text-gray-600 mt-2">Faça login para continuar</p>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
            >
              Entrar
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          Sistema de correção de redações com anotações digitais
        </p>
      </div>
    </div>
  );
};

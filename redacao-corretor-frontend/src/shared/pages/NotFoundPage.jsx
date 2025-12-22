import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Página 404 (Not Found)
 * 
 * Responsabilidade:
 * - Exibir mensagem de erro amigável quando a rota não existe
 * - Redirecionar usuário para local apropriado baseado na autenticação
 * 
 * Princípios SOLID:
 * - SRP: Única responsabilidade de apresentar a UI de erro 404 e ação de saída
 */
export const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isTeacher } = useAuth();

  const handleBack = () => {
    if (!isAuthenticated) {
      // Se não estiver logado, vai para login
      // Passando state para possível feedback visual na tela de login
      navigate(ROUTES.LOGIN, { state: { error: 'Forbidden' } });
    } else {
      // Se estiver logado, redireciona baseado no tipo de usuário
      navigate(isTeacher() ? ROUTES.DASHBOARD : ROUTES.HOME);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <p className="text-xl text-gray-600 mt-4">Página não encontrada</p>
        <button
          onClick={handleBack}
          className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
};

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Componente para proteger rotas privadas
 * Redireciona para login se não autenticado
 * Pode exigir tipo específico de usuário (teacher)
 */
export const PrivateRoute = ({ children, requireTeacher = false }) => {
  const { isAuthenticated, user } = useAuth();

  // Não autenticado - redireciona para login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Requer professor mas usuário é aluno - redireciona para dashboard
  if (requireTeacher && user?.type !== 'teacher') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
};

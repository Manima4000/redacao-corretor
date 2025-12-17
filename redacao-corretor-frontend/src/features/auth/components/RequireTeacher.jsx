import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Componente de proteção de rotas para professores
 * SRP: Apenas verifica se o usuário é professor e redireciona se não for
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes filhos a renderizar se autorizado
 */
export const RequireTeacher = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se não for professor, redirecionar para home page do aluno
  if (user.type !== 'teacher') {
    return <Navigate to="/" replace />;
  }

  // Se for professor, renderizar os componentes filhos
  return children;
};

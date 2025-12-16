import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Sidebar - Menu lateral fixo
 * Exibe navegação e informações do usuário
 */
export const Sidebar = () => {
  const { user, logout, isTeacher } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout(); // Limpa cookies no backend
      logout(); // Limpa estado local
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpa estado local e redireciona
      logout();
      navigate(ROUTES.LOGIN);
    }
  };

  const menuItems = [
    {
      label: 'Dashboard',
      path: ROUTES.DASHBOARD,
      icon: '📊',
      show: true,
    },
    {
      label: 'Turmas',
      path: ROUTES.CLASSES,
      icon: '👥',
      show: true,
    },
    {
      label: 'Perfil',
      path: ROUTES.PROFILE,
      icon: '⚙️',
      show: true,
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Redação Corretor</h1>
        <p className="text-sm text-gray-400 mt-1">
          {isTeacher() ? 'Professor' : 'Aluno'}
        </p>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-700">
        <p className="text-sm font-medium truncate">{user?.fullName}</p>
        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems
          .filter((item) => item.show)
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};

import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Página Dashboard (Placeholder)
 * Será implementada futuramente com estatísticas
 */
export const DashboardPage = () => {
  const { user, isTeacher } = useAuth();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {user?.fullName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {isTeacher()
            ? 'Gerencie suas turmas e corrija redações'
            : 'Acesse suas tarefas e envie redações'
          }
        </p>
      </div>

      {/* Content Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-lg font-semibold text-gray-900">Turmas</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
          <p className="text-sm text-gray-600 mt-1">turmas ativas</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-gray-900">Tarefas</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
          <p className="text-sm text-gray-600 mt-1">tarefas criadas</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-semibold text-gray-900">Redações</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">0</p>
          <p className="text-sm text-gray-600 mt-1">
            {isTeacher() ? 'aguardando correção' : 'enviadas'}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          🚀 Dashboard em Desenvolvimento
        </h3>
        <p className="text-blue-800">
          Esta página será implementada futuramente com estatísticas detalhadas,
          gráficos e atalhos rápidos para suas ações mais frequentes.
        </p>
      </div>
    </div>
  );
};

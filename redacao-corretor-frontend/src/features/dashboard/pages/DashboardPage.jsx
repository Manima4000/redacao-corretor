import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { DashboardStatsCard } from '../components/DashboardStatsCard';

/**
 * Página Dashboard
 * Exibe estatísticas relevantes para o usuário (Professor ou Aluno)
 */
export const DashboardPage = () => {
  const { user, isTeacher } = useAuth();
  const { stats, loading } = useDashboardStats();

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

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardStatsCard
          icon="bi bi-people-fill"
          title="Turmas"
          value={stats.classCount}
          label={isTeacher() ? 'turmas ativas' : 'sua turma'}
          color="text-blue-600"
          loading={loading}
        />

        <DashboardStatsCard
          icon="bi bi-clipboard-data-fill"
          title="Tarefas"
          value={stats.taskCount}
          label={isTeacher() ? 'tarefas criadas' : 'tarefas atribuídas'}
          color="text-green-600"
          loading={loading}
        />

        <DashboardStatsCard
          icon="bi bi-file-earmark-text-fill"
          title="Redações"
          value={isTeacher() ? stats.pendingEssaysCount : stats.essayCount}
          label={isTeacher() ? 'aguardando correção' : 'enviadas'}
          color="text-purple-600"
          loading={loading}
        />
      </div>

      {/* Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          <i className="bi bi-rocket-takeoff-fill"></i> Resumo Geral
        </h3>
        <p className="text-blue-800">
           Aqui você encontra um resumo rápido das suas atividades no sistema. 
           Utilize o menu lateral para acessar o gerenciamento completo de cada área.
        </p>
      </div>
    </div>
  );
};
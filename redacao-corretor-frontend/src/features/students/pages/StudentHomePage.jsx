import { useAuth } from '@/features/auth/hooks/useAuth';
import { useStudentTasks } from '@/features/students/hooks/useStudentTasks';
import { StudentTaskCard } from '@/features/students/components/StudentTaskCard';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Card } from '@/shared/components/ui/Card';

/**
 * Página inicial do aluno
 * SRP: Apenas orquestra a exibição de tarefas do aluno
 *
 * Mostra tarefas pendentes e concluídas da turma do aluno
 */
export const StudentHomePage = () => {
  const { user } = useAuth();
  const { pendingTasks, completedTasks, isLoading, error } = useStudentTasks(user.classId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-8">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Olá, {user.fullName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Aqui estão suas tarefas de redação
        </p>
      </div>

      {/* Tarefas Pendentes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800">
            <i className="bi bi-file-earmark-text-fill"></i> Tarefas Pendentes ({pendingTasks.length})
          </h2>
        </div>

        {pendingTasks.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Nenhuma tarefa pendente no momento.
              </p>
              <p className="text-gray-400 mt-2">
                Você está em dia com suas redações! <i className="bi bi-emoji-smile"></i>
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingTasks.map((task) => (
              <StudentTaskCard key={task.id} task={task} isPending={true} />
            ))}
          </div>
        )}
      </div>

      {/* Tarefas Concluídas */}
      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              <i className="bi bi-check-circle-fill text-green-600"></i> Tarefas Concluídas ({completedTasks.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedTasks.map((task) => (
              <StudentTaskCard key={task.id} task={task} isPending={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

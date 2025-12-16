import { useParams, useNavigate } from 'react-router-dom';
import { useClassDetails } from '../hooks/useClassDetails';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { TaskList } from '@/features/tasks/components/TaskList';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';

export const ClassTasksPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { classData, isLoading: isLoadingClass, error: classError } = useClassDetails(id);
  
  // Busca tasks filtrando por classId
  const { tasks, isLoading: isLoadingTasks, error: tasksError } = useTasks({ classId: id });

  if (isLoadingClass || isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (classError || tasksError) {
    return (
      <div className="text-center text-red-600 mt-8">
        <p>{classError || tasksError}</p>
        <Button onClick={() => navigate('/classes')} variant="outline" className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  // Separar tasks baseado no deadline
  const now = new Date();
  const activeTasks = tasks.filter(task => new Date(task.deadline) >= now);
  const completedTasks = tasks.filter(task => new Date(task.deadline) < now);

  // Handler para navegar para detalhes da task
  const handleTaskClick = (taskId) => {
    navigate(`/classes/${id}/tasks/${taskId}`);
  };

  return (
    <div className="space-y-6">
      {/* Navegação */}
      <div>
        <Button
          variant="outline"
          onClick={() => navigate('/classes')}
          className="flex items-center gap-2 text-gray-600"
        >
          <span>←</span> Voltar para Turmas
        </Button>
      </div>

      {/* Header da Turma */}
      <div className="flex justify-between items-start bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
          <p className="text-gray-600 mt-2">{classData.description}</p>
          <div className="flex gap-4 mt-4 text-sm text-gray-500">
            <span>👥 {classData.studentCount} alunos</span>
            <span>📅 Criada em {new Date(classData.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        <div>
            {/* Botão para criar tarefa (futuro) */}
            <Button onClick={() => console.log('Nova Tarefa')}>
                Nova Tarefa
            </Button>
        </div>
      </div>

      {/* Listas de Tarefas */}
      <div className="space-y-8">
        <TaskList
          title="📝 Em Andamento"
          tasks={activeTasks}
          emptyMessage="Nenhuma tarefa em andamento no momento."
          onTaskClick={handleTaskClick}
        />

        <TaskList
          title="✅ Encerradas"
          tasks={completedTasks}
          emptyMessage="Nenhuma tarefa encerrada."
          onTaskClick={handleTaskClick}
        />
      </div>
    </div>
  );
};

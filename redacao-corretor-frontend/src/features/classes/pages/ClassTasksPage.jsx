import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassDetails } from '../hooks/useClassDetails';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { TaskList } from '@/features/tasks/components/TaskList';
import { AddStudentModal } from '../components/AddStudentModal';
import { classService } from '../services/classService';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { useToast } from '@/shared/hooks/useToast';

export const ClassTasksPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  
  const { classData, isLoading: isLoadingClass, error: classError, refetch: refetchClass } = useClassDetails(id);
  
  // Busca tasks filtrando por classId
  const { tasks, isLoading: isLoadingTasks, error: tasksError } = useTasks({ classId: id });

  const handleAddStudent = async (studentId) => {
    try {
      await classService.addStudent(id, studentId);
      toast.success('Aluno adicionado com sucesso!');
      setIsAddStudentModalOpen(false);
      refetchClass(); // Atualiza contador de alunos
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Erro ao adicionar aluno';
      toast.error(msg);
    }
  };

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
          <span><i className="bi bi-arrow-left" /></span> Voltar para Turmas
        </Button>
      </div>

      {/* Header da Turma */}
      <div className="flex justify-between items-start bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
          <p className="text-gray-600 mt-2">{classData.description}</p>
          <div className="flex gap-4 mt-4 text-sm text-gray-500">
            <span><i className="bi bi-people-fill" /> {classData.studentCount} alunos</span>
            <span><i className="bi bi-calendar-event" /> Criada em {new Date(classData.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
            <Button onClick={() => console.log('Nova Tarefa')}>
                Nova Tarefa
            </Button>
            <Button variant="outline" onClick={() => setIsAddStudentModalOpen(true)}>
                Adicionar Aluno
            </Button>
        </div>
      </div>

      {/* Listas de Tarefas */}
      <div className="space-y-8">
        <TaskList
          title={<><i className="bi bi-file-earmark-text-fill" /> Em Andamento</>}
          tasks={activeTasks}
          emptyMessage="Nenhuma tarefa em andamento no momento."
          onTaskClick={handleTaskClick}
        />

        <TaskList
          title={<><i className="bi bi-check-circle-fill" /> Encerradas</>}
          tasks={completedTasks}
          emptyMessage="Nenhuma tarefa encerrada."
          onTaskClick={handleTaskClick}
        />
      </div>

      <AddStudentModal 
        isOpen={isAddStudentModalOpen} 
        onClose={() => setIsAddStudentModalOpen(false)}
        onAddStudent={handleAddStudent}
      />
    </div>
  );
};

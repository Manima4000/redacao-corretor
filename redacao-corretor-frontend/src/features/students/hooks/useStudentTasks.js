import { useState, useEffect, useMemo } from 'react';
import { taskService } from '@/features/tasks/services/taskService';

/**
 * Hook customizado para gerenciar tarefas do aluno
 * SRP: Apenas gerencia estado e lógica de tarefas
 *
 * @param {string} classId - ID da turma do aluno
 * @returns {Object} Estado e métodos relacionados às tarefas
 */
export const useStudentTasks = (classId) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Busca tarefas da turma
   */
  const fetchTasks = async () => {
    if (!classId) {
      setError('ID da turma não fornecido');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await taskService.getTasksByClass(classId);
      setTasks(data || []);
    } catch (err) {
      console.error('Erro ao buscar tarefas:', err);
      setError('Erro ao carregar tarefas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Separa tarefas em pendentes e concluídas
   * Usa useMemo para evitar recalcular a cada render
   *
   * Lógica:
   * - Tarefa é PENDENTE se: prazo aberto E aluno não enviou
   * - Tarefa é CONCLUÍDA se: aluno já enviou OU prazo encerrado
   */
  const { pendingTasks, completedTasks } = useMemo(() => {
    const now = new Date();

    const pending = tasks.filter((task) => {
      // Se já enviou, não é pendente
      if (task.hasSubmitted) return false;

      // Se não enviou, verifica se o prazo ainda está aberto
      const deadline = task.deadline ? new Date(task.deadline) : null;
      return !deadline || deadline >= now;
    });

    const completed = tasks.filter((task) => {
      // Se já enviou, é concluída
      if (task.hasSubmitted) return true;

      // Se não enviou, só é concluída se o prazo passou
      const deadline = task.deadline ? new Date(task.deadline) : null;
      return deadline && deadline < now;
    });

    return {
      pendingTasks: pending,
      completedTasks: completed,
    };
  }, [tasks]);

  /**
   * Busca tarefas ao montar o componente
   */
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  return {
    tasks,
    pendingTasks,
    completedTasks,
    isLoading,
    error,
    refetch: fetchTasks,
  };
};

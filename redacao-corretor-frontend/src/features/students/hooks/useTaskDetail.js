import { useState, useEffect } from 'react';
import { taskService } from '@/features/tasks/services/taskService';

/**
 * Hook customizado para gerenciar detalhes de uma tarefa
 * SRP: Apenas gerencia estado e lógica de uma tarefa específica
 *
 * @param {string} taskId - ID da tarefa
 * @returns {Object} Estado e métodos relacionados à tarefa
 */
export const useTaskDetail = (taskId) => {
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Busca dados da tarefa
   */
  const fetchTask = async () => {
    if (!taskId) {
      setError('ID da tarefa não fornecido');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await taskService.getTaskById(taskId);
      setTask(data);
    } catch (err) {
      console.error('Erro ao buscar tarefa:', err);
      setError('Erro ao carregar tarefa. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verifica se a tarefa ainda está ativa (deadline não passou)
   */
  const isTaskActive = () => {
    if (!task || !task.deadline) return true;
    const deadline = new Date(task.deadline);
    const now = new Date();
    return deadline >= now;
  };

  /**
   * Verifica se o prazo está próximo (3 dias ou menos)
   */
  const isNearDeadline = () => {
    if (!task || !task.deadline) return false;
    const deadline = new Date(task.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
  };

  /**
   * Formata deadline para exibição
   */
  const formatDeadline = () => {
    if (!task || !task.deadline) return 'Sem prazo definido';

    const date = new Date(task.deadline);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Busca tarefa ao montar o componente
   */
  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  return {
    task,
    isLoading,
    error,
    isTaskActive: isTaskActive(),
    isNearDeadline: isNearDeadline(),
    formatDeadline: formatDeadline(),
    refetch: fetchTask,
  };
};

import { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';

/**
 * Hook para buscar alunos de uma tarefa com status de entrega
 * Segue SRP - apenas gerencia dados de alunos de uma task
 * @param {string} taskId - ID da tarefa
 */
export const useTaskStudents = (taskId) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!taskId) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await taskService.getTaskStudents(taskId);
        setData(result);
      } catch (err) {
        setError(err.response?.data?.error || 'Erro ao carregar alunos da tarefa');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [taskId]);

  return {
    task: data?.task,
    students: data?.students || [],
    stats: data?.stats,
    isLoading,
    error,
  };
};

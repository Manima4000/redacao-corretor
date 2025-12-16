import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';

/**
 * Hook para gerenciar operações de tarefas
 * @param {Object} initialFilters - Filtros iniciais (ex: { classId: '...' })
 */
export const useTasks = (initialFilters = {}) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async (filters = initialFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskService.getTasks(filters);
      setTasks(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar tarefas');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(initialFilters)]); // Recria se filtros mudarem

  useEffect(() => {
    // Só busca automaticamente se tiver algum filtro relevante (opcional, mas bom pra evitar chamadas desnecessárias)
    if (Object.keys(initialFilters).length > 0) {
      fetchTasks();
    }
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
  };
};

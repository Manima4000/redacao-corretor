import { useState, useEffect } from 'react';
import { essayService } from '../services/essayService';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Hook para gerenciar estado de redação
 *
 * Responsabilidades:
 * - Carregar dados de uma redação por ID
 * - Gerenciar estados de loading e erro
 * - Mostrar toasts de erro
 *
 * Segue SOLID:
 * - SRP: Apenas gerencia estado de essay (não faz UI, não faz lógica de negócio)
 * - Reutilizável: Pode ser usado em qualquer componente que precise de dados de essay
 *
 * @param {string} essayId - ID da redação a carregar
 * @returns {Object} { essay, isLoading, error, reload }
 *
 * @example
 * const { essay, isLoading, error } = useEssay(essayId);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * return <div>{essay.student.fullName}</div>;
 */
export const useEssay = (essayId) => {
  const [essay, setEssay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  /**
   * Carrega dados da redação
   */
  const loadEssay = async () => {
    if (!essayId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await essayService.getEssayById(essayId);
      setEssay(data);
    } catch (err) {
      console.error('Erro ao carregar redação:', err);
      const errorMessage = err.response?.data?.error || 'Erro ao carregar redação';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega ao montar ou quando essayId muda
  useEffect(() => {
    loadEssay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [essayId]);

  return {
    essay,
    isLoading,
    error,
    reload: loadEssay, // Permite recarregar manualmente
  };
};

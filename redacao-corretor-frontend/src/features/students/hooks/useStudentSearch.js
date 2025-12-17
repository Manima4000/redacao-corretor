import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/studentService';

/**
 * Hook para pesquisar alunos
 * SRP: Gerencia estado e lógica de busca de alunos
 */
export const useStudentSearch = () => {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const search = async () => {
      // Limpa resultados se a busca for muito curta
      if (query.length < 3) {
        setStudents([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await studentService.searchStudents(query);
        setStudents(results);
      } catch (err) {
        console.error('Erro ao buscar alunos:', err);
        setError('Erro ao buscar alunos');
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce de 300ms para evitar muitas requisições
    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  /**
   * Reseta o estado da busca
   */
  const reset = useCallback(() => {
    setQuery('');
    setStudents([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    students,
    isLoading,
    error,
    reset,
  };
};

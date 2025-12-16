import { useState, useEffect } from 'react';
import { classService } from '../services/classService';

export const useClassDetails = (classId) => {
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) return;
      
      setIsLoading(true);
      try {
        const data = await classService.getClassById(classId);
        setClassData(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Erro ao carregar turma');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClass();
  }, [classId]);

  return { classData, isLoading, error };
};

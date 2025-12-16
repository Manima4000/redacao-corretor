import { useState, useEffect } from 'react';
import { classService } from '../services/classService';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClasses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters = user?.type === 'teacher' ? { teacherId: user.id } : {};
      const data = await classService.getClasses(filters);
      setClasses(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar turmas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [user?.id]);

  return { classes, isLoading, error, refetch: fetchClasses };
};

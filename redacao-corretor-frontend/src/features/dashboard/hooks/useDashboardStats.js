import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Hook para gerenciar dados do dashboard
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    classCount: 0,
    taskCount: 0,
    pendingEssaysCount: 0,
    essayCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      showToast('Erro ao carregar estatísticas do dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    refreshStats: fetchStats,
  };
};

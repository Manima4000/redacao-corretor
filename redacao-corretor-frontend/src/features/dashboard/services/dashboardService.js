import api from '@/shared/services/api';

const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  },
};

export default dashboardService;

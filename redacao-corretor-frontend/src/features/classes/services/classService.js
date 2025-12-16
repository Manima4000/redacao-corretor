import api from '@/shared/services/api';

export const classService = {
  async getClasses(filters = {}) {
    const params = new URLSearchParams();
    if (filters.teacherId) params.append('teacherId', filters.teacherId);

    const response = await api.get(`/classes?${params.toString()}`);
    return response.data.data;
  },

  async getClassById(id) {
    const response = await api.get(`/classes/${id}`);
    return response.data.data;
  },

  async createClass(classData) {
    const response = await api.post('/classes', classData);
    return response.data.data;
  },

  async updateClass(id, classData) {
    const response = await api.put(`/classes/${id}`, classData);
    return response.data.data;
  },

  async deleteClass(id) {
    await api.delete(`/classes/${id}`);
  },
};

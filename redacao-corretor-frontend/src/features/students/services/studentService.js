import api from '@/shared/services/api';

export const studentService = {
  /**
   * Busca alunos por nome
   * @param {string} query - Nome para pesquisar
   * @returns {Promise<Array>} Lista de alunos
   */
  async searchStudents(query) {
    const response = await api.get(`/students/search`, {
      params: { query },
    });
    return response.data.data;
  },
};

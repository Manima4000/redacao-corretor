import api from '@/shared/services/api';

/**
 * Service para gerenciar uploads de redações
 * SRP: Apenas chamadas de API relacionadas a essays
 */
export const essayService = {
  /**
   * Faz upload de redação
   * @param {string} taskId - ID da tarefa
   * @param {File} file - Arquivo a ser enviado
   * @returns {Promise<Object>} Dados da redação criada
   */
  async uploadEssay(taskId, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);

    const response = await api.post('/essays/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  /**
   * Busca redação de uma tarefa específica do aluno
   * @param {string} taskId - ID da tarefa
   * @returns {Promise<Object|null>} Redação do aluno ou null
   */
  async getStudentEssay(taskId) {
    try {
      const response = await api.get(`/essays/task/${taskId}/student`);
      return response.data.data;
    } catch (error) {
      // Se retornar 404, não há redação
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Busca redação por ID
   * @param {string} essayId - ID da redação
   * @returns {Promise<Object>} Dados da redação
   */
  async getEssayById(essayId) {
    const response = await api.get(`/essays/${essayId}`);
    return response.data.data;
  },

  /**
   * Deleta redação (para reenviar)
   * @param {string} essayId - ID da redação
   * @returns {Promise<void>}
   */
  async deleteEssay(essayId) {
    await api.delete(`/essays/${essayId}`);
  },

  /**
   * Finaliza correção de redação com nota e comentários
   * @param {string} essayId - ID da redação
   * @param {number} grade - Nota (0-10)
   * @param {string} writtenFeedback - Comentários escritos (opcional)
   * @returns {Promise<Object>} Redação atualizada
   */
  async finalizeEssay(essayId, grade, writtenFeedback) {
    const response = await api.put(`/essays/${essayId}/finalize`, {
      grade,
      writtenFeedback,
    });
    return response.data.data;
  },
};

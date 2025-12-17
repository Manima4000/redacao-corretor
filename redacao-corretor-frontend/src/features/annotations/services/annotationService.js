import api from '@/shared/services/api';

/**
 * Service para gerenciar anotações de redações
 * SRP: Apenas chamadas de API relacionadas a annotations
 */
export const annotationService = {
  /**
   * Busca anotações de uma redação
   * @param {string} essayId - ID da redação
   * @param {number} [page] - Número da página (opcional, para PDFs com múltiplas páginas)
   * @returns {Promise<Object>} Dados das anotações
   */
  async getAnnotations(essayId, page = null) {
    const params = page ? { page } : {};
    const response = await api.get(`/essays/${essayId}/annotations`, { params });
    return response.data.data;
  },

  /**
   * Salva ou atualiza anotações de uma redação
   * @param {string} essayId - ID da redação
   * @param {Object} annotationData - Dados das anotações (version, lines)
   * @param {number} pageNumber - Número da página (default: 1)
   * @returns {Promise<Object>} Dados das anotações salvas
   */
  async saveAnnotations(essayId, annotationData, pageNumber = 1) {
    const response = await api.post(`/essays/${essayId}/annotations`, {
      annotationData,
      pageNumber,
    });
    return response.data.data;
  },

  /**
   * Atualiza o status de uma redação
   * @param {string} essayId - ID da redação
   * @param {string} status - Novo status ('pending', 'correcting', 'corrected')
   * @returns {Promise<Object>} Dados da redação atualizada
   */
  async updateEssayStatus(essayId, status) {
    const response = await api.patch(`/essays/${essayId}/status`, { status });
    return response.data.data;
  },
};

/**
 * Interface para repositório de anotações
 *
 * Segue SOLID:
 * - ISP (Interface Segregation): Interface específica para anotações
 * - DIP (Dependency Inversion): Use cases dependem desta abstração
 * - OCP (Open/Closed): Permite diferentes implementações sem modificar código
 *
 * @interface
 */
export class IAnnotationRepository {
  /**
   * Salva ou atualiza anotações de uma redação
   * Se já existir anotação, atualiza. Caso contrário, cria nova.
   *
   * @async
   * @param {string} essayId - ID da redação
   * @param {Object} annotationData - Dados da anotação (JSONB)
   * @param {number} pageNumber - Número da página (padrão: 1)
   * @returns {Promise<Object>} Anotação salva
   * @throws {Error} Não implementado
   */
  async saveOrUpdate(essayId, annotationData, pageNumber = 1) {
    throw new Error('Method saveOrUpdate() must be implemented');
  }

  /**
   * Busca anotações de uma redação
   *
   * @async
   * @param {string} essayId - ID da redação
   * @returns {Promise<Array>} Lista de anotações (por página)
   * @throws {Error} Não implementado
   */
  async findByEssay(essayId) {
    throw new Error('Method findByEssay() must be implemented');
  }

  /**
   * Busca anotação de uma página específica
   *
   * @async
   * @param {string} essayId - ID da redação
   * @param {number} pageNumber - Número da página
   * @returns {Promise<Object|null>} Anotação ou null
   * @throws {Error} Não implementado
   */
  async findByPage(essayId, pageNumber) {
    throw new Error('Method findByPage() must be implemented');
  }

  /**
   * Deleta todas as anotações de uma redação
   *
   * @async
   * @param {string} essayId - ID da redação
   * @returns {Promise<boolean>} True se deletado
   * @throws {Error} Não implementado
   */
  async deleteByEssay(essayId) {
    throw new Error('Method deleteByEssay() must be implemented');
  }

  /**
   * Deleta anotação de uma página específica
   *
   * @async
   * @param {string} essayId - ID da redação
   * @param {number} pageNumber - Número da página
   * @returns {Promise<boolean>} True se deletado
   * @throws {Error} Não implementado
   */
  async deleteByPage(essayId, pageNumber) {
    throw new Error('Method deleteByPage() must be implemented');
  }
}

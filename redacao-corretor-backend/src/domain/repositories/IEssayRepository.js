/**
 * Interface para repositório de redações (essays)
 *
 * Define o contrato para operações de banco de dados relacionadas a redações.
 * Segue princípios SOLID:
 * - ISP (Interface Segregation): Interface focada apenas em essays
 * - DIP (Dependency Inversion): Use Cases dependem da abstração
 */
export class IEssayRepository {
  /**
   * Cria uma nova redação
   *
   * @async
   * @param {Object} essayData - Dados da redação
   * @param {string} essayData.taskId - ID da tarefa
   * @param {string} essayData.studentId - ID do aluno
   * @param {string} essayData.fileUrl - URL/ID do arquivo no storage
   * @returns {Promise<Object>} Redação criada
   */
  async create(essayData) {
    throw new Error('Method create() must be implemented');
  }

  /**
   * Busca redação por ID
   *
   * @async
   * @param {string} essayId - ID da redação
   * @returns {Promise<Object|null>} Redação ou null se não encontrada
   */
  async findById(essayId) {
    throw new Error('Method findById() must be implemented');
  }

  /**
   * Busca redação de um aluno em uma tarefa específica
   *
   * @async
   * @param {string} taskId - ID da tarefa
   * @param {string} studentId - ID do aluno
   * @returns {Promise<Object|null>} Redação ou null se não encontrada
   */
  async findByTaskAndStudent(taskId, studentId) {
    throw new Error('Method findByTaskAndStudent() must be implemented');
  }

  /**
   * Lista redações de uma tarefa
   *
   * @async
   * @param {string} taskId - ID da tarefa
   * @returns {Promise<Array>} Lista de redações
   */
  async findByTask(taskId) {
    throw new Error('Method findByTask() must be implemented');
  }

  /**
   * Lista redações de um aluno
   *
   * @async
   * @param {string} studentId - ID do aluno
   * @returns {Promise<Array>} Lista de redações
   */
  async findByStudent(studentId) {
    throw new Error('Method findByStudent() must be implemented');
  }

  /**
   * Atualiza status da redação
   *
   * @async
   * @param {string} essayId - ID da redação
   * @param {string} status - Novo status (pending, correcting, corrected)
   * @returns {Promise<Object>} Redação atualizada
   */
  async updateStatus(essayId, status) {
    throw new Error('Method updateStatus() must be implemented');
  }

  /**
   * Deleta uma redação
   *
   * @async
   * @param {string} essayId - ID da redação
   * @returns {Promise<boolean>} True se deletado com sucesso
   */
  async delete(essayId) {
    throw new Error('Method delete() must be implemented');
  }
}

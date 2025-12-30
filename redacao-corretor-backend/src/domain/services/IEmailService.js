/**
 * Interface for Email Service
 *
 * Seguindo o princípio de Inversão de Dependência (DIP),
 * os Use Cases dependem desta abstração, não da implementação concreta.
 */
export class IEmailService {
  /**
   * Envia email de lembrete de prazo próximo
   * @param {Object} params
   * @param {string} params.to - Email do destinatário
   * @param {string} params.studentName - Nome do aluno
   * @param {string} params.taskTitle - Título da tarefa
   * @param {string} params.className - Nome da turma
   * @param {Date} params.deadline - Prazo da tarefa
   * @returns {Promise<void>}
   */
  async sendDeadlineReminder({ to, studentName, taskTitle, className, deadline }) {
    throw new Error('Method sendDeadlineReminder must be implemented');
  }

  /**
   * Envia email de correção finalizada
   * @param {Object} params
   * @param {string} params.to - Email do destinatário
   * @param {string} params.studentName - Nome do aluno
   * @param {string} params.taskTitle - Título da tarefa
   * @param {string} params.className - Nome da turma
   * @param {number} params.grade - Nota da redação
   * @param {string} [params.writtenFeedback] - Comentários da professora
   * @param {string} [params.essayUrl] - URL da redação corrigida
   * @returns {Promise<void>}
   */
  async sendCorrectionCompleted({ to, studentName, taskTitle, className, grade, writtenFeedback, essayUrl }) {
    throw new Error('Method sendCorrectionCompleted must be implemented');
  }

  /**
   * Verifica se o serviço de email está configurado corretamente
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    throw new Error('Method verifyConnection must be implemented');
  }
}

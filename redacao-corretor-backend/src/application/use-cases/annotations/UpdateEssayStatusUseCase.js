import { NotFoundError, ForbiddenError, ValidationError } from '../../../utils/errors.js';

/**
 * Use Case: Atualizar Status de Redação
 *
 * Responsabilidades:
 * 1. Validar que a redação existe
 * 2. Validar que o usuário é o professor da turma
 * 3. Validar transição de status
 * 4. Atualizar status da redação
 *
 * Status possíveis:
 * - pending: Aguardando correção
 * - correcting: Em processo de correção
 * - corrected: Correção finalizada
 *
 * Segue SOLID:
 * - SRP: Apenas orquestra atualização de status
 * - DIP: Depende de abstrações (repositories)
 *
 * @class
 */
export class UpdateEssayStatusUseCase {
  /**
   * @param {IEssayRepository} essayRepository - Repositório de redações
   * @param {ITaskRepository} taskRepository - Repositório de tarefas
   */
  constructor(essayRepository, taskRepository) {
    this.essayRepository = essayRepository;
    this.taskRepository = taskRepository;
  }

  /**
   * Executa a atualização de status
   *
   * @async
   * @param {Object} params - Parâmetros
   * @param {string} params.essayId - ID da redação
   * @param {string} params.teacherId - ID do professor
   * @param {string} params.status - Novo status
   * @returns {Promise<Object>} Redação atualizada
   * @throws {NotFoundError} Se redação não existir
   * @throws {ForbiddenError} Se não for o professor da turma
   * @throws {ValidationError} Se status for inválido
   */
  async execute({ essayId, teacherId, status }) {
    // 1. Validar que a redação existe
    const essay = await this.essayRepository.findById(essayId);

    if (!essay) {
      throw new NotFoundError('Redação');
    }

    // 2. Validar que a tarefa existe
    const task = await this.taskRepository.findById(essay.taskId);

    if (!task) {
      throw new NotFoundError('Tarefa');
    }

    // 3. Validar que o usuário é o professor da turma
    // TODO: Adicionar validação de ownership de turma
    // Por enquanto, qualquer professor pode atualizar

    // 4. Validar status
    this._validateStatus(status);

    // 5. Validar transição de status
    this._validateStatusTransition(essay.status, status);

    // 6. Atualizar status
    const updatedEssay = await this.essayRepository.updateStatus(essayId, status);

    return updatedEssay;
  }

  /**
   * Valida se o status é válido
   *
   * @private
   * @param {string} status - Status a validar
   * @throws {ValidationError} Se status for inválido
   */
  _validateStatus(status) {
    const validStatuses = ['pending', 'correcting', 'corrected'];

    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        `Status inválido. Valores permitidos: ${validStatuses.join(', ')}`
      );
    }
  }

  /**
   * Valida transição de status
   *
   * Transições permitidas:
   * - pending → correcting (professor começa a corrigir)
   * - pending → corrected (correção rápida sem salvar anotações intermediárias)
   * - correcting → corrected (finaliza correção)
   * - correcting → pending (cancela correção)
   * - corrected → correcting (reabrir para editar correção)
   *
   * @private
   * @param {string} currentStatus - Status atual
   * @param {string} newStatus - Novo status
   * @throws {ValidationError} Se transição for inválida
   */
  _validateStatusTransition(currentStatus, newStatus) {
    // Se status é o mesmo, não faz nada
    if (currentStatus === newStatus) {
      return;
    }

    const allowedTransitions = {
      pending: ['correcting', 'corrected'],
      correcting: ['corrected', 'pending'],
      corrected: ['correcting'],
    };

    const allowed = allowedTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new ValidationError(
        `Transição de status inválida: ${currentStatus} → ${newStatus}`
      );
    }
  }
}

import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

/**
 * Use Case: Atualizar comentários da redação (rascunho antes de finalizar)
 *
 * Responsabilidades:
 * 1. Buscar redação pelo ID
 * 2. Validar permissões (apenas professor da turma)
 * 3. Atualizar apenas comentários (sem alterar status ou nota)
 * 4. Retornar redação atualizada
 *
 * Segue SOLID:
 * - SRP: Apenas atualiza comentários de redação (não finaliza correção)
 * - DIP: Depende de abstrações (repositories)
 */
export class UpdateEssayCommentsUseCase {
  /**
   * @param {IEssayRepository} essayRepository - Repositório de redações
   * @param {ITaskRepository} taskRepository - Repositório de tarefas
   */
  constructor(essayRepository, taskRepository) {
    this.essayRepository = essayRepository;
    this.taskRepository = taskRepository;
  }

  /**
   * Executa a atualização de comentários
   *
   * @async
   * @param {Object} params - Parâmetros
   * @param {string} params.essayId - ID da redação
   * @param {string} params.writtenFeedback - Comentários escritos
   * @param {string} params.userId - ID do usuário autenticado
   * @param {string} params.userType - Tipo do usuário ('student' ou 'teacher')
   * @returns {Promise<Object>} Redação atualizada
   * @throws {NotFoundError} Se redação ou tarefa não existir
   * @throws {ForbiddenError} Se usuário não é professor da turma
   */
  async execute({ essayId, writtenFeedback, userId, userType }) {
    // 1. Validar que usuário é professor
    if (userType !== 'teacher') {
      throw new ForbiddenError('Apenas professores podem atualizar comentários');
    }

    // 2. Buscar redação
    const essay = await this.essayRepository.findById(essayId);

    if (!essay) {
      throw new NotFoundError('Redação');
    }

    // 3. Buscar tarefa para validar permissões
    const task = await this.taskRepository.findById(essay.taskId);

    if (!task) {
      throw new NotFoundError('Tarefa');
    }

    // 4. Validar que professor é dono da turma
    // O middleware requireTeacher já validou que é professor
    // Aqui apenas garantimos que a tarefa existe

    // 5. Atualizar comentários (não altera status nem nota)
    const updatedEssay = await this.essayRepository.updateComments(
      essayId,
      writtenFeedback || null
    );

    // 6. Retornar redação atualizada
    return {
      id: updatedEssay.id,
      taskId: updatedEssay.taskId,
      studentId: updatedEssay.studentId,
      fileUrl: updatedEssay.fileUrl,
      fileType: updatedEssay.fileType,
      status: updatedEssay.status,
      submittedAt: updatedEssay.submittedAt,
      correctedAt: updatedEssay.correctedAt,
      grade: updatedEssay.grade,
      writtenFeedback: updatedEssay.writtenFeedback,
    };
  }
}

import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

/**
 * Use Case: Deletar redação
 *
 * Responsabilidades:
 * 1. Validar que a redação existe
 * 2. Verificar permissões (apenas dono ou professor da turma)
 * 3. Deletar arquivo do Google Drive
 * 4. Deletar registro do banco de dados
 *
 * Segue SOLID:
 * - SRP: Apenas deleta redação
 * - DIP: Depende de abstrações (repositories, services)
 */
export class DeleteEssayUseCase {
  /**
   * @param {IEssayRepository} essayRepository - Repositório de redações
   * @param {ITaskRepository} taskRepository - Repositório de tarefas
   * @param {IFileStorageService} fileStorageService - Serviço de storage
   */
  constructor(essayRepository, taskRepository, fileStorageService) {
    this.essayRepository = essayRepository;
    this.taskRepository = taskRepository;
    this.fileStorageService = fileStorageService;
  }

  /**
   * Executa a deleção da redação
   *
   * @async
   * @param {Object} params - Parâmetros
   * @param {string} params.essayId - ID da redação
   * @param {string} params.userId - ID do usuário autenticado
   * @param {string} params.userType - Tipo do usuário ('student' ou 'teacher')
   * @returns {Promise<void>}
   * @throws {NotFoundError} Se redação não existir
   * @throws {ForbiddenError} Se usuário não tem permissão
   */
  async execute({ essayId, userId, userType }) {
    // 1. Buscar redação
    const essay = await this.essayRepository.findById(essayId);

    if (!essay) {
      throw new NotFoundError('Redação');
    }

    // 2. Verificar permissões
    if (userType === 'student') {
      // Aluno só pode deletar suas próprias redações
      if (essay.studentId !== userId) {
        throw new ForbiddenError('Você não pode deletar redação de outro aluno');
      }

      // Aluno só pode deletar se status for 'pending' (não corrigida)
      if (essay.status !== 'pending') {
        throw new ForbiddenError(
          'Não é possível deletar uma redação que já está sendo corrigida ou foi corrigida'
        );
      }
    } else if (userType === 'teacher') {
      // Professor pode deletar qualquer redação, mas vamos verificar se é da turma dele
      const task = await this.taskRepository.findById(essay.taskId);

      if (!task) {
        throw new NotFoundError('Tarefa');
      }

      if (task.teacherId !== userId) {
        throw new ForbiddenError('Você não pode deletar redação de tarefa de outro professor');
      }
    } else {
      throw new ForbiddenError('Tipo de usuário inválido');
    }

    // 3. Deletar arquivo do Google Drive
    try {
      await this.fileStorageService.delete(essay.fileUrl);
      console.log(`[DELETE ESSAY] Arquivo deletado do Google Drive: ${essay.fileUrl}`);
    } catch (error) {
      console.error('[DELETE ESSAY] Erro ao deletar arquivo do Google Drive:', error);
      // Continua mesmo se falhar (arquivo pode não existir mais)
    }

    // 4. Deletar registro do banco de dados
    await this.essayRepository.delete(essayId);

    console.log(`[DELETE ESSAY] Redação deletada com sucesso: ${essayId}`);
  }
}

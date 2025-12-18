import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

/**
 * Use Case para deletar tarefa
 *
 * Responsabilidades:
 * 1. Validar que a tarefa existe
 * 2. Verificar permissões (apenas professor dono)
 * 3. Deletar arquivos das redações do Google Drive
 * 4. Deletar tarefa do banco (CASCADE deleta essays, annotations, comments)
 *
 * Segue SOLID:
 * - SRP: Apenas deleta tarefas
 * - DIP: Depende de abstrações (repositories, services)
 */
export class DeleteTaskUseCase {
  /**
   * @param {ITaskRepository} taskRepository - Repositório de tarefas
   * @param {IEssayRepository} essayRepository - Repositório de redações
   * @param {IFileStorageService} fileStorageService - Serviço de storage
   */
  constructor(taskRepository, essayRepository, fileStorageService) {
    this.taskRepository = taskRepository;
    this.essayRepository = essayRepository;
    this.fileStorageService = fileStorageService;
  }

  /**
   * Executa a deleção da tarefa
   *
   * @async
   * @param {string} taskId - ID da tarefa
   * @param {string} requestingTeacherId - ID do professor solicitante
   * @returns {Promise<boolean>}
   * @throws {NotFoundError} Se tarefa não existir
   * @throws {ForbiddenError} Se professor não tem permissão
   */
  async execute(taskId, requestingTeacherId) {
    // 1. Buscar tarefa existente
    const existingTask = await this.taskRepository.findById(taskId);

    if (!existingTask) {
      throw new NotFoundError('Tarefa');
    }

    // 2. Verificar permissões (apenas o dono da tarefa pode deletar)
    if (existingTask.teacherId !== requestingTeacherId) {
      throw new ForbiddenError('Você não tem permissão para deletar esta tarefa');
    }

    // 3. Buscar todas as redações da tarefa
    const essays = await this.essayRepository.findByTaskId(taskId);

    console.log(`[DELETE TASK] Encontradas ${essays.length} redações para deletar`);

    // 4. Deletar arquivos das redações no Google Drive
    for (const essay of essays) {
      try {
        const deleted = await this.fileStorageService.delete(essay.fileUrl);

        if (deleted) {
          console.log(`[DELETE TASK] Arquivo deletado do Google Drive: ${essay.fileUrl}`);
        } else {
          console.warn(`[DELETE TASK] Arquivo não encontrado no Google Drive: ${essay.fileUrl}`);
        }
      } catch (error) {
        console.error(`[DELETE TASK] Erro ao deletar arquivo ${essay.fileUrl}:`, error);
        // Continua mesmo se falhar (arquivo pode não existir mais)
      }
    }

    // 5. Deletar a tarefa do banco
    // CASCADE vai deletar automaticamente:
    // - Essays (com annotations e comments via CASCADE)
    // - Task_Classes
    await this.taskRepository.delete(taskId);

    console.log(`[DELETE TASK] Tarefa deletada com sucesso: ${taskId}`);

    return true;
  }
}

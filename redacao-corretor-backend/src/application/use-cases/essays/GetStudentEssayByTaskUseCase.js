import { NotFoundError } from '../../../utils/errors.js';

/**
 * Use Case: Buscar redação do aluno para uma tarefa
 *
 * Responsabilidades:
 * 1. Validar que a tarefa existe
 * 2. Buscar redação do aluno autenticado para essa tarefa
 * 3. Retornar URL pública do arquivo
 *
 * Segue SOLID:
 * - SRP: Apenas busca redação de um aluno para uma tarefa
 * - DIP: Depende de abstrações (repositories, services)
 */
export class GetStudentEssayByTaskUseCase {
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
   * Executa a busca da redação
   *
   * @async
   * @param {Object} params - Parâmetros
   * @param {string} params.taskId - ID da tarefa
   * @param {string} params.studentId - ID do aluno autenticado
   * @returns {Promise<Object|null>} Redação com URL pública ou null se não encontrada
   * @throws {NotFoundError} Se tarefa não existir
   */
  async execute({ taskId, studentId }) {
    // 1. Validar que a tarefa existe
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Tarefa');
    }

    // 2. Buscar redação do aluno para esta tarefa
    const essay = await this.essayRepository.findByTaskAndStudent(
      taskId,
      studentId
    );

    // Se não encontrou, retornar null (não é erro)
    if (!essay) {
      return null;
    }

    // 3. Obter URL pública do arquivo
    const publicUrl = await this.fileStorageService.getPublicUrl(essay.fileUrl);

    return {
      ...essay,
      publicUrl,
    };
  }
}

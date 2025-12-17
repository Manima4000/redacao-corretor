import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

/**
 * Use Case: Buscar imagem da redação (proxy)
 *
 * Responsabilidades:
 * 1. Buscar redação pelo ID
 * 2. Validar permissões (professor da turma OU aluno dono)
 * 3. Baixar arquivo do Google Drive
 * 4. Retornar stream da imagem
 *
 * Segue SOLID:
 * - SRP: Apenas busca e retorna imagem
 * - DIP: Depende de abstrações (repositories, services)
 */
export class GetEssayImageUseCase {
  /**
   * @param {IEssayRepository} essayRepository - Repositório de redações
   * @param {ITaskRepository} taskRepository - Repositório de tarefas
   * @param {IStudentRepository} studentRepository - Repositório de alunos
   * @param {IFileStorageService} fileStorageService - Serviço de storage
   */
  constructor(essayRepository, taskRepository, studentRepository, fileStorageService) {
    this.essayRepository = essayRepository;
    this.taskRepository = taskRepository;
    this.studentRepository = studentRepository;
    this.fileStorageService = fileStorageService;
  }

  /**
   * Executa a busca da imagem
   *
   * @async
   * @param {Object} params - Parâmetros
   * @param {string} params.essayId - ID da redação
   * @param {string} params.userId - ID do usuário autenticado
   * @param {string} params.userType - Tipo do usuário ('student' ou 'teacher')
   * @returns {Promise<Object>} { buffer, mimetype }
   * @throws {NotFoundError} Se redação não existir
   * @throws {ForbiddenError} Se usuário não tem permissão
   */
  async execute({ essayId, userId, userType }) {
    // 1. Buscar redação
    const essay = await this.essayRepository.findById(essayId);

    if (!essay) {
      throw new NotFoundError('Redação');
    }

    // 2. Buscar dados relacionados para validar permissões
    const task = await this.taskRepository.findById(essay.taskId);
    const student = await this.studentRepository.findById(essay.studentId);

    if (!task) {
      throw new NotFoundError('Tarefa');
    }

    if (!student) {
      throw new NotFoundError('Aluno');
    }

    // 3. Validar permissões
    const isOwner = userType === 'student' && userId === essay.studentId;
    const isTeacherOfClass = userType === 'teacher' && task.classIds && task.classIds.includes(student.classId);

    if (!isOwner && !isTeacherOfClass) {
      throw new ForbiddenError('Você não tem permissão para acessar esta redação');
    }

    // 4. Baixar arquivo do Google Drive
    const buffer = await this.fileStorageService.downloadFile(essay.fileUrl);

    // 5. Retornar buffer e tipo MIME
    return {
      buffer,
      mimetype: essay.fileType || 'image/jpeg',
    };
  }
}

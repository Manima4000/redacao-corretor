import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

/**
 * Use Case: Buscar redação por ID
 *
 * Responsabilidades:
 * 1. Buscar redação pelo ID
 * 2. Validar permissões (professor da turma OU aluno dono)
 * 3. Retornar redação com URL pública e dados relacionados
 *
 * Segue SOLID:
 * - SRP: Apenas busca redação por ID
 * - DIP: Depende de abstrações (repositories, services)
 */
export class GetEssayByIdUseCase {
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
   * Executa a busca da redação
   *
   * @async
   * @param {Object} params - Parâmetros
   * @param {string} params.essayId - ID da redação
   * @param {string} params.userId - ID do usuário autenticado
   * @param {string} params.userType - Tipo do usuário ('student' ou 'teacher')
   * @returns {Promise<Object>} Redação com dados relacionados
   * @throws {NotFoundError} Se redação não existir
   * @throws {ForbiddenError} Se usuário não tem permissão
   */
  async execute({ essayId, userId, userType }) {
    // 1. Buscar redação
    const essay = await this.essayRepository.findById(essayId);

    if (!essay) {
      throw new NotFoundError('Redação');
    }

    // 2. Buscar dados relacionados
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

    // 4. Gerar URL pública
    const publicUrl = await this.fileStorageService.getPublicUrl(essay.fileUrl);

    // 5. Retornar redação com dados relacionados
    return {
      id: essay.id,
      taskId: essay.taskId,
      studentId: essay.studentId,
      fileUrl: essay.fileUrl,
      publicUrl,
      fileType: essay.fileType,
      status: essay.status,
      submittedAt: essay.submittedAt,
      correctedAt: essay.correctedAt,
      createdAt: essay.createdAt,
      updatedAt: essay.updatedAt,

      // Dados relacionados
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        classId: task.classIds?.[0], // Pega primeiro classId para compatibilidade
      },
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        enrollmentNumber: student.enrollmentNumber,
      },
    };
  }
}

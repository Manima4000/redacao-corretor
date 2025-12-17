import { NotFoundError } from '../../../utils/errors.js';

/**
 * Use Case: Buscar tarefas de uma turma
 *
 * Responsabilidades:
 * 1. Validar que a turma existe
 * 2. Buscar todas as tarefas da turma
 * 3. Se for aluno, incluir informação sobre submissão de redação
 *
 * Segue SOLID:
 * - SRP: Apenas busca tarefas de uma turma
 * - DIP: Depende de abstrações (repositories)
 */
export class GetTasksByClassUseCase {
  /**
   * @param {ITaskRepository} taskRepository - Repositório de tarefas
   * @param {IClassRepository} classRepository - Repositório de turmas
   * @param {IEssayRepository} essayRepository - Repositório de redações
   */
  constructor(taskRepository, classRepository, essayRepository) {
    this.taskRepository = taskRepository;
    this.classRepository = classRepository;
    this.essayRepository = essayRepository;
  }

  /**
   * Executa a busca de tarefas por turma
   *
   * @async
   * @param {Object} params - Parâmetros
   * @param {string} params.classId - ID da turma
   * @param {string} [params.studentId] - ID do aluno (opcional, para incluir info de submissão)
   * @returns {Promise<Array>} Lista de tarefas da turma
   * @throws {NotFoundError} Se a turma não existir
   */
  async execute({ classId, studentId = null }) {
    // 1. Validar que a turma existe
    const classExists = await this.classRepository.findById(classId);

    if (!classExists) {
      throw new NotFoundError('Turma');
    }

    // 2. Buscar tarefas da turma
    const tasks = await this.taskRepository.findByClassId(classId);

    // 3. Se for aluno, incluir informação sobre se já enviou redação
    if (studentId) {
      const tasksWithSubmissionStatus = await Promise.all(
        tasks.map(async (task) => {
          const essay = await this.essayRepository.findByTaskAndStudent(task.id, studentId);

          return {
            ...task,
            hasSubmitted: !!essay,
            essay: essay ? {
              id: essay.id,
              status: essay.status,
              submittedAt: essay.submittedAt,
            } : null,
          };
        })
      );

      return tasksWithSubmissionStatus;
    }

    return tasks;
  }
}

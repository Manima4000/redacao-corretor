import { NotFoundError } from '../../../utils/errors.js';

/**
 * Use Case: Buscar tarefas de uma turma
 *
 * Responsabilidades:
 * 1. Validar que a turma existe
 * 2. Buscar todas as tarefas da turma
 *
 * Segue SOLID:
 * - SRP: Apenas busca tarefas de uma turma
 * - DIP: Depende de abstrações (repositories)
 */
export class GetTasksByClassUseCase {
  /**
   * @param {ITaskRepository} taskRepository - Repositório de tarefas
   * @param {IClassRepository} classRepository - Repositório de turmas
   */
  constructor(taskRepository, classRepository) {
    this.taskRepository = taskRepository;
    this.classRepository = classRepository;
  }

  /**
   * Executa a busca de tarefas por turma
   *
   * @async
   * @param {string} classId - ID da turma
   * @returns {Promise<Array>} Lista de tarefas da turma
   * @throws {NotFoundError} Se a turma não existir
   */
  async execute(classId) {
    // 1. Validar que a turma existe
    const classExists = await this.classRepository.findById(classId);

    if (!classExists) {
      throw new NotFoundError('Turma');
    }

    // 2. Buscar tarefas da turma
    const tasks = await this.taskRepository.findByClassId(classId);

    return tasks;
  }
}

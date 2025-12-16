import { NotFoundError } from '../../../utils/errors.js';

/**
 * Use Case para buscar tarefa por ID
 * Segue o Single Responsibility Principle - só busca uma tarefa
 */
export class GetTaskByIdUseCase {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(taskId) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Tarefa');
    }

    return task.toPublicData();
  }
}

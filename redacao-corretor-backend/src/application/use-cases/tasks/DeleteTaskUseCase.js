import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

/**
 * Use Case para deletar tarefa
 * Segue o Single Responsibility Principle - só deleta tarefas
 */
export class DeleteTaskUseCase {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(taskId, requestingTeacherId) {
    // Buscar tarefa existente
    const existingTask = await this.taskRepository.findById(taskId);

    if (!existingTask) {
      throw new NotFoundError('Tarefa');
    }

    // Verificar se o professor está autorizado (apenas o dono da tarefa pode deletar)
    if (existingTask.teacherId !== requestingTeacherId) {
      throw new ForbiddenError('Você não tem permissão para deletar esta tarefa');
    }

    // Deletar a tarefa
    await this.taskRepository.delete(taskId);

    return true;
  }
}

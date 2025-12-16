import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

/**
 * Use Case para atualizar tarefa
 * Segue o Single Responsibility Principle - só atualiza tarefas
 */
export class UpdateTaskUseCase {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(taskId, updateTaskDTO, requestingTeacherId) {
    // Buscar tarefa existente
    const existingTask = await this.taskRepository.findById(taskId);

    if (!existingTask) {
      throw new NotFoundError('Tarefa');
    }

    // Verificar se o professor está autorizado (apenas o dono da tarefa pode atualizar)
    if (existingTask.teacherId !== requestingTeacherId) {
      throw new ForbiddenError('Você não tem permissão para atualizar esta tarefa');
    }

    // Atualizar a tarefa
    const updatedTask = await this.taskRepository.update(taskId, {
      title: updateTaskDTO.title,
      description: updateTaskDTO.description,
      deadline: updateTaskDTO.deadline,
      classIds: updateTaskDTO.classIds,
    });

    return updatedTask.toPublicData();
  }
}

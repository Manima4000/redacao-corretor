import { NotFoundError } from '../../../utils/errors.js';

/**
 * Use Case para buscar alunos de uma tarefa com status de entrega
 * Segue o Single Responsibility Principle - só busca alunos de uma tarefa
 * Dependency Inversion Principle - depende de abstrações (repositories)
 */
export class GetTaskStudentsUseCase {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(taskId) {
    // Verificar se a tarefa existe
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Tarefa');
    }

    // Buscar alunos com status de entrega
    const students = await this.taskRepository.findStudentsByTaskId(taskId);

    // Separar quem entregou e quem não entregou
    const submitted = students.filter((s) => s.hasSubmitted);
    const notSubmitted = students.filter((s) => !s.hasSubmitted);

    return {
      task: task.toPublicData(),
      students,
      stats: {
        total: students.length,
        submitted: submitted.length,
        notSubmitted: notSubmitted.length,
        submissionRate:
          students.length > 0
            ? Math.round((submitted.length / students.length) * 100)
            : 0,
      },
    };
  }
}

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

  /**
   * Executa busca de alunos com paginação
   * @param {string} taskId - ID da tarefa
   * @param {Object} options - Opções de paginação
   * @param {number} options.page - Número da página (padrão: 1)
   * @param {number} options.limit - Itens por página (padrão: 50)
   * @returns {Promise<Object>} Alunos paginados com estatísticas
   */
  async execute(taskId, options = {}) {
    // Verificar se a tarefa existe
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Tarefa');
    }

    // Buscar alunos com paginação
    const result = await this.taskRepository.findStudentsByTaskId(taskId, options);

    return {
      task: task.toPublicData(),
      students: result.students,
      stats: {
        total: result.totalStats.total, // Total de alunos (todas as páginas)
        submitted: result.totalStats.totalSubmitted, // Total de alunos que enviaram (todas as páginas)
        notSubmitted: result.totalStats.totalNotSubmitted, // Total de alunos que não enviaram (todas as páginas)
        submissionRate:
          result.totalStats.total > 0
            ? Math.round((result.totalStats.totalSubmitted / result.totalStats.total) * 100)
            : 0,
      },
      pagination: result.pagination,
    };
  }
}

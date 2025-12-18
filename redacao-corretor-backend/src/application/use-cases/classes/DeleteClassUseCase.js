import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

/**
 * Use Case para deletar turma
 *
 * Responsabilidades:
 * 1. Validar que a turma existe
 * 2. Verificar permissões (apenas professor dono)
 * 3. Buscar todas as tasks da turma
 * 4. Deletar tasks órfãs (que só pertencem a esta turma) usando DeleteTaskUseCase
 * 5. Deletar turma do banco (CASCADE deleta task_classes)
 * 6. Students.class_id é SET NULL automaticamente (ON DELETE SET NULL)
 *
 * Segue SOLID:
 * - SRP: Apenas deleta turmas e coordena deleção de tasks órfãs
 * - DIP: Depende de abstrações (repositories, use cases)
 * - DRY: Reutiliza DeleteTaskUseCase ao invés de duplicar lógica
 */
export class DeleteClassUseCase {
  /**
   * @param {IClassRepository} classRepository - Repositório de turmas
   * @param {ITaskRepository} taskRepository - Repositório de tarefas
   * @param {DeleteTaskUseCase} deleteTaskUseCase - Use case para deletar tasks
   */
  constructor(classRepository, taskRepository, deleteTaskUseCase) {
    this.classRepository = classRepository;
    this.taskRepository = taskRepository;
    this.deleteTaskUseCase = deleteTaskUseCase;
  }

  /**
   * Executa a deleção da turma
   *
   * @async
   * @param {string} classId - ID da turma
   * @param {string} requestingTeacherId - ID do professor solicitante
   * @returns {Promise<boolean>}
   * @throws {NotFoundError} Se turma não existir
   * @throws {ForbiddenError} Se professor não tem permissão
   */
  async execute(classId, requestingTeacherId) {
    // 1. Buscar turma existente
    const existingClass = await this.classRepository.findById(classId);

    if (!existingClass) {
      throw new NotFoundError('Turma');
    }

    // 2. Verificar permissões (apenas o dono da turma pode deletar)
    if (existingClass.teacherId !== requestingTeacherId) {
      throw new ForbiddenError('Você não tem permissão para deletar esta turma');
    }

    // 3. Buscar todas as tasks da turma
    const tasks = await this.taskRepository.findByClassId(classId);

    console.log(`[DELETE CLASS] Encontradas ${tasks.length} tarefas para processar`);

    // 4. Deletar tasks que só pertencem a esta turma
    // DeleteTaskUseCase já cuida de deletar essays, annotations e arquivos do Drive
    for (const task of tasks) {
      // Verificar se task pertence a outras turmas
      const taskDetails = await this.taskRepository.findById(task.id);

      if (taskDetails && taskDetails.classIds.length === 1 && taskDetails.classIds[0] === classId) {
        // Task só pertence a esta turma, deletar usando DeleteTaskUseCase
        console.log(`[DELETE CLASS] Deletando task órfã: "${task.title}"`);

        // Usa DeleteTaskUseCase que já deleta essays, arquivos do Drive e annotations
        await this.deleteTaskUseCase.execute(task.id, requestingTeacherId);
      } else {
        // Task pertence a outras turmas, só remove associação (task_classes)
        // Isso será feito automaticamente ao deletar a turma (CASCADE)
        console.log(
          `[DELETE CLASS] Task "${task.title}" pertence a ${taskDetails.classIds.length} turmas, mantendo`
        );
      }
    }

    // 5. Deletar a turma do banco
    // CASCADE vai deletar automaticamente:
    // - Task_Classes (ON DELETE CASCADE)
    // SET NULL vai acontecer automaticamente:
    // - Students.class_id (ON DELETE SET NULL)
    await this.classRepository.delete(classId);

    console.log(`[DELETE CLASS] Turma deletada com sucesso: ${classId}`);

    return true;
  }
}

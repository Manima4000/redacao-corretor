import { DatabaseError } from '../../../utils/errors.js';

/**
 * Use Case para criação de tarefa
 * Segue o Single Responsibility Principle - só cria tarefas
 */
export class CreateTaskUseCase {
  constructor(taskRepository, classRepository, teacherRepository) {
    this.taskRepository = taskRepository;
    this.classRepository = classRepository;
    this.teacherRepository = teacherRepository;
  }

  async execute(createTaskDTO) {
    // Verificar se o professor existe
    const teacher = await this.teacherRepository.findById(createTaskDTO.teacherId);

    if (!teacher) {
      throw new DatabaseError('Professor não encontrado');
    }

    // Verificar se todas as turmas existem
    for (const classId of createTaskDTO.classIds) {
      const classEntity = await this.classRepository.findById(classId);

      if (!classEntity) {
        throw new DatabaseError(`Turma ${classId} não encontrada`);
      }

      // Verificar se o professor é dono da turma
      if (classEntity.teacherId !== createTaskDTO.teacherId) {
        throw new DatabaseError(
          `Você não tem permissão para criar tarefas para a turma ${classEntity.name}`
        );
      }
    }

    // Criar a tarefa
    const task = await this.taskRepository.create({
      title: createTaskDTO.title,
      description: createTaskDTO.description,
      teacherId: createTaskDTO.teacherId,
      deadline: createTaskDTO.deadline,
      classIds: createTaskDTO.classIds,
    });

    return task.toPublicData();
  }
}

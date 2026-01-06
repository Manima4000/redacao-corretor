/**
 * Use Case para buscar tarefas
 * Segue o Single Responsibility Principle - só busca tarefas
 */
export class GetTasksUseCase {
  constructor(taskRepository, studentRepository) {
    this.taskRepository = taskRepository;
    this.studentRepository = studentRepository;
  }

  async execute(filters = {}, requestingUser) {
    const { teacherId, classId } = filters;

    // Se for professor
    if (requestingUser.userType === 'teacher') {
      // Se informou uma turma, filtra apenas as tarefas DESTA turma
      if (classId) {
        const tasks = await this.taskRepository.findByClassId(classId);
        // Filtramos para garantir que o professor só veja as tarefas que ELE criou para aquela turma
        return tasks
          .filter(t => t.teacherId === requestingUser.id)
          .map((t) => t.toPublicData());
      }

      // Caso contrário, busca todas as tarefas do professor (visão geral)
      const tasks = await this.taskRepository.findByTeacherId(
        teacherId || requestingUser.id
      );
      return tasks.map((t) => t.toPublicData());
    }

    // Se for aluno, busca tarefas da sua turma
    if (requestingUser.userType === 'student') {
      const student = await this.studentRepository.findById(requestingUser.id);

      if (!student || !student.classId) {
        return [];
      }

      const tasks = await this.taskRepository.findByClassId(student.classId);
      return tasks.map((t) => t.toPublicData());
    }

    // Se passou classId como filtro
    if (classId) {
      const tasks = await this.taskRepository.findByClassId(classId);
      return tasks.map((t) => t.toPublicData());
    }

    // Caso contrário, busca todas
    const tasks = await this.taskRepository.findAll();
    return tasks.map((t) => t.toPublicData());
  }
}

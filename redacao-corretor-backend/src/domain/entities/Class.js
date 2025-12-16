export class Class {
  constructor({ id, name, description, teacherId, createdAt, updatedAt, studentCount = 0, taskCount = 0 }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.teacherId = teacherId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.studentCount = parseInt(studentCount, 10) || 0;
    this.taskCount = parseInt(taskCount, 10) || 0;
  }

  // Retorna dados públicos da turma
  toPublicData() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      teacherId: this.teacherId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      studentCount: this.studentCount,
      taskCount: this.taskCount,
    };
  }

  validate() {
    if (!this.name || this.name.trim().length < 2) {
      throw new Error('Nome da turma deve ter pelo menos 2 caracteres');
    }

    if (!this.teacherId) {
      throw new Error('Turma deve ter um professor associado');
    }

    return true;
  }

  toJSON() {
    return this.toPublicData();
  }
}

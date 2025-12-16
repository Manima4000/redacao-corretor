export class Class {
  constructor({ id, name, description, teacherId, createdAt, updatedAt }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.teacherId = teacherId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
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

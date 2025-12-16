export class Task {
  constructor({ id, title, description, teacherId, deadline, classIds = [], createdAt, updatedAt }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.teacherId = teacherId;
    this.deadline = deadline;
    this.classIds = classIds; // Array de IDs das turmas (many-to-many)
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Retorna dados públicos da tarefa
  toPublicData() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      teacherId: this.teacherId,
      deadline: this.deadline,
      classIds: this.classIds,
      isOverdue: this.isOverdue(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  validate() {
    if (!this.title || this.title.trim().length < 3) {
      throw new Error('Título da tarefa deve ter pelo menos 3 caracteres');
    }

    if (!this.description || this.description.trim().length < 10) {
      throw new Error('Descrição da tarefa deve ter pelo menos 10 caracteres');
    }

    if (!this.teacherId) {
      throw new Error('ID do professor é obrigatório');
    }

    if (!this.classIds || this.classIds.length === 0) {
      throw new Error('Pelo menos uma turma deve ser selecionada');
    }

    if (this.deadline) {
      const deadlineDate = new Date(this.deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw new Error('Prazo inválido');
      }
    }

    return true;
  }

  isOverdue() {
    if (!this.deadline) return false;
    return new Date() > new Date(this.deadline);
  }

  toJSON() {
    return this.toPublicData();
  }
}

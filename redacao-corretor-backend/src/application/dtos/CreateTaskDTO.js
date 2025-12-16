import { ValidationError } from '../../utils/errors.js';

export class CreateTaskDTO {
  constructor({ title, description, classIds, deadline, teacherId }) {
    this.title = title;
    this.description = description;
    this.classIds = classIds; // Array de UUIDs
    this.deadline = deadline;
    this.teacherId = teacherId; // Injetado pelo controller baseado no req.user

    this.validate();
  }

  validate() {
    const errors = [];

    // Validar título
    if (!this.title || this.title.trim().length < 3) {
      errors.push('Título da tarefa deve ter pelo menos 3 caracteres');
    }

    // Validar descrição
    if (!this.description || this.description.trim().length < 10) {
      errors.push('Descrição da tarefa deve ter pelo menos 10 caracteres');
    }

    // Validar turmas
    if (!this.classIds || !Array.isArray(this.classIds) || this.classIds.length === 0) {
      errors.push('Pelo menos uma turma deve ser selecionada');
    }

    // Validar teacherId
    if (!this.teacherId) {
      errors.push('ID do professor é obrigatório');
    }

    // Validar deadline (opcional, mas se fornecido deve ser válido)
    if (this.deadline) {
      const deadlineDate = new Date(this.deadline);
      if (isNaN(deadlineDate.getTime())) {
        errors.push('Prazo inválido');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }

    // Normalizar dados
    this.title = this.title.trim();
    this.description = this.description.trim();
  }
}

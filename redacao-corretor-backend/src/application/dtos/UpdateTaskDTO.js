import { ValidationError } from '../../utils/errors.js';

export class UpdateTaskDTO {
  constructor({ title, description, classIds, deadline }) {
    this.title = title;
    this.description = description;
    this.classIds = classIds; // Array de UUIDs
    this.deadline = deadline;

    this.validate();
  }

  validate() {
    const errors = [];

    // Validar título (se fornecido)
    if (this.title !== undefined && this.title.trim().length < 3) {
      errors.push('Título da tarefa deve ter pelo menos 3 caracteres');
    }

    // Validar descrição (se fornecido)
    if (this.description !== undefined && this.description.trim().length < 10) {
      errors.push('Descrição da tarefa deve ter pelo menos 10 caracteres');
    }

    // Validar turmas (se fornecido)
    if (this.classIds !== undefined) {
      if (!Array.isArray(this.classIds) || this.classIds.length === 0) {
        errors.push('Pelo menos uma turma deve ser selecionada');
      }
    }

    // Validar deadline (se fornecido)
    if (this.deadline !== undefined && this.deadline !== null) {
      const deadlineDate = new Date(this.deadline);
      if (isNaN(deadlineDate.getTime())) {
        errors.push('Prazo inválido');
      }
    }

    // Pelo menos um campo deve ser fornecido
    if (
      this.title === undefined &&
      this.description === undefined &&
      this.classIds === undefined &&
      this.deadline === undefined
    ) {
      errors.push('Pelo menos um campo deve ser fornecido para atualização');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }

    // Normalizar dados
    if (this.title) {
      this.title = this.title.trim();
    }
    if (this.description) {
      this.description = this.description.trim();
    }
  }
}

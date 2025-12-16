import { ValidationError } from '../../utils/errors.js';

export class CreateClassDTO {
  constructor({ name, description, teacherId }) {
    this.name = name;
    this.description = description;
    this.teacherId = teacherId;

    this.validate();
  }

  validate() {
    const errors = [];

    // Validar nome da turma
    if (!this.name || this.name.trim().length < 2) {
      errors.push('Nome da turma deve ter pelo menos 2 caracteres');
    }

    // Validar teacherId (será injetado pelo controller baseado no req.user)
    if (!this.teacherId) {
      errors.push('ID do professor é obrigatório');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }

    // Normalizar dados
    this.name = this.name.trim();
    if (this.description) {
      this.description = this.description.trim();
    }
  }
}

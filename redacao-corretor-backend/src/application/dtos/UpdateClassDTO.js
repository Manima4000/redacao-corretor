import { ValidationError } from '../../utils/errors.js';

export class UpdateClassDTO {
  constructor({ name, description }) {
    this.name = name;
    this.description = description;

    this.validate();
  }

  validate() {
    const errors = [];

    // Validar nome da turma (se fornecido)
    if (this.name !== undefined && this.name.trim().length < 2) {
      errors.push('Nome da turma deve ter pelo menos 2 caracteres');
    }

    // Pelo menos um campo deve ser fornecido
    if (this.name === undefined && this.description === undefined) {
      errors.push('Pelo menos um campo deve ser fornecido para atualização');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }

    // Normalizar dados
    if (this.name) {
      this.name = this.name.trim();
    }
    if (this.description) {
      this.description = this.description.trim();
    }
  }
}

import { ValidationError } from '../../utils/errors.js';

export class LoginDTO {
  constructor({ email, password }) {
    this.email = email;
    this.password = password;

    this.validate();
  }

  validate() {
    const errors = [];

    if (!this.email || !this.email.includes('@')) {
      errors.push('Email inválido');
    }

    if (!this.password) {
      errors.push('Senha é obrigatória');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }

    // Normalizar email
    this.email = this.email.toLowerCase().trim();
  }
}

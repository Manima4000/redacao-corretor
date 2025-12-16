import { ValidationError } from '../../utils/errors.js';

export class RegisterDTO {
  constructor({ email, password, fullName, type, enrollmentNumber, specialization }) {
    this.email = email;
    this.password = password;
    this.fullName = fullName;
    this.type = type; // 'student' ou 'teacher'
    this.enrollmentNumber = enrollmentNumber; // Apenas para alunos
    this.specialization = specialization; // Apenas para professores

    this.validate();
  }

  validate() {
    const errors = [];

    // Validar email
    if (!this.email || !this.email.includes('@')) {
      errors.push('Email inválido');
    }

    // Validar senha
    if (!this.password || this.password.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }

    // Validar nome completo
    if (!this.fullName || this.fullName.trim().length < 3) {
      errors.push('Nome completo deve ter pelo menos 3 caracteres');
    }

    // Validar type
    if (!this.type || !['student', 'teacher'].includes(this.type)) {
      errors.push('Type deve ser student ou teacher');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }

    // Normalizar dados
    this.email = this.email.toLowerCase().trim();
    this.fullName = this.fullName.trim();
  }

  isStudent() {
    return this.type === 'student';
  }

  isTeacher() {
    return this.type === 'teacher';
  }
}

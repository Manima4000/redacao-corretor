export class User {
  constructor({ id, email, passwordHash, fullName, role, createdAt, updatedAt }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.fullName = fullName;
    this.role = role; // 'student' | 'teacher'
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isTeacher() {
    return this.role === 'teacher';
  }

  isStudent() {
    return this.role === 'student';
  }

  // Retorna dados públicos do usuário (sem senha)
  toPublicData() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
      createdAt: this.createdAt,
    };
  }

  // Validação básica
  validate() {
    if (!this.email || !this.email.includes('@')) {
      throw new Error('Email inválido');
    }

    if (!this.fullName || this.fullName.trim().length < 3) {
      throw new Error('Nome completo deve ter pelo menos 3 caracteres');
    }

    if (!['student', 'teacher'].includes(this.role)) {
      throw new Error('Role deve ser student ou teacher');
    }

    return true;
  }
}

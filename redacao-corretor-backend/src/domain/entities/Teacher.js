export class Teacher {
  constructor({ id, email, passwordHash, fullName, specialization, createdAt, updatedAt }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.fullName = fullName;
    this.specialization = specialization; // Área de especialização (ex: "Língua Portuguesa")
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Retorna dados públicos do professor (sem senha)
  toPublicData() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      specialization: this.specialization,
      type: 'teacher',
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

    return true;
  }

  toJSON() {
    return this.toPublicData();
  }
}

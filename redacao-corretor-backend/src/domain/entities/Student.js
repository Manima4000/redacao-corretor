export class Student {
  constructor({ id, email, passwordHash, fullName, enrollmentNumber, classId, createdAt, updatedAt }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.fullName = fullName;
    this.enrollmentNumber = enrollmentNumber; // Matrícula do aluno
    this.classId = classId; // ID da turma que o aluno pertence
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Retorna dados públicos do aluno (sem senha)
  toPublicData() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      enrollmentNumber: this.enrollmentNumber,
      classId: this.classId,
      type: 'student',
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

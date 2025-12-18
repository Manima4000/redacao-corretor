export class Essay {
  constructor({ id, taskId, studentId, fileUrl, fileType, status, submittedAt, correctedAt, grade, writtenFeedback }) {
    this.id = id;
    this.taskId = taskId;
    this.studentId = studentId;
    this.fileUrl = fileUrl;
    this.fileType = fileType;
    this.status = status || 'pending'; // 'pending' | 'correcting' | 'corrected'
    this.submittedAt = submittedAt;
    this.correctedAt = correctedAt;
    this.grade = grade;
    this.writtenFeedback = writtenFeedback;
  }

  validate() {
    if (!this.taskId) {
      throw new Error('Redação deve estar associada a uma tarefa');
    }

    if (!this.studentId) {
      throw new Error('Redação deve estar associada a um aluno');
    }

    if (!this.fileUrl) {
      throw new Error('Redação deve ter um arquivo associado');
    }

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(this.fileType)) {
      throw new Error('Tipo de arquivo inválido. Apenas JPEG, PNG e PDF são permitidos.');
    }

    const validStatuses = ['pending', 'correcting', 'corrected'];
    if (!validStatuses.includes(this.status)) {
      throw new Error('Status inválido');
    }

    // Validar nota se fornecida
    if (this.grade !== null && this.grade !== undefined) {
      if (typeof this.grade !== 'number' || this.grade < 0 || this.grade > 10) {
        throw new Error('Nota deve ser um número entre 0 e 10');
      }
    }

    return true;
  }

  markAsCorrecting() {
    this.status = 'correcting';
    this.updatedAt = new Date();
  }

  markAsCorrected(grade, writtenFeedback) {
    if (grade === null || grade === undefined) {
      throw new Error('Nota é obrigatória para finalizar a correção');
    }

    if (typeof grade !== 'number' || grade < 0 || grade > 10) {
      throw new Error('Nota deve ser um número entre 0 e 10');
    }

    this.status = 'corrected';
    this.grade = grade;
    this.writtenFeedback = writtenFeedback;
    this.correctedAt = new Date();
    this.updatedAt = new Date();
  }

  isPending() {
    return this.status === 'pending';
  }

  isCorrected() {
    return this.status === 'corrected';
  }

  toJSON() {
    return {
      id: this.id,
      taskId: this.taskId,
      studentId: this.studentId,
      fileUrl: this.fileUrl,
      fileType: this.fileType,
      status: this.status,
      submittedAt: this.submittedAt,
      correctedAt: this.correctedAt,
      grade: this.grade,
      writtenFeedback: this.writtenFeedback,
    };
  }
}

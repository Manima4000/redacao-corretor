export class Essay {
  constructor({ id, taskId, studentId, fileUrl, fileType, status, submittedAt, correctedAt }) {
    this.id = id;
    this.taskId = taskId;
    this.studentId = studentId;
    this.fileUrl = fileUrl;
    this.fileType = fileType;
    this.status = status || 'pending'; // 'pending' | 'correcting' | 'corrected'
    this.submittedAt = submittedAt;
    this.correctedAt = correctedAt;
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

    return true;
  }

  markAsCorrecting() {
    this.status = 'correcting';
    this.updatedAt = new Date();
  }

  markAsCorrected() {
    this.status = 'corrected';
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
    };
  }
}

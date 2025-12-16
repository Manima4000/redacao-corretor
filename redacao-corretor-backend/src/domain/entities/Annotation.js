export class Annotation {
  constructor({ id, essayId, annotationData, pageNumber, createdAt, updatedAt }) {
    this.id = id;
    this.essayId = essayId;
    this.annotationData = annotationData; // JSONB object from Fabric.js
    this.pageNumber = pageNumber || 1;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  validate() {
    if (!this.essayId) {
      throw new Error('Anotação deve estar associada a uma redação');
    }

    if (!this.annotationData || typeof this.annotationData !== 'object') {
      throw new Error('Dados de anotação inválidos');
    }

    if (this.pageNumber < 1) {
      throw new Error('Número de página deve ser maior que 0');
    }

    return true;
  }

  updateAnnotationData(newData) {
    this.annotationData = newData;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      essayId: this.essayId,
      annotationData: this.annotationData,
      pageNumber: this.pageNumber,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

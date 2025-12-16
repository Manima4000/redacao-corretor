export class Comment {
  constructor({ id, essayId, userId, content, createdAt }) {
    this.id = id;
    this.essayId = essayId;
    this.userId = userId;
    this.content = content;
    this.createdAt = createdAt;
  }

  validate() {
    if (!this.essayId) {
      throw new Error('Comentário deve estar associado a uma redação');
    }

    if (!this.userId) {
      throw new Error('Comentário deve ter um autor');
    }

    if (!this.content || this.content.trim().length < 1) {
      throw new Error('Comentário não pode estar vazio');
    }

    if (this.content.length > 1000) {
      throw new Error('Comentário não pode ter mais de 1000 caracteres');
    }

    return true;
  }

  toJSON() {
    return {
      id: this.id,
      essayId: this.essayId,
      userId: this.userId,
      content: this.content,
      createdAt: this.createdAt,
    };
  }
}

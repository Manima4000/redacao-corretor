export class Notification {
  constructor({ id, userId, type, title, message, relatedId, isRead, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.type = type; // 'new_task', 'essay_submitted', 'essay_corrected', etc.
    this.title = title;
    this.message = message;
    this.relatedId = relatedId; // ID da tarefa, redação, etc.
    this.isRead = isRead || false;
    this.createdAt = createdAt;
  }

  validate() {
    if (!this.userId) {
      throw new Error('Notificação deve ter um destinatário');
    }

    if (!this.type) {
      throw new Error('Notificação deve ter um tipo');
    }

    if (!this.title || this.title.trim().length < 1) {
      throw new Error('Notificação deve ter um título');
    }

    if (!this.message || this.message.trim().length < 1) {
      throw new Error('Notificação deve ter uma mensagem');
    }

    return true;
  }

  markAsRead() {
    this.isRead = true;
  }

  markAsUnread() {
    this.isRead = false;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message,
      relatedId: this.relatedId,
      isRead: this.isRead,
      createdAt: this.createdAt,
    };
  }
}

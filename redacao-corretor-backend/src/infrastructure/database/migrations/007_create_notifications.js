export async function up(query) {
  await query(`
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient_id UUID NOT NULL,
      recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('student', 'teacher')),
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      related_id UUID,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, recipient_type);
    CREATE INDEX idx_notifications_is_read ON notifications(is_read);
    CREATE INDEX idx_notifications_created_at ON notifications(created_at);
    CREATE INDEX idx_notifications_type ON notifications(type);
  `);

  console.log('Tabela notifications criada com sucesso!');
}

export async function down(query) {
  await query(`
    DROP TABLE IF EXISTS notifications CASCADE;
  `);

  console.log('Tabela notifications removida!');
}

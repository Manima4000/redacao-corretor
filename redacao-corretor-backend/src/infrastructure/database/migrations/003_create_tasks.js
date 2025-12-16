export async function up(query) {
  await query(`
    CREATE TABLE tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
      teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
      deadline TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_tasks_class_id ON tasks(class_id);
    CREATE INDEX idx_tasks_teacher_id ON tasks(teacher_id);
    CREATE INDEX idx_tasks_deadline ON tasks(deadline);
  `);

  console.log('Tabela tasks criada com sucesso!');
}

export async function down(query) {
  await query(`
    DROP TABLE IF EXISTS tasks CASCADE;
  `);

  console.log('Tabela tasks removida!');
}

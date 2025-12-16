export async function up(query) {
  await query(`
    -- Tabela de Tarefas/Temas
    CREATE TABLE tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
      deadline TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_tasks_teacher_id ON tasks(teacher_id);
    CREATE INDEX idx_tasks_deadline ON tasks(deadline);

    -- Tabela de relacionamento many-to-many: Tasks <-> Classes
    CREATE TABLE task_classes (
      task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
      class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, class_id)
    );

    CREATE INDEX idx_task_classes_task_id ON task_classes(task_id);
    CREATE INDEX idx_task_classes_class_id ON task_classes(class_id);
  `);

  console.log('Tabelas tasks e task_classes criadas com sucesso!');
}

export async function down(query) {
  await query(`
    DROP TABLE IF EXISTS task_classes CASCADE;
    DROP TABLE IF EXISTS tasks CASCADE;
  `);

  console.log('Tabelas tasks e task_classes removidas!');
}

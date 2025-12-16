export async function up(query) {
  await query(`
    CREATE TABLE classes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
  `);

  console.log('Tabela classes criada com sucesso!');
}

export async function down(query) {
  await query(`
    DROP TABLE IF EXISTS classes CASCADE;
  `);

  console.log('Tabela classes removida!');
}

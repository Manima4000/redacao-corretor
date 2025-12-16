export async function up(query) {
  await query(`
    CREATE TABLE essays (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      file_url VARCHAR(500) NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'correcting', 'corrected')),
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      corrected_at TIMESTAMP,
      UNIQUE(task_id, student_id)
    );

    CREATE INDEX idx_essays_task_id ON essays(task_id);
    CREATE INDEX idx_essays_student_id ON essays(student_id);
    CREATE INDEX idx_essays_status ON essays(status);
  `);

  console.log('Tabela essays criada com sucesso!');
}

export async function down(query) {
  await query(`
    DROP TABLE IF EXISTS essays CASCADE;
  `);

  console.log('Tabela essays removida!');
}

export async function up(query) {
  await query(`
    CREATE TABLE students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      enrollment_number VARCHAR(50),
      class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_students_email ON students(email);
    CREATE INDEX idx_students_enrollment ON students(enrollment_number);
    CREATE INDEX idx_students_class_id ON students(class_id);
  `);

  console.log('Tabela students criada com sucesso!');
}

export async function down(query) {
  await query(`
    DROP TABLE IF EXISTS students CASCADE;
  `);

  console.log('Tabela students removida!');
}

export async function up(query) {
  await query(`
    -- Tabela de Professores
    CREATE TABLE teachers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      specialization VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes para Teachers
    CREATE INDEX idx_teachers_email ON teachers(email);
  `);

  console.log('Tabela teachers criada com sucesso!');
}

export async function down(query) {
  await query(`
    DROP TABLE IF EXISTS teachers CASCADE;
  `);

  console.log('Tabela teachers removida!');
}

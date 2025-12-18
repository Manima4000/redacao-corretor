export async function up(query) {
  await query(`
    ALTER TABLE essays
    ADD COLUMN grade DECIMAL(4,2) CHECK (grade >= 0 AND grade <= 10),
    ADD COLUMN written_feedback TEXT;
  `);

  console.log('Campos de avaliação (grade e written_feedback) adicionados à tabela essays!');
}

export async function down(query) {
  await query(`
    ALTER TABLE essays
    DROP COLUMN IF EXISTS grade,
    DROP COLUMN IF EXISTS written_feedback;
  `);

  console.log('Campos de avaliação removidos da tabela essays!');
}

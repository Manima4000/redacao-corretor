export async function up(query) {
  await query(`
    CREATE TABLE annotations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      essay_id UUID REFERENCES essays(id) ON DELETE CASCADE,
      annotation_data JSONB NOT NULL,
      page_number INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_annotations_essay_id ON annotations(essay_id);
    CREATE INDEX idx_annotations_page_number ON annotations(page_number);
  `);

  console.log('Tabela annotations criada com sucesso!');
}

export async function down(query) {
  await query(`
    DROP TABLE IF EXISTS annotations CASCADE;
  `);

  console.log('Tabela annotations removida!');
}

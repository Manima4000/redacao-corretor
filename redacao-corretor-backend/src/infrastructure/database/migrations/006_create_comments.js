export async function up(query) {
  await query(`
    CREATE TABLE comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      essay_id UUID REFERENCES essays(id) ON DELETE CASCADE,
      author_id UUID NOT NULL,
      author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('student', 'teacher')),
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_comments_essay_id ON comments(essay_id);
    CREATE INDEX idx_comments_author ON comments(author_id, author_type);
    CREATE INDEX idx_comments_created_at ON comments(created_at);
  `);

  console.log('Tabela comments criada com sucesso!');
}

export async function down(query) {
  await query(`
    DROP TABLE IF EXISTS comments CASCADE;
  `);

  console.log('Tabela comments removida!');
}

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { query, testConnection } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Criar tabela de controle de migrations
async function createMigrationsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await query(createTableQuery);
  console.log('Tabela schema_migrations criada/verificada');
}

// Buscar migrations já executadas
async function getExecutedMigrations() {
  const result = await query('SELECT migration_name FROM schema_migrations ORDER BY id');
  return result.rows.map(row => row.migration_name);
}

// Marcar migration como executada
async function markMigrationAsExecuted(migrationName) {
  await query('INSERT INTO schema_migrations (migration_name) VALUES ($1)', [migrationName]);
}

// Executar migrations pendentes
async function runMigrations() {
  try {
    // Testar conexão
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Não foi possível conectar ao banco de dados');
    }

    // Criar tabela de controle
    await createMigrationsTable();

    // Buscar migrations executadas
    const executedMigrations = await getExecutedMigrations();
    console.log('Migrations já executadas:', executedMigrations);

    // Ler arquivos de migration
    const files = await fs.readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(f => f.endsWith('.js'))
      .sort();

    console.log('Arquivos de migration encontrados:', migrationFiles);

    // Executar migrations pendentes
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        console.log(`\nExecutando migration: ${file}`);

        const migrationPath = path.join(MIGRATIONS_DIR, file);
        const migration = await import(`file://${migrationPath}`);

        if (typeof migration.up === 'function') {
          await migration.up(query);
          await markMigrationAsExecuted(file);
          console.log(`Migration ${file} executada com sucesso!`);
        } else {
          console.error(`Migration ${file} não possui função 'up'`);
        }
      } else {
        console.log(`Migration ${file} já executada, pulando...`);
      }
    }

    console.log('\nTodas as migrations foram executadas com sucesso!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar migrations:', error);
    await pool.end();
    process.exit(1);
  }
}

// Executar
runMigrations();

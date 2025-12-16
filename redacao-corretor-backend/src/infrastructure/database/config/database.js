import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME || 'redacao_corretor',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo máximo que uma conexão pode ficar idle
  connectionTimeoutMillis: 2000, // Tempo máximo para estabelecer conexão
});

// Event listeners para debugging
pool.on('connect', () => {
  console.log('Nova conexão estabelecida com PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

// Função para testar conexão
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Conexão com PostgreSQL estabelecida com sucesso!');
    const result = await client.query('SELECT NOW()');
    console.log('Timestamp do banco:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('Erro ao conectar com PostgreSQL:', error.message);
    return false;
  }
}

// Função para executar queries
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Erro na query:', { text, error: error.message });
    throw error;
  }
}

// Função para executar transações
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Fechar pool de conexões (útil para testes)
export async function closePool() {
  await pool.end();
  console.log('Pool de conexões fechado');
}

export default pool;

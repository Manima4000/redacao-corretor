import pg from 'pg';
import dotenv from 'dotenv';
import logger from '../../../utils/logger.js';

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
  // Apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Nova conexão estabelecida com PostgreSQL');
  }
});

pool.on('error', (err) => {
  // NÃO expor detalhes do erro em produção
  logger.error('Erro inesperado no pool de conexões', {
    message: err.message,
    code: err.code,
    // Stack trace APENAS em desenvolvimento
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
  process.exit(-1);
});

// Função para testar conexão
export async function testConnection() {
  try {
    const client = await pool.connect();
    logger.info('Conexão com PostgreSQL estabelecida com sucesso!');
    const result = await client.query('SELECT NOW()');

    // Log do timestamp apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Timestamp do banco:', result.rows[0].now);
    }

    client.release();
    return true;
  } catch (error) {
    // NÃO expor detalhes técnicos em produção
    logger.error('Erro ao conectar com PostgreSQL', {
      message: error.message,
      code: error.code,
    });
    return false;
  }
}

// Função para executar queries
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // ⚠️ SEGURANÇA: Logs de queries APENAS em desenvolvimento
    // Em produção, NÃO logar queries completas (podem conter dados sensíveis)
    if (process.env.NODE_ENV === 'development') {
      // Apenas preview da query (primeiros 100 caracteres)
      const queryPreview = text.substring(0, 100) + (text.length > 100 ? '...' : '');
      logger.debug('Query executada', {
        queryPreview,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    } else {
      // Em produção, log mínimo sem expor queries
      if (duration > 1000) {
        // Apenas logar queries lentas (> 1s)
        logger.warn('Query lenta detectada', {
          duration: `${duration}ms`,
          rows: result.rowCount,
        });
      }
    }

    return result;
  } catch (error) {
    // ⚠️ SEGURANÇA: NÃO logar query completa em erro
    logger.error('Erro na query', {
      message: error.message,
      code: error.code,
      // Query preview APENAS em desenvolvimento
      ...(process.env.NODE_ENV === 'development' && {
        queryPreview: text.substring(0, 100) + '...',
      }),
    });
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
  logger.info('Pool de conexões fechado');
}

export default pool;

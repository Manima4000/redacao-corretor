import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Ambiente
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,

  // Database
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    name: process.env.DATABASE_NAME || 'redacao_corretor',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    url: process.env.DATABASE_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // File Upload
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10485760, // 10MB default
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'application/pdf',
    ],
    storageType: process.env.UPLOAD_STORAGE_TYPE || 'local',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  // AWS S3 (opcional)
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
  },

  // CORS
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15min
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};

// Validar configurações críticas
function validateConfig() {
  const errors = [];

  if (!config.jwt.secret) {
    errors.push('JWT_SECRET não configurado');
  }

  if (!config.jwt.refreshSecret) {
    errors.push('JWT_REFRESH_SECRET não configurado');
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuração inválida:\n${errors.map(e => `- ${e}`).join('\n')}`
    );
  }
}

validateConfig();

export default config;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import config from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import routes from './infrastructure/http/routes/index.js';
import { errorHandler, notFoundHandler } from './infrastructure/http/middleware/errorHandler.js';
import { testConnection } from './infrastructure/database/config/database.js';
import logger from './utils/logger.js';

const app = express();

// ======================
// Middlewares Globais
// ======================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: config.frontend.url,
  credentials: true,
}));

// Cookie parsing
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ======================
// Rotas
// ======================

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Redação Corretor API',
}));

// Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api', routes);

// ======================
// Error Handling
// ======================

// 404 handler - deve vir antes do error handler
app.use(notFoundHandler);

// Global error handler - deve ser o último middleware
app.use(errorHandler);

// ======================
// Inicialização do Servidor
// ======================

const PORT = config.port;

async function startServer() {
  try {
    // Testar conexão com banco de dados
    logger.info('Testando conexão com banco de dados...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('Não foi possível conectar ao banco de dados');
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📝 Ambiente: ${config.nodeEnv}`);
      logger.info(`📖 Documentação: http://localhost:${PORT}/api-docs`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);

      if (config.nodeEnv === 'development') {
        logger.info(`📚 API Base URL: http://localhost:${PORT}/api`);
        logger.info(`🔐 Auth endpoints:`);
        logger.info(`   POST http://localhost:${PORT}/api/auth/register`);
        logger.info(`   POST http://localhost:${PORT}/api/auth/login`);
        logger.info(`   POST http://localhost:${PORT}/api/auth/refresh`);
        logger.info(`   GET  http://localhost:${PORT}/api/auth/me`);
      }
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer();

export default app;

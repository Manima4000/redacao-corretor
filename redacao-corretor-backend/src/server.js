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
import { emailScheduler } from './infrastructure/schedulers/emailScheduler.js';
import { subscriptionScheduler } from './infrastructure/schedulers/subscriptionScheduler.js';
import { httpsEnforcement } from './infrastructure/http/middleware/httpsEnforcement.js';
import logger from './utils/logger.js';

const app = express();

// ======================
// Middlewares Globais
// ======================

// HTTPS Enforcement - deve vir ANTES de qualquer outra lógica
app.use(httpsEnforcement);

// Security headers - Helmet com configuração completa
app.use(helmet({
  // HTTP Strict Transport Security (HSTS)
  // Força browsers a sempre usar HTTPS por 1 ano
  hsts: {
    maxAge: 31536000, // 1 ano em segundos
    includeSubDomains: true, // Aplicar em todos os subdomínios
    preload: true, // Permitir inclusão no HSTS preload list
  },

  // Content Security Policy (CSP)
  // Define quais recursos podem ser carregados
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Apenas recursos do mesmo domínio por padrão
      scriptSrc: ["'self'"], // Scripts apenas do mesmo domínio
      styleSrc: ["'self'", "'unsafe-inline'"], // Estilos do mesmo domínio + inline (necessário para Swagger)
      imgSrc: ["'self'", "data:", "https://drive.google.com", "https://*.googleusercontent.com"], // Imagens do domínio + data URIs + Google Drive
      connectSrc: ["'self'", ...(config.frontend.urls || [])], // Conexões para API + frontend
      fontSrc: ["'self'", "data:"], // Fontes do domínio + data URIs
      objectSrc: ["'none'"], // Bloquear plugins (Flash, etc.)
      mediaSrc: ["'self'"], // Mídia apenas do domínio
      frameSrc: ["'none'"], // Bloquear iframes (previne clickjacking)
      upgradeInsecureRequests: [], // Forçar upgrade HTTP → HTTPS
    },
  },

  // X-Frame-Options: DENY
  // Previne que a página seja carregada em iframe (clickjacking)
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options: nosniff
  // Previne MIME type sniffing
  noSniff: true,

  // Referrer-Policy: no-referrer
  // Não vazar informações de referrer
  referrerPolicy: {
    policy: 'no-referrer',
  },

  // X-Download-Options: noopen
  // Previne download automático de arquivos perigosos
  ieNoOpen: true,

  // X-Permitted-Cross-Domain-Policies: none
  // Bloqueia Adobe Flash/PDF cross-domain requests
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
}));

// CORS - Suporta múltiplas origens
app.use(cors({
  origin: (origin, callback) => {
    // EM PRODUÇÃO, SEMPRE exigir origin header
    if (process.env.NODE_ENV === 'production' && !origin) {
      logger.warn('🚨 CORS bloqueou requisição sem origin header em produção', {
        ip: req?.ip,
      });
      return callback(new Error('Origin header obrigatório em produção'));
    }

    // Em desenvolvimento, permitir requisições sem origin (Postman, curl)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Verificar se a origin está na lista permitida
    if (config.frontend.urls.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`🚨 CORS bloqueou origem não permitida: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true, // Permite cookies em requisições cross-origin
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

    // Iniciar scheduler de emails
    //logger.info('Inicializando scheduler de emails...');
    //await emailScheduler.start();

    // Iniciar scheduler de sincronização de assinaturas
    logger.info('Inicializando scheduler de sincronização de assinaturas...');
    await subscriptionScheduler.start();

    // Iniciar servidor
    // 0.0.0.0 permite conexões de qualquer IP (rede local ou internet)
    app.listen(PORT, '0.0.0.0', () => {
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

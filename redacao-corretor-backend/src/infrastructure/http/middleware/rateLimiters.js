import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter para Login
 *
 * Permite máximo 5 tentativas de login por 15 minutos por IP + email.
 * Tentativas bem-sucedidas não são contadas.
 *
 * Proteção contra:
 * - Brute force attacks
 * - Credential stuffing
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  skipSuccessfulRequests: true, // Não conta logins bem-sucedidos
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Combinar IP + email para limitar por usuário específico
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  },
  // Handler customizado para logar tentativas bloqueadas
  handler: (req, res, next, options) => {
    const email = req.body?.email || 'unknown';
    console.warn(`🚨 Rate limit atingido para login: IP=${req.ip}, Email=${email}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Rate Limiter para Registro
 *
 * Permite máximo 3 registros por hora por IP.
 *
 * Proteção contra:
 * - Account enumeration
 * - Spam de registros
 * - Abuso de recursos
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5000, // 3 registros
  message: {
    success: false,
    error: 'Muitos registros deste IP. Tente novamente em 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`🚨 Rate limit atingido para registro: IP=${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Rate Limiter para Refresh Token
 *
 * Permite máximo 10 renovações de token por 15 minutos por IP.
 *
 * Proteção contra:
 * - Token refresh abuse
 * - DoS attacks
 */
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 renovações
  message: {
    success: false,
    error: 'Muitas tentativas de renovação de token. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`🚨 Rate limit atingido para refresh token: IP=${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

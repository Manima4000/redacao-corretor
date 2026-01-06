import logger from '../../../utils/logger.js';

/**
 * Middleware de HTTPS Enforcement
 *
 * Em produção, força todas as requisições a usarem HTTPS.
 * Se uma requisição HTTP chegar, redireciona para HTTPS.
 *
 * Proteção contra:
 * - Man-in-the-Middle (MiTM) attacks
 * - Cookie theft (se cookies não estiverem em conexão segura)
 * - Session hijacking
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const httpsEnforcement = (req, res, next) => {
  // Apenas em produção
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Verificar se a requisição é HTTPS
  // x-forwarded-proto é setado por proxies reversos (DigitalOcean, Heroku, nginx)
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (!isHttps) {
    // Log da tentativa de acesso HTTP em produção
    logger.warn('🔒 Requisição HTTP bloqueada em produção - redirecionando para HTTPS', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
    });

    // Construir URL HTTPS
    const httpsUrl = `https://${req.headers.host}${req.url}`;

    // Redirecionar permanentemente (301) para HTTPS
    return res.redirect(301, httpsUrl);
  }

  // Requisição já é HTTPS, prosseguir
  next();
};

/**
 * Middleware de Validação HTTPS para Cookies Sensíveis
 *
 * Valida que em produção, cookies de autenticação SEMPRE sejam enviados via HTTPS.
 * Se não for HTTPS, bloqueia a requisição (não redireciona).
 *
 * Use este middleware APENAS em rotas que definem cookies de autenticação
 * (login, register, refresh).
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const requireHttpsForAuth = (req, res, next) => {
  // Apenas em produção
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (!isHttps) {
    logger.error('🚨 HTTPS obrigatório para autenticação', {
      ip: req.ip,
      method: req.method,
      url: req.url,
    });

    return res.status(403).json({
      success: false,
      error: 'HTTPS é obrigatório para operações de autenticação em produção',
    });
  }

  next();
};

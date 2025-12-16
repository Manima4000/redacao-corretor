import { AppError } from '../../../utils/errors.js';
import logger from '../../../utils/logger.js';

/**
 * Middleware global para tratamento de erros
 * Deve ser o último middleware registrado
 */
export const errorHandler = (err, req, res, next) => {
  // Log do erro
  logger.error(err.message, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Se for um erro operacional (AppError ou derivados)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Erros de validação do Joi
  if (err.name === 'ValidationError' && err.isJoi) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: err.details.map(d => d.message),
    });
  }

  // Erros do PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          success: false,
          error: 'Registro duplicado',
        });
      case '23503': // Foreign key violation
        return res.status(400).json({
          success: false,
          error: 'Referência inválida',
        });
      case '22P02': // Invalid text representation
        return res.status(400).json({
          success: false,
          error: 'Formato de dados inválido',
        });
    }
  }

  // Erro genérico (não esperado)
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware para capturar rotas não encontradas
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Rota ${req.method} ${req.url} não encontrada`,
  });
};

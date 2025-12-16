import { ValidationError } from '../../../utils/errors.js';

/**
 * Middleware para validação de requisições usando Joi
 * @param {Joi.ObjectSchema} schema - Schema Joi para validação
 * @param {string} property - Propriedade da requisição a validar (body, query, params)
 * @returns {Function} Middleware
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Retorna todos os erros
      stripUnknown: true, // Remove campos desconhecidos
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errorMessages,
      });
    }

    // Substituir req[property] pelos valores validados e sanitizados
    req[property] = value;
    next();
  };
};

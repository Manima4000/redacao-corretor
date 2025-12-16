import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório',
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'any.required': 'Senha é obrigatória',
    }),

  fullName: Joi.string()
    .min(3)
    .required()
    .messages({
      'string.min': 'Nome completo deve ter pelo menos 3 caracteres',
      'any.required': 'Nome completo é obrigatório',
    }),

  type: Joi.string()
    .valid('student', 'teacher')
    .required()
    .messages({
      'any.only': 'Type deve ser student ou teacher',
      'any.required': 'Type é obrigatório',
    }),

  enrollmentNumber: Joi.string()
    .optional()
    .allow(null, ''),

  specialization: Joi.string()
    .optional()
    .allow(null, ''),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório',
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha é obrigatória',
    }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token é obrigatório',
    }),
});

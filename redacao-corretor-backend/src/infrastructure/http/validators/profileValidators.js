import Joi from 'joi';

/**
 * Schema de validação para atualização de perfil
 */
export const updateProfileSchema = Joi.object({
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Email inválido',
    }),

  fullName: Joi.string()
    .min(3)
    .optional()
    .messages({
      'string.min': 'Nome completo deve ter pelo menos 3 caracteres',
    }),

  enrollmentNumber: Joi.string()
    .optional()
    .allow(null, ''),

  specialization: Joi.string()
    .optional()
    .allow(null, ''),
}).min(1).messages({
  'object.min': 'Pelo menos um campo deve ser fornecido para atualização',
});

/**
 * Schema de validação para mudança de senha
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha atual é obrigatória',
    }),

  newPassword: Joi.string()
    .min(6)
    .required()
    .invalid(Joi.ref('currentPassword'))
    .messages({
      'string.min': 'Nova senha deve ter pelo menos 6 caracteres',
      'any.required': 'Nova senha é obrigatória',
      'any.invalid': 'Nova senha deve ser diferente da senha atual',
    }),
});

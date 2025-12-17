import Joi from 'joi';

/**
 * Schema de validação para salvamento de anotações
 *
 * Formato esperado:
 * {
 *   annotationData: {
 *     version: "1.0",
 *     lines: [
 *       {
 *         points: [[x, y, pressure], ...],
 *         color: "#FF0000",
 *         size: 4
 *       }
 *     ]
 *   },
 *   pageNumber: 1
 * }
 */
export const saveAnnotationSchema = Joi.object({
  annotationData: Joi.object({
    version: Joi.string().default('1.0'),
    lines: Joi.array()
      .items(
        Joi.object({
          points: Joi.array()
            .items(
              Joi.array()
                .ordered(
                  Joi.number().required(), // x
                  Joi.number().required(), // y
                  Joi.number().min(0).max(1).required() // pressure (0-1)
                )
                .length(3)
            )
            .min(1)
            .required()
            .messages({
              'array.min': 'Cada linha deve ter pelo menos 1 ponto',
            }),

          color: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .required()
            .messages({
              'string.pattern.base': 'Cor deve estar no formato hexadecimal (#RRGGBB)',
            }),

          size: Joi.number().positive().required().messages({
            'number.positive': 'Tamanho deve ser um número positivo',
          }),
        }).required()
      )
      .required()
      .messages({
        'array.base': 'lines deve ser um array',
        'any.required': 'lines é obrigatório',
      }),
  })
    .required()
    .messages({
      'any.required': 'annotationData é obrigatório',
    }),

  pageNumber: Joi.number().integer().positive().default(1).messages({
    'number.base': 'pageNumber deve ser um número',
    'number.integer': 'pageNumber deve ser um inteiro',
    'number.positive': 'pageNumber deve ser positivo',
  }),
});

/**
 * Schema de validação para atualização de status
 *
 * Status possíveis: pending, correcting, corrected
 */
export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'correcting', 'corrected')
    .required()
    .messages({
      'string.empty': 'Status é obrigatório',
      'any.only': 'Status deve ser: pending, correcting ou corrected',
      'any.required': 'Status é obrigatório',
    }),
});

/**
 * Schema de validação para query params de paginação (opcional)
 */
export const getAnnotationQuerySchema = Joi.object({
  page: Joi.number().integer().positive().messages({
    'number.base': 'page deve ser um número',
    'number.integer': 'page deve ser um inteiro',
    'number.positive': 'page deve ser positivo',
  }),
});

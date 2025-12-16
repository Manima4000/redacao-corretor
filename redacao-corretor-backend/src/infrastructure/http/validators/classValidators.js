import Joi from 'joi';

export const createClassSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Nome da turma é obrigatório',
    'string.min': 'Nome da turma deve ter pelo menos 2 caracteres',
    'string.max': 'Nome da turma deve ter no máximo 100 caracteres',
    'any.required': 'Nome da turma é obrigatório',
  }),

  description: Joi.string().max(500).allow('', null).messages({
    'string.max': 'Descrição deve ter no máximo 500 caracteres',
  }),
});

export const updateClassSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    'string.min': 'Nome da turma deve ter pelo menos 2 caracteres',
    'string.max': 'Nome da turma deve ter no máximo 100 caracteres',
  }),

  description: Joi.string().max(500).allow('', null).messages({
    'string.max': 'Descrição deve ter no máximo 500 caracteres',
  }),
}).min(1).messages({
  'object.min': 'Pelo menos um campo deve ser fornecido para atualização',
});

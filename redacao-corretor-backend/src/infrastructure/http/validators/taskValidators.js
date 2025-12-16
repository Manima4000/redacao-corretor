import Joi from 'joi';

export const createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(255).required().messages({
    'string.empty': 'Título da tarefa é obrigatório',
    'string.min': 'Título da tarefa deve ter pelo menos 3 caracteres',
    'string.max': 'Título da tarefa deve ter no máximo 255 caracteres',
    'any.required': 'Título da tarefa é obrigatório',
  }),

  description: Joi.string().min(10).required().messages({
    'string.empty': 'Descrição da tarefa é obrigatória',
    'string.min': 'Descrição da tarefa deve ter pelo menos 10 caracteres',
    'any.required': 'Descrição da tarefa é obrigatória',
  }),

  classIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required()
    .messages({
      'array.base': 'classIds deve ser um array',
      'array.min': 'Pelo menos uma turma deve ser selecionada',
      'string.guid': 'IDs das turmas devem ser UUIDs válidos',
      'any.required': 'Turmas são obrigatórias',
    }),

  deadline: Joi.date().iso().allow(null).messages({
    'date.format': 'Prazo deve ser uma data válida no formato ISO',
  }),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(255).messages({
    'string.min': 'Título da tarefa deve ter pelo menos 3 caracteres',
    'string.max': 'Título da tarefa deve ter no máximo 255 caracteres',
  }),

  description: Joi.string().min(10).messages({
    'string.min': 'Descrição da tarefa deve ter pelo menos 10 caracteres',
  }),

  classIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .messages({
      'array.base': 'classIds deve ser um array',
      'array.min': 'Pelo menos uma turma deve ser selecionada',
      'string.guid': 'IDs das turmas devem ser UUIDs válidos',
    }),

  deadline: Joi.date().iso().allow(null).messages({
    'date.format': 'Prazo deve ser uma data válida no formato ISO',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Pelo menos um campo deve ser fornecido para atualização',
  });

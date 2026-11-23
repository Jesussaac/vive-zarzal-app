import Joi from 'joi';

export const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(80).required(),
  lastName: Joi.string().trim().min(2).max(80).required(),
  username: Joi.string().trim().alphanum().min(3).max(50).required(),
  email: Joi.string().trim().email().max(150).required(),
  password: Joi.string().min(8).max(72).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Las contraseñas no coinciden',
  }),
});

export const loginSchema = Joi.object({
  identifier: Joi.string().trim().required(),
  password: Joi.string().required(),
});

export const profileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(80).required(),
  lastName: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().email().max(150).required(),
  bio: Joi.string().allow('').max(500).optional(),
});

export const publicationSchema = Joi.object({
  type: Joi.string().valid('dish', 'recipe').required(),
  title: Joi.string().trim().min(3).max(150).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  categoryId: Joi.number().integer().positive().required(),
  ingredients: Joi.when('type', {
    is: 'recipe',
    then: Joi.string().trim().min(3).max(3000).required(),
    otherwise: Joi.string().allow('').max(3000).optional(),
  }),
  instructions: Joi.when('type', {
    is: 'recipe',
    then: Joi.string().trim().min(3).max(3000).required(),
    otherwise: Joi.string().allow('').max(3000).optional(),
  }),
  tagIds: Joi.array()
    .items(Joi.number().integer().positive())
    .single()
    .unique()
    .max(5)
    .default([])
    .messages({
      'array.max': 'Solo puedes elegir hasta 5 etiquetas.',
      'array.unique': 'No repitas etiquetas.',
      'number.base': 'Una etiqueta no es válida.',
    }),
});

export const commentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required(),
});

export const ratingSchema = Joi.object({
  score: Joi.number().integer().min(1).max(5).required(),
});

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'hate',
  'violence',
  'sexual',
  'other',
];

export const REPORT_REASON_LABELS = {
  spam: 'Spam o publicidad',
  harassment: 'Acoso o insultos',
  hate: 'Discurso de odio',
  violence: 'Violencia',
  sexual: 'Contenido sexual',
  other: 'Otro motivo',
};

export const reportSchema = Joi.object({
  reason: Joi.string()
    .valid(...REPORT_REASONS)
    .required()
    .messages({
      'any.only': 'Selecciona un motivo válido',
      'any.required': 'Selecciona un motivo',
      'string.empty': 'Selecciona un motivo',
    }),
  details: Joi.string().trim().allow('').max(500).optional().messages({
    'string.max': 'Los detalles no pueden superar los 500 caracteres',
  }),
});

export const categorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required().messages({
    'string.empty': 'Escribe el nombre de la categoría',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede superar los 80 caracteres',
    'any.required': 'Escribe el nombre de la categoría',
  }),
  description: Joi.string().trim().allow('').max(255).optional().messages({
    'string.max': 'La descripción no puede superar los 255 caracteres',
  }),
});

export const tagSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Escribe el nombre de la etiqueta',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede superar los 50 caracteres',
    'any.required': 'Escribe el nombre de la etiqueta',
  }),
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Acepta solo fechas reales en formato AAAA-MM-DD (rechaza 2026-02-31).
const isRealDate = (value, helpers) => {
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return helpers.error('date.invalid');
  }

  return value;
};

const optionalDate = (invalidMessage) =>
  Joi.string()
    .trim()
    .empty('')
    .pattern(ISO_DATE)
    .custom(isRealDate)
    .messages({
      'string.pattern.base': invalidMessage,
      'date.invalid': invalidMessage,
    });

const documentFields = {
  documentNumber: Joi.string()
    .trim()
    .uppercase()
    .min(4)
    .max(50)
    .pattern(/^[A-Z0-9-]+$/)
    .required()
    .messages({
      'any.required': 'Escribe el número de documento',
      'string.empty': 'Escribe el número de documento',
      'string.min': 'El número de documento debe tener al menos 4 caracteres',
      'string.max': 'El número de documento no puede superar los 50 caracteres',
      'string.pattern.base':
        'El número de documento solo puede tener letras, números y guiones',
    }),
  issuedAt: optionalDate('La fecha de expedición no es válida'),
  expiresAt: optionalDate('La fecha de vencimiento no es válida')
    .custom((value, helpers) => {
      const { issuedAt } = helpers.state.ancestors[0];

      // Las fechas AAAA-MM-DD se pueden comparar como texto.
      if (issuedAt && value < issuedAt) {
        return helpers.error('date.order');
      }

      return value;
    })
    .messages({
      'date.order':
        'La fecha de expedición no puede ser posterior a la de vencimiento',
    }),
};

export const documentSchema = Joi.object({
  documentTypeId: Joi.number().integer().positive().required().messages({
    'any.required': 'Selecciona un tipo de documento',
    'number.base': 'Selecciona un tipo de documento',
    'number.integer': 'Selecciona un tipo de documento',
    'number.positive': 'Selecciona un tipo de documento',
  }),
  ...documentFields,
});

// El tipo de documento no se cambia al editar (se elimina y se vuelve a crear).
export const documentUpdateSchema = Joi.object(documentFields);

export const firstError = (error) => error.details[0].message;

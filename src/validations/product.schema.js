import Joi from 'joi';

export const listProductsSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().trim().allow(''),
    brand: Joi.string().trim(),
    tag: Joi.string().trim(),
    rx: Joi.boolean(),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(12),
    sort: Joi.string()
      .valid('price', '-price', 'title', '-title', 'createdAt', '-createdAt')
      .default('createdAt'),
  }),
  params: Joi.object({}),
  body: Joi.object({}),
});

export const getProductByIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({}),
  body: Joi.object({}),
});

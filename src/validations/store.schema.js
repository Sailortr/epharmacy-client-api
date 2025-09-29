import Joi from 'joi';

export const listStoresSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().trim().allow(''),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
  params: Joi.object({}),
  body: Joi.object({}),
});

export const nearestStoresSchema = Joi.object({
  query: Joi.object({
    lng: Joi.number().required(),
    lat: Joi.number().required(),
    max: Joi.number().integer().min(100).max(50000).default(5000),
    limit: Joi.number().integer().min(1).max(50).default(10),
  }),
  params: Joi.object({}),
  body: Joi.object({}),
});

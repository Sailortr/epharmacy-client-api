import Joi from 'joi';

export const listCustomerReviewsSchema = Joi.object({
  query: Joi.object({
    storeId: Joi.string().hex().length(24).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('newest', 'oldest', 'rating', '-rating').default('newest'),
  }),
  params: Joi.object({}),
  body: Joi.object({}),
});

export const createReviewSchema = Joi.object({
  body: Joi.object({
    storeId: Joi.string().hex().length(24).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().max(1000).allow(''),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

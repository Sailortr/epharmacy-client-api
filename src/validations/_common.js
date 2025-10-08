import Joi from 'joi';

export const objectId = Joi.string().hex().length(24);
export const page = Joi.number().integer().min(1).default(1);
export const limit = Joi.number().integer().min(1).max(50).default(10);

export const reviewSort = Joi.string()
  .valid('newest', 'oldest', 'rating', '-rating')
  .default('newest');

export const text = Joi.string().trim().min(1).max(1000);
export const rating = Joi.number().integer().min(1).max(5);
export default { objectId, page, limit, reviewSort, text, rating };

import Joi from 'joi';
import { objectId, page, limit, reviewSort, text, rating } from './_common.js';

export const createReviewSchema = {
  body: Joi.object({
    productId: objectId.when('product', { not: Joi.exist(), then: Joi.required() }),
    product: objectId,
    rating: rating.required(),
    comment: text.allow('', null).optional(),
  }).or('productId', 'product'),
};

export const listCustomerReviewsSchema = {
  query: Joi.object({
    productId: objectId.required(),
    page,
    limit,
    sort: reviewSort,
  }),
};

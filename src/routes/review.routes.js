import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { listCustomerReviewsSchema, createReviewSchema } from '../validations/review.schema.js';
import { listCustomerReviews, createOrUpdateReview } from '../controllers/review.controller.js';

const r = Router();

r.get('/customer-reviews', validate(listCustomerReviewsSchema), listCustomerReviews);
r.post('/reviews', requireAuth, validate(createReviewSchema), createOrUpdateReview);

export default r;

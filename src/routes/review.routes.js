// Backend: src/routes/review.routes.js
// GÜNCELLENMIŞ VERSİYON

import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { listCustomerReviewsSchema, createReviewSchema } from '../validations/review.schema.js';
import {
  listCustomerReviews,
  getHomepageTestimonials,
  createOrUpdateReview,
} from '../controllers/review.controller.js';

const r = Router();

r.get('/testimonials', getHomepageTestimonials);

r.get('/customer-reviews', validate(listCustomerReviewsSchema), listCustomerReviews);

r.post('/reviews', requireAuth, validate(createReviewSchema), createOrUpdateReview);

export default r;

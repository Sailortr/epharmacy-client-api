import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { getCartSchema, updateCartSchema, checkoutSchema } from '../validations/cart.schema.js';
import { getCart, updateCart, checkout } from '../controllers/cart.controller.js';

const r = Router();

r.get('/cart', requireAuth, validate(getCartSchema), getCart);
r.put('/cart/update', requireAuth, validate(updateCartSchema), updateCart);
r.post('/cart/checkout', requireAuth, validate(checkoutSchema), checkout);

export default r;

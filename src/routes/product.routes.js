import { Router } from 'express';
import { listProducts, getProductById } from '../controllers/product.controller.js';
import { validate } from '../middlewares/validate.js';
import { listProductsSchema, getProductByIdSchema } from '../validations/product.schema.js';

const r = Router();

r.get('/products', validate(listProductsSchema), listProducts);
r.get('/products/:id', validate(getProductByIdSchema), getProductById);

export default r;

import { Router } from 'express';
import {
  createOrder,
  listMyOrders,
  listOrders,
  getOrder,
  updateOrderStatus,
} from '../controllers/order.controller.js';

const r = Router();

r.post('/orders', createOrder);
r.get('/orders/me', listMyOrders);
r.get('/orders', listOrders);
r.get('/orders/:id', getOrder);
r.patch('/orders/:id/status', updateOrderStatus);

export default r;

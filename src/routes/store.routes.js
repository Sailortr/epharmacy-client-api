import { Router } from 'express';
import { listStores, nearestStores } from '../controllers/store.controller.js';
import { validate } from '../middlewares/validate.js';
import { listStoresSchema, nearestStoresSchema } from '../validations/store.schema.js';

const router = Router();

router.get('/stores', validate(listStoresSchema), listStores);
router.get('/stores/nearest', validate(nearestStoresSchema), nearestStores);

export default router;

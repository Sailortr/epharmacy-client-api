import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Store from '../models/store.model.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';

(async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Store.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
  ]);
  console.log('✓ Database wiped.');
  await mongoose.disconnect();
})();

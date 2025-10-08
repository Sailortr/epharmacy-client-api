import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Store from '../models/store.model.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';

async function main() {
  await connectDB();

  console.log('→ Dropping indexes (safe) ...');
  await Promise.allSettled([
    User.collection?.dropIndexes(),
    Store.collection?.dropIndexes(),
    Product.collection?.dropIndexes(),
    Review.collection?.dropIndexes(),
  ]);

  console.log('→ Clearing existing data...');
  await Promise.all([
    Review.deleteMany({}),
    Product.deleteMany({}),
    Store.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log('→ Inserting seed users...');
  const passwordHash = await bcrypt.hash('Passw0rd!', 10);
  const [u1, u2] = await User.create([
    { name: 'Demo Customer', email: 'demo@pharma.test', passwordHash, role: 'customer' },
    { name: 'Admin', email: 'admin@pharma.test', passwordHash, role: 'admin' },
  ]);

  console.log('→ Inserting seed stores...');
  const stores = await Store.create([
    {
      name: 'Central Pharmacy Beşiktaş',
      address: 'Beşiktaş, İstanbul',
      phones: ['+90 212 000 0001'],
      location: { type: 'Point', coordinates: [29.025, 41.043] },
      services: ['Rx', 'OTC', 'Dermocosmetics'],
      isActive: true,
    },
    {
      name: 'Kadıköy Health Pharmacy',
      address: 'Kadıköy, İstanbul',
      phones: ['+90 216 000 0002'],
      location: { type: 'Point', coordinates: [29.03, 40.99] },
      services: ['Rx', 'OTC'],
      isActive: true,
    },
    {
      name: 'Şişli Night Pharmacy',
      address: 'Şişli, İstanbul',
      phones: ['+90 212 000 0003'],
      location: { type: 'Point', coordinates: [28.98, 41.06] },
      services: ['OTC', '24/7'],
      isActive: true,
    },
  ]);

  console.log('→ Inserting seed products...');
  const products = await Product.create([
    {
      title: 'Paracetamol 500mg 20 Tablets',
      slug: 'paracetamol-500-20tb',
      brand: 'HealCo',
      form: 'tablet',
      price: 79.9,
      stock: 120,
      tags: ['analgesic', 'fever'],
      storeId: stores[0]._id,
      rxRequired: false,
      description: 'Pain and fever reducer.',
    },
    {
      title: 'Ibuprofen 400mg 24 Tablets',
      slug: 'ibuprofen-400-24tb',
      brand: 'ReliefPharma',
      form: 'tablet',
      price: 129.5,
      stock: 80,
      tags: ['anti-inflammatory', 'analgesic'],
      storeId: stores[0]._id,
      rxRequired: false,
    },
    {
      title: 'Amoxicillin 500mg 16 Capsules',
      slug: 'amoxicillin-500-16cp',
      brand: 'BioMeds',
      form: 'capsule',
      price: 189.0,
      stock: 45,
      tags: ['antibiotic'],
      storeId: stores[1]._id,
      rxRequired: true,
      description: 'Antibiotic. Prescription required.',
    },
    {
      title: 'Vitamin C 1000mg Effervescent 20',
      slug: 'vitc-1000-eff-20',
      brand: 'VitaPlus',
      form: 'effervescent',
      price: 99.0,
      stock: 200,
      tags: ['immune', 'vitamin'],
      storeId: stores[2]._id,
      rxRequired: false,
    },
    {
      title: 'Nasal Spray 0.05% 10ml',
      slug: 'nasal-spray-005-10ml',
      brand: 'Airline',
      form: 'spray',
      price: 74.0,
      stock: 60,
      tags: ['cold', 'nasal'],
      storeId: stores[1]._id,
      rxRequired: false,
    },
  ]);

  console.log('→ Inserting seed reviews...');
  await Review.create([
    {
      userId: u1._id,
      productId: products[0]._id,
      storeId: products[0].storeId,
      rating: 5,
      comment: 'Very fast service, thank you!',
    },
    {
      userId: u1._id,
      productId: products[1]._id,
      storeId: products[1].storeId,
      rating: 4,
      comment: 'Good stock, reasonable prices.',
    },
  ]);

  console.log('→ Computing product rating summaries...');
  const summary = await Review.aggregate([
    { $group: { _id: '$productId', count: { $sum: 1 }, avg: { $avg: '$rating' } } },
  ]);
  const bulk = Product.collection.initializeUnorderedBulkOp();
  summary.forEach((s) => {
    bulk.find({ _id: s._id }).updateOne({
      $set: { ratingCount: s.count, ratingAverage: Number(s.avg.toFixed(2)) },
    });
  });
  if (summary.length) await bulk.execute();

  console.log('→ Syncing indexes...');
  await Promise.all([
    User.syncIndexes(),
    Store.syncIndexes(),
    Product.syncIndexes(),
    Review.syncIndexes(),
  ]);

  console.log('✓ Seed completed.');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

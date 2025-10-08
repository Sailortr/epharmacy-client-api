// test/utils/db.js
import mongoose from 'mongoose';

/**
 * Koleksiyonları boşaltır; schema/index yapısı korunur.
 * test/helpers/db.js içindeki clearCollections ile aynı davranışı sağlar.
 */
export async function clearDatabase() {
  if (mongoose.connection.readyState !== 1) return;
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

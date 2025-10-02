import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export async function connectMemoryMongo() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { dbName: 'testdb' });
}

export async function disconnectMemoryMongo() {
  await mongoose.connection?.dropDatabase();
  await mongoose.connection?.close();
  if (mongod) await mongod.stop();
}

export async function clearCollections() {
  const { collections } = mongoose.connection;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
}

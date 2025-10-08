import mongoose from 'mongoose';
import os from 'os';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

export async function connectMemoryMongo() {
  if (mongoose.connection.readyState === 1) return;

  mongoose.set('bufferCommands', false);
  mongoose.set('bufferTimeoutMS', 0);
  mongoose.set('autoIndex', true);
  mongoose.set('autoCreate', true);

  const externalUri = process.env.TEST_MONGO_URI?.trim();
  if (externalUri) {
    await mongoose.connect(externalUri, {
      dbName: process.env.TEST_DB_NAME || 'epharmacy_test',
      serverSelectionTimeoutMS: 30_000,
    });
    await mongoose.connection.asPromise();
    return;
  }

  if (!mongod) {
    mongod = await MongoMemoryServer.create({
      binary: {
        downloadDir: path.join(os.homedir(), '.cache', 'mongodb-binaries'),
      },
    });
  }

  const uri = mongod.getUri();
  await mongoose.connect(uri, {
    dbName: 'testdb',
    serverSelectionTimeoutMS: 30_000,
  });
  await mongoose.connection.asPromise();
}

export async function clearCollections() {
  if (mongoose.connection.readyState !== 1) return;
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((col) => col.deleteMany({})));
}

export async function disconnectMemoryMongo() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  } finally {
    if (mongod) {
      await mongod.stop();
      mongod = null;
    }
  }
}

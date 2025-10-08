import http from 'http';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { app } from './app.js';

let server;
let isShuttingDown = false;

export async function start() {
  try {
    if (env.nodeEnv === 'test') {
      mongoose.set('bufferCommands', false);
      mongoose.set('bufferTimeoutMS', 0);
      mongoose.set('autoIndex', true);
      mongoose.set('autoCreate', true);
    }

    await connectDB();

    if (env.nodeEnv === 'test') {
      console.log('▶ Test environment: HTTP server not started (only DB connected).');
      return null;
    }

    server = http.createServer(app).listen(env.port, () => {
      console.log(`▶ e-Pharmacy API listening on :${env.port}`);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('❌ Unhandled Rejection:', reason);
      shutdown('unhandledRejection', 1);
    });

    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      shutdown('uncaughtException', 1);
    });

    process.on('SIGTERM', () => shutdown('SIGTERM', 0));
    process.on('SIGINT', () => shutdown('SIGINT', 0));

    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

export function shutdown(signal, code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} received, shutting down...`);

  const closeAndExit = async () => {
    try {
      await mongoose.connection.close(false);
      console.log('✓ MongoDB disconnected.');
    } catch (e) {
      console.error('⚠ Error while closing MongoDB:', e);
    } finally {
      process.exit(code);
    }
  };

  if (server && server.listening) {
    server.close(() => {
      console.log('✓ HTTP server closed.');
      closeAndExit();
    });
  } else {
    closeAndExit();
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

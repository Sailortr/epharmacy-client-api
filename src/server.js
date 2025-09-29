import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import mongoose from 'mongoose';

let server;
let isShuttingDown = false;

async function start() {
  try {
    await connectDB();

    server = app.listen(env.port, () => {
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
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

function shutdown(signal, code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} received, shutting down...`);

  if (server) {
    server.close(async () => {
      try {
        await mongoose.connection.close(false);
        console.log('✓ HTTP server closed, MongoDB disconnected.');
      } catch (e) {
        console.error('⚠ Error while closing MongoDB:', e);
      } finally {
        process.exit(code);
      }
    });
  } else {
    mongoose.connection.close(false).finally(() => process.exit(code));
  }
}

start();

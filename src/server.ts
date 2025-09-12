import mongoose from 'mongoose';
import app from './app';
import config from './app/config';
import { cleanupScheduler } from './app/modules/cleanup/cleanup.scheduler';
import { notificationScheduler } from './app/modules/notification/notification.scheduler';

async function main() {
  console.log('🔄 Starting Kocial Pilot Backend...');

  try {
    console.log('🔄 Attempting to connect to MongoDB...');

    // Try to connect to MongoDB with a shorter timeout
    await mongoose.connect(config.database_url as string, {
      tls: true,
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 3000, // Shorter timeout
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log(`\x1b[32m 📦 MongoDB connected successfully \x1b[0m`);

    // Start cleanup scheduler after successful DB connection
    cleanupScheduler.start();
    console.log('🧹 Cleanup scheduler initialized');

    // Initialize notification scheduler
    await notificationScheduler.initialize();
    console.log('🔔 Notification scheduler initialized');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log('⚠️  MongoDB connection failed:', error.message);
    console.log('⚠️  Starting server without database connection...');
    console.log('⚠️  Some features may not work properly');
  }

  // Always start the server, even without DB connection
  const server = app.listen(8000, () => {
    console.log(
      `\x1b[42m 🚀 Kocial Pilot Backend running on port ${8000} \x1b[0m`
    );
    console.log(`\x1b[36m 🌐 Environment: ${config.NODE_ENV} \x1b[0m`);
    console.log(`\x1b[36m 📱 Frontend URL: ${config.frontend_url} \x1b[0m`);

    // If DB failed, show additional warning
    if (!mongoose.connection.readyState) {
      console.log('\n⚠️  WARNING: Database connection failed');
      console.log('⚠️  Please check your MongoDB configuration');
      console.log('⚠️  Some API endpoints may not work');
    }
  });

  // Handle graceful shutdown
  const exitHandler = () => {
    // Stop cleanup scheduler
    cleanupScheduler.stop();

    if (server) {
      server.close(() => {
        console.log('⚠️  Server closed');
      });
    }
    process.exit(1);
  };

  const unexpectedErrorHandler = (error: unknown) => {
    console.log('❌ Unexpected error:', error);
    exitHandler();
  };

  process.on('uncaughtException', unexpectedErrorHandler);
  process.on('unhandledRejection', unexpectedErrorHandler);

  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received');
    if (server) {
      server.close();
    }
  });
}

main();

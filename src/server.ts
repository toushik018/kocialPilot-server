/* eslint-disable no-console */
import mongoose from 'mongoose';
import app from './app';
import config from './app/config';

async function main() {
  try {
    // Set up mongoose connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('\x1b[42m ✓ Database connected successfully!\x1b[0m');
    });

    mongoose.connection.on('error', (err) => {
      console.error('\x1b[41m ✕ Database connection error:\x1b[0m', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('\x1b[43m ✕ Database disconnected\x1b[0m');
    });

    // Connect to MongoDB
    console.log('\x1b[33m ⚡︎Connecting to database...\x1b[0m');
    await mongoose.connect(config.database_url as string);

    // Start the server
    app.listen(config.port, () => {
      console.log(
        `\x1b[42m ✓ Kocial Pilot Backend listening on port ${config.port}\x1b[0m`
      );
      console.log(
        `\x1b[36m ✓ Server URL: http://localhost:${config.port}\x1b[0m`
      );
      console.log('\x1b[32m ✓ Server is ready to accept requests!\x1b[0m');
    });
  } catch (error) {
    console.error('\x1b[41m ✕ Database connection failed!\x1b[0m');
    console.error('\x1b[31m Error details:\x1b[0m', error);
    console.error(
      '\x1b[33m ✕ Please check your DATABASE_URL in .env file\x1b[0m'
    );
    process.exit(1);
  }
}

main().catch((err) => console.log(err));

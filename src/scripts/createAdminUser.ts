import mongoose from 'mongoose';
import config from '../app/config';
import { User } from '../app/modules/auth/auth.model';

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database_url as string);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: 'admin@susko.ai' });

    if (existingUser) {
      console.log('Admin user already exists');

      // Update role to admin if not already
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(
          `User ${existingUser.email} role updated to admin successfully`
        );
      } else {
        console.log(`User ${existingUser.email} is already an admin`);
      }

      process.exit(0);
    }

    // Create new admin user
    const newUser = await User.create({
      email: 'admin@susko.ai',
      password: '123456',
      firstName: 'Susko',
      lastName: 'Ai',
      isEmailVerified: true,
      isActive: true,
      role: 'admin',
      preferences: {
        timezone: 'UTC',
        language: 'en',
        notifications: {
          email: true,
          push: true,
        },
      },
      socialAccounts: [],
    });

    console.log(`Admin user created successfully:`);
    console.log(`Name: Susko Ai`);
    console.log(`Username: suskoai`);
    console.log(`Email: admin@susko.ai`);
    console.log(`Role: ${newUser.role}`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();

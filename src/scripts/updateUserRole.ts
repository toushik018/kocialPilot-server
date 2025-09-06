import mongoose from 'mongoose';
import config from '../app/config';
import { User } from '../app/modules/auth/auth.model';

async function updateUserRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database_url as string);
    // Find the user and update their role to admin
    const user = await User.findOne({ email: 'admin@susko.ai' });

    if (!user) {
      process.stderr.write('User not found\n');
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    process.stdout.write(
      `User ${user.email} role updated to admin successfully\n`
    );
    process.exit(0);
  } catch (error) {
    process.stderr.write(`Error updating user role: ${error}\n`);
    process.exit(1);
  }
}

updateUserRole();
